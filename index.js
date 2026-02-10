import express from 'express'
import puppeteer from 'puppeteer'
import { generateStatsDashboardSVG } from './svg.js';
import fs from 'fs';
import { getCurrentWeekData } from './getWeekData.js';


const app = express();
app.use(express.static('public')); // Serve static files from the "public" directory
const PORT = process.env.PORT || 3000;

// Cache configuration
let cache = {
    data: null,
    timestamp: null,
    ttl: 5 * 60 * 1000 // 5 minutes
};

// Browser instance (reuse for better performance)
let browser = null;


async function getBrowser() {
    if (!browser) {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });
    }
    return browser;
}

async function scrapeGitHubContributions(username) {
    // Check cache first
    // if (cache.data && Date.now() - cache.timestamp < cache.ttl) {
    //     console.log('Serving from cache');
    //     return cache.data;
    // }

    console.log('Fetching fresh data from GitHub');

    let page;
    try {
        const browserInstance = await getBrowser();
        page = await browserInstance.newPage();

        // Set viewport and user agent
        await page.setViewport({ width: 1280, height: 800 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

        // Navigate to GitHub profile
        await page.goto(`https://github.com/${username}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait for contribution graph to load
        // GitHub uses these selectors for the contribution graph
        await page.waitForSelector('.js-calendar-graph', { timeout: 10000 });

        // Extract contribution data
        const data = await page.evaluate(() => {
            const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            // Get total contributions this year
            const contributionHeader = document.querySelector('.js-yearly-contributions h2');
            const totalText = contributionHeader ? contributionHeader.textContent.trim() : '';
            const totalMatch = totalText.match(/(\d+[\d,]*)\s+contribution/);
            const totalContributions = totalMatch ? parseInt(totalMatch[1].replace(/,/g, '')) : 0;

            // Get current streak (consecutive days with contributions)
            const days = Array.from(document.querySelectorAll('.ContributionCalendar-day'));
            let weeklyData = [];
            const daysData = days.map(element => {
                const toolTipId = element.getAttribute("aria-labelledby")
                const contributions = document.getElementById(toolTipId)?.textContent?.trim().split(" ")[0] || "0";


                if(element.getAttribute("data-ix")=='52'){
                    const elementId = element.getAttribute("id");
                    const indexInfo = elementId.split("-");
                    const dayIndex = parseInt(indexInfo[indexInfo.length - 2]); // Convert to 0-based index
                    weeklyData.push({
                        day: WEEK_DAYS[dayIndex],
                        value:Number(contributions) || 0
                    })
                }

                return ({
                    contributions: Number(contributions),
                    level: Number(element.getAttribute("data-level")),
                    // raw_date: element.getAttribute("data-date"),
                    date: Math.floor(new Date(element.getAttribute("data-date")).getTime() / (1000 * 60 * 60))
                })
            })
            const data = daysData.toSorted((a, b) => b.date - a.date)
            const totalContributionsLastYear = data.reduce((sum, day) => sum + (day.contributions || 0), 0);
            const totalDaysContributedLastYear = data.filter(day => day.contributions > 0).length;
            const todaysIndex = weeklyData.length;

            let currentStreak = 0;
            if (data[0].level === 0 && data[1]?.level === 0) {
                currentStreak = 0;
            } else {
                for (let i = 0; i < data.length; i++) {
                    const day = data[i];

                    // Stop when we hit first zero (except today)
                    if (day.level === 0) {
                        if (i === 0) continue; // today is allowed to be zero
                        break;
                    }

                    currentStreak++;
                }
            }

            for (let weekDay of WEEK_DAYS) {
                if (!weeklyData.some(d => d.day === weekDay)) {
                    weeklyData.push({
                        day: weekDay,
                        value: null
                    })
                }
            }
            return {currentStreak, totalContributionsLastYear, totalDaysContributedLastYear, weeklyData, todaysIndex};
        });

        console.log(data)
        // Update cache
        cache.data = data;
        cache.timestamp = Date.now();

        await page.close();
        console.log("successful")
        return data;

    } catch (error) {
        console.error('Scraping error:', error.message);
        if (page) await page.close();

        // Return cached data if available
        if (cache.data) {
            console.log('Error occurred, serving stale cache');
            return cache.data;
        }

        return { error: 'Failed to fetch GitHub contributions' };
    }
}

// Multiple stats badges
app.get('/badge.svg', async (req, res) => {
    const username = req.query.username || process.env.GITHUB_USERNAME || 'torvalds';
    // const stat = req.params.stat;
    
    const data = await scrapeGitHubContributions(username);
    console.log("data from scrapeGitHubContributions", data.weeklyData)
    // fs.writeFileSync("data.json", JSON.stringify(data.weekData, null, 2))

    const svg = generateStatsDashboardSVG({
        contributionsThisYear: data.totalContributionsLastYear,
        currentStreak: data.currentStreak,
        daysThisYear: data.totalDaysContributedLastYear,
        weeklyData: data.weeklyData,
        todaysIndex: data.todaysIndex
    })



    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'max-age=300');
    res.send(svg.trim());
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing browser...');
    if (browser) {
        await browser.close();
    }
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`🚀 GitHub Contribution Scraper running on port ${PORT}`);
    console.log(`📊 Badge: http://localhost:${PORT}/badge.svg?username=yourname`);
});
import express from 'express'
import puppeteer, { Browser } from 'puppeteer'

const app = express();
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
    if (cache.data && Date.now() - cache.timestamp < cache.ttl) {
        console.log('Serving from cache');
        return cache.data;
    }

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
        console.log("successfully on page...")

        // Wait for contribution graph to load
        // GitHub uses these selectors for the contribution graph
        await page.waitForSelector('.js-calendar-graph', { timeout: 10000 });
        console.log("selector found..\n starting ebaluating page")

        // Extract contribution data
        const data = await page.evaluate(() => {
            console.log("ïnside page.evaluate")
            // Get total contributions this year
            const contributionHeader = document.querySelector('.js-yearly-contributions h2');
            const totalText = contributionHeader ? contributionHeader.textContent.trim() : '';
            const totalMatch = totalText.match(/(\d+[\d,]*)\s+contribution/);
            const totalContributions = totalMatch ? parseInt(totalMatch[1].replace(/,/g, '')) : 0;

            // Get current streak (consecutive days with contributions)
            const days = Array.from(document.querySelectorAll('.ContributionCalendar-day'));
            console.log(days)
            const daysData = days.map(element => {
                const toolTipId = element.getAttribute("aria-labelledby")
                console.log("toolTipId", toolTipId)
                const contributions = document.getElementById(toolTipId)?.textContent?.trim().split(" ")[0] || "0"
                console.log(contributions)
                return ({
                    contributions: Number(contributions),
                    level: Number(element.getAttribute("data-level")),
                    date: Math.floor(new Date(element.getAttribute("data-date")).getTime() / (1000 * 60 * 60))
                })

            })
            const data = daysData.toSorted((a, b) => b.date - a.date)
            // return data
            let currentStreak = 0;
            let longestStreak = 0;
            let tempStreak = 0;

            // Count from most recent day backwards
            // const daysArray = Array.from(days).reverse();
            let foundNonZero = false;
            let i = 0
            for (const day of data) {
                if (i == 0 & day.level > 1) {
                    currentStreak = 1
                } else {

                }
                if (day.level > 0) {
                    foundNonZero = true;
                    tempStreak++;
                    if (!currentStreak) currentStreak = tempStreak;
                } else if (foundNonZero) {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 0;
                }
            }
            longestStreak = Math.max(longestStreak, tempStreak);

            // Get contribution levels (0-4 scale for color intensity)
            const levels = Array.from(days).map(day => ({
                date: day.getAttribute('data-date'),
                level: parseInt(day.getAttribute('data-level') || '0'),
                count: parseInt(day.getAttribute('data-count') || '0')
            }));

            // Calculate this week's contributions
            const today = new Date();
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const thisWeek = levels.filter(d => {
                const date = new Date(d.date);
                return date >= weekAgo && date <= today;
            }).reduce((sum, d) => sum + d.count, 0);

            return {
                totalContributions,
                currentStreak,
                longestStreak,
                thisWeek,
                lastUpdate: new Date().toISOString()
            };
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

// SVG badge endpoint
app.get('/badge.svg', async (req, res) => {
    const username = req.query.username || process.env.GITHUB_USERNAME || 'torvalds';
    const label = req.query.label || 'Contributions';

    const data = await scrapeGitHubContributions(username);

    const value = data.error ? 'Error' : (data.totalContributions || 'N/A');
    const color = data.error ? 'red' :
        data.totalContributions > 1000 ? 'brightgreen' :
            data.totalContributions > 500 ? 'green' :
                data.totalContributions > 100 ? 'yellow' : 'orange';

    const labelWidth = label.length * 7 + 10;
    const valueWidth = String(value).length * 7 + 10;
    const totalWidth = labelWidth + valueWidth;

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
      <linearGradient id="b" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
      </linearGradient>
      <mask id="a">
        <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
      </mask>
      <g mask="url(#a)">
        <path fill="#555" d="M0 0h${labelWidth}v20H0z"/>
        <path fill="#${color}" d="M${labelWidth} 0h${valueWidth}v20H${labelWidth}z"/>
        <path fill="url(#b)" d="M0 0h${totalWidth}v20H0z"/>
      </g>
      <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
        <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
        <text x="${labelWidth / 2}" y="14">${label}</text>
        <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
        <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
      </g>
    </svg>
  `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'max-age=300'); // 5 minutes
    res.send(svg.trim());
});

// Multiple stats badges
app.get('/badge/:stat.svg', async (req, res) => {
    const username = req.query.username || process.env.GITHUB_USERNAME || 'torvalds';
    const stat = req.params.stat;

    const data = await scrapeGitHubContributions(username);

    let label, value, color;

    switch (stat) {
        case 'streak':
            label = 'Current Streak';
            value = data.error ? 'Error' : `${data.currentStreak} days`;
            color = data.error ? 'red' : data.currentStreak > 30 ? 'brightgreen' : 'green';
            break;
        case 'weekly':
            label = 'This Week';
            value = data.error ? 'Error' : data.thisWeek;
            color = data.error ? 'red' : data.thisWeek > 20 ? 'brightgreen' : 'green';
            break;
        case 'longest':
            label = 'Longest Streak';
            value = data.error ? 'Error' : `${data.longestStreak} days`;
            color = data.error ? 'red' : 'blue';
            break;
        default:
            label = 'Contributions';
            value = data.error ? 'Error' : data.totalContributions;
            color = data.error ? 'red' : 'brightgreen';
    }

    const labelWidth = label.length * 6.5 + 10;
    const valueWidth = String(value).length * 7 + 10;
    const totalWidth = labelWidth + valueWidth;

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
      <linearGradient id="b" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
      </linearGradient>
      <mask id="a">
        <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
      </mask>
      <g mask="url(#a)">
        <path fill="#555" d="M0 0h${labelWidth}v20H0z"/>
        <path fill="#${color}" d="M${labelWidth} 0h${valueWidth}v20H${labelWidth}z"/>
        <path fill="url(#b)" d="M0 0h${totalWidth}v20H0z"/>
      </g>
      <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
        <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
        <text x="${labelWidth / 2}" y="14">${label}</text>
        <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
        <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
      </g>
    </svg>
  `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'max-age=300');
    res.send(svg.trim());
});

// JSON API endpoint
app.get('/api/contributions/:username', async (req, res) => {
    const username = req.params.username;
    const data = await scrapeGitHubContributions(username);
    res.json(data);
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        cache: cache.data ? 'active' : 'empty'
    });
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
    console.log(`🔥 Streak: http://localhost:${PORT}/badge/streak.svg?username=yourname`);
    console.log(`📈 JSON API: http://localhost:${PORT}/api/contributions/yourname`);
});
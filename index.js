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

            return currentStreak;
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

// Multiple stats badges
app.get('/badge.svg', async (req, res) => {
    const username = req.query.username || process.env.GITHUB_USERNAME || 'torvalds';
    // const stat = req.params.stat;

    const currentStreak = await scrapeGitHubContributions(username);
    console.log("Current Streak: ", currentStreak)

    const width = 400
    const height = 550

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
        <svg
        xmlns="http://www.w3.org/2000/svg"
        width="${width}"
        height="${height}"
        viewBox="0 0 ${width} ${height}"
        >
            <defs>
                <linearGradient id="fireGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#FFD700" stop-opacity="1" />
                <stop offset="50%" stop-color="#FF6B35" stop-opacity="1" />
                <stop offset="100%" stop-color="#D92E1D" stop-opacity="1" />
                </linearGradient>

                <linearGradient id="flameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stop-color="#FF6B35" stop-opacity="1" />
                <stop offset="60%" stop-color="#FFA500" stop-opacity="1" />
                <stop offset="100%" stop-color="#FFD700" stop-opacity="0.8" />
                </linearGradient>

                <radialGradient id="fireGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#FF6B35" stop-opacity="0.6" />
                <stop offset="100%" stop-color="#FF6B35" stop-opacity="0" />
                </radialGradient>

                <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#1A1A2E" stop-opacity="1" />
                <stop offset="100%" stop-color="#16213E" stop-opacity="1" />
                </linearGradient>

                <filter id="textGlow">
                    <feGaussianBlur std-deviation="2" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="4" std-deviation="3" flood-opacity="0.3" />
                </filter>
            </defs>
            <rect
                width="${width}"
                height="${height}"
                fill="url(#bgGradient)"
                rx="24"
            />

            <rect
                width="${width}"
                height="${height}"
                fill="none"
                stroke="#FF6B35"
                stroke-width="2"
                rx="24"
                opacity="0.3"
            />
    `;

    const xMainFire = width / 2
    const yMainFire = 80
    const sizeMainFire = 60

    svg = svg.concat(`
            <g>
                <circle
                cx="${xMainFire}"
                cy="${yMainFire}"
                r="${sizeMainFire * 0.7}"
                fill="url(#fireGlow)"
                opacity="0.3"
                />

                <circle cx="${xMainFire}" cy="${yMainFire}" r="${sizeMainFire / 2}" fill="#FF6B35" />

                <ellipse
                cx="${xMainFire}"
                cy="${yMainFire - sizeMainFire / 3}"
                rx="${sizeMainFire / 3}"
                ry="${sizeMainFire / 1.5}"
                fill="url(#fireGradient)"
                />

                <path
                d="M ${xMainFire - sizeMainFire / 3} ${yMainFire + sizeMainFire / 2} Q ${xMainFire} ${yMainFire - sizeMainFire} ${xMainFire + sizeMainFire / 3} ${yMainFire + sizeMainFire / 2}"
                fill="url(#flameGradient)"
                />

                <ellipse
                cx="${xMainFire}"
                cy="${yMainFire - sizeMainFire / 1.8}"
                rx="${sizeMainFire / 4}"
                ry="${sizeMainFire / 2.5}"
                fill="#FFD700"
                opacity="0.9"
                />
            </g>

            <text
                x="${width / 2}"
                y="${200}"
                font-size="72"
                font-weight="700"
                font-family="Arial, sans-serif"
                text-anchor="middle"
                fill="url(#fireGradient)"
                filter="url(#textGlow)"
                letter-spacing="-2"
            >
                ${currentStreak}
            </text>
            <text
                x="${width / 2}"
                y="${235}"
                font-size="28"
                font-weight="500"
                font-family="Arial, sans-serif"
                text-anchor="middle"
                fill="#FF9966"
                opacity="0.9"
                letter-spacing="1"
            >
                days streak
            </text>
        `)

    Array.from({ length: 7 }).forEach((_, idx) => {
        const fireX = width / 2 - ((7 - 1) * (35 + 20)) / 2 + idx * (35 + 20);
        const fireY = 340;

        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayLabel = dayLabels[idx];
        svg = svg.concat(`
            <g>
              <text
                x="${fireX}"
                y="${fireY - 50}"
                font-size="12"
                font-weight="500"
                font-family="Arial, sans-serif"
                text-anchor="middle"
                fill="#CCCCCC"
                opacity="0.8"
              >
                ${dayLabel}
              </text>
                <g>
                    <circle
                    cx="${fireX}"
                    cy="${fireY}"
                    r="${35 * 0.7}"
                    fill="url(#fireGlow)"
                    opacity="0.3"
                    />

                    <circle cx="${fireX}" cy="${fireY}" r="${35 / 2}" fill="#FF6B35" />

                    <ellipse
                    cx="${fireX}"
                    cy="${fireY - 35 / 3}"
                    rx="${35 / 3}"
                    ry="${35 / 1.5}"
                    fill="url(#fireGradient)"
                    />

                    <path
                    d="M ${fireX - 35 / 3} ${fireY + 35 / 2} Q ${fireX} ${fireY - 35} ${fireX + 35 / 3} ${fireY + 35 / 2}"
                    fill="url(#flameGradient)"
                    />

                    <ellipse
                    cx="${fireX}"
                    cy="${fireY - 35 / 1.8}"
                    rx="${35 / 4}"
                    ry="${35 / 2.5}"
                    fill="#FFD700"
                    opacity="0.9"
                    />
                </g>
            </g>
        `)
    })
    svg += `</svg>`



    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
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
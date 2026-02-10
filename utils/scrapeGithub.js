import puppeteer from 'puppeteer';

// Cache per username
const cache = new Map(); // { username -> { data, timestamp } }
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Browser + page pool config
const POOL_SIZE = 5; // max concurrent pages
let browser = null;
let browserPromise = null;
let idleTimer = null;
const IDLE_TIMEOUT = 5 * 60 * 1000;

// Page pool
const pagePool = [];       // available pages
const waitQueue = [];      // { resolve, reject } waiting for a free page

async function getBrowser() {
    if (browser) {
        resetIdleTimer();
        return browser;
    }
    if (!browserPromise) {
        browserPromise = puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        }).then(b => {
            browser = b;
            browserPromise = null;
            return b;
        });
    }
    resetIdleTimer();
    return browserPromise;
}

function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(async () => {
        if (browser && pagePool.length === POOL_SIZE) { // only close if all pages are free
            console.log('Browser idle, closing...');
            for (const page of pagePool) await page.close();
            pagePool.length = 0;
            await browser.close();
            browser = null;
        }
    }, IDLE_TIMEOUT);
}

async function acquirePage() {
    // If a free page is available, return it immediately
    if (pagePool.length > 0) {
        return pagePool.pop();
    }

    // If pool isn't at capacity yet, create a new page
    const browserInstance = await getBrowser();
    const totalPages = POOL_SIZE - pagePool.length - waitQueue.length;
    if (totalPages > 0) {
        return await browserInstance.newPage();
    }

    // Otherwise wait for a page to be released
    console.log('Page pool exhausted, queuing request...');
    return new Promise((resolve, reject) => {
        waitQueue.push({ resolve, reject });
    });
}

async function releasePage(page) {
    // If someone is waiting, give the page directly to them
    if (waitQueue.length > 0) {
        const { resolve } = waitQueue.shift();
        resolve(page);
        return;
    }
    // Otherwise return to pool
    pagePool.push(page);
}

export async function scrapeGitHubContributions(username) {
    // Check cache first
    const cached = cache.get(username);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`Serving ${username} from cache`);
        return cached.data;
    }

    console.log(`Fetching fresh data for ${username}`);

    let page;
    try {
        page = await acquirePage();

        await page.setViewport({ width: 1280, height: 800 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

        await page.goto(`https://github.com/${username}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        await page.waitForSelector('.js-calendar-graph', { timeout: 10000 });

        const data = await page.evaluate(() => {
            const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            const contributionHeader = document.querySelector('.js-yearly-contributions h2');
            const totalText = contributionHeader ? contributionHeader.textContent.trim() : '';
            const totalMatch = totalText.match(/(\d+[\d,]*)\s+contribution/);
            const totalContributions = totalMatch ? parseInt(totalMatch[1].replace(/,/g, '')) : 0;

            const days = Array.from(document.querySelectorAll('.ContributionCalendar-day'));
            let weeklyData = [];
            const daysData = days.map(element => {
                const toolTipId = element.getAttribute("aria-labelledby");
                const contributions = document.getElementById(toolTipId)?.textContent?.trim().split(" ")[0] || "0";

                if (element.getAttribute("data-ix") == '52') {
                    const elementId = element.getAttribute("id");
                    const indexInfo = elementId.split("-");
                    const dayIndex = parseInt(indexInfo[indexInfo.length - 2]);
                    weeklyData.push({
                        day: WEEK_DAYS[dayIndex],
                        value: Number(contributions) || 0
                    });
                }

                return ({
                    contributions: Number(contributions),
                    level: Number(element.getAttribute("data-level")),
                    date: Math.floor(new Date(element.getAttribute("data-date")).getTime() / (1000 * 60 * 60))
                });
            });

            const data = daysData.toSorted((a, b) => b.date - a.date);
            const totalDaysContributedLastYear = data.filter(day => day.contributions > 0).length;
            const todaysIndex = weeklyData.length;

            let currentStreak = 0;
            if (data[0].level === 0 && data[1]?.level === 0) {
                currentStreak = 0;
            } else {
                for (let i = 0; i < data.length; i++) {
                    const day = data[i];
                    if (day.level === 0) {
                        if (i === 0) continue;
                        break;
                    }
                    currentStreak++;
                }
            }

            for (let weekDay of WEEK_DAYS) {
                if (!weeklyData.some(d => d.day === weekDay)) {
                    weeklyData.push({ day: weekDay, value: null });
                }
            }

            return { currentStreak, totalContributionsLastYear: totalContributions, totalDaysContributedLastYear, weeklyData, todaysIndex };
        });

        // Update per-username cache
        cache.set(username, { data, timestamp: Date.now() });

        console.log(`✅ successful for ${username}`);
        return data;

    } catch (error) {
        console.error(`Scraping error for ${username}:`, error.message);

        // Try to recover broken page
        if (page) {
            try { await page.close(); } catch {}
            page = null; // don't return to pool
        }

        const cached = cache.get(username);
        if (cached) {
            console.log('Error occurred, serving stale cache');
            return cached.data;
        }

        return { error: 'Failed to fetch GitHub contributions' };

    } finally {
        if (page) await releasePage(page);
    }
}
import { Router } from "express";
import { scrapeGitHubContributions } from "../utils/scrapeGithub.js";
import { generateStatsDashboardSVG } from "../utils/svg.js";
import { getFormattedStartAndEndDates } from "../utils/getDateString.js";

const router = Router();

router.get('/',async (req, res) => {
    const username = req.query.username;
    const color = req.query.color || 'orange';

    if(!username) {
        return res.status(400).send('Missing "username" query parameter.');
    }
    
    const data = await scrapeGitHubContributions(username);
    const formattedDateString = getFormattedStartAndEndDates(data.startDate, data.endDate);

    const svg = generateStatsDashboardSVG({
        contributionsThisYear: data.totalContributionsLastYear,
        currentStreak: data.currentStreak,
        daysThisYear: data.totalDaysContributedLastYear,
        weeklyData: data.weeklyData,
        todaysIndex: data.todaysIndex,
        color: color,
        dateRange: formattedDateString
    })

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'max-age=300');
    res.send(svg.trim());
})

export default router;
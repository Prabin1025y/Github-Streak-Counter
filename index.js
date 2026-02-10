import express from 'express'
import { shutdown } from './utils/shutDown.js';
import router from './router/badge.router.js';
import https from 'https';
// import http from 'http';
import "dotenv/config";

const app = express();
app.use(express.static('public')); // Serve static files from the "public" directory
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => 
    res.send(`
    <h1>GitHub Contribution Scraper</h1>
`));

app.get("/health", (req, res) => {
    res.status(200).send("OK");
});

app.use('/badge.svg', router);

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

app.listen(PORT, () => {
    console.log(`🚀 GitHub Contribution Scraper running on port ${PORT}`);
    console.log(`📊 Badge: http://localhost:${PORT}/badge.svg?username=yourname`);
});

const INTERVAL_DELAY = 8 * 60 * 1000; // 8mins
const url = new URL(`${process.env.API_URL}/health`);

// don't sleep
setInterval(() => {
    https
        .get(url.href)
        .on("response", () => {
            console.log(`api HEALTH_CHECK successful; ${url.href}`);
        })
        .on("error", (err) =>{
            console.warn(
                `api HEALTH_CHECK failed; ${err.message.trim()}`
            )
            // console.log(err)
        }
        );
}, INTERVAL_DELAY);
import express from 'express'
import { shutdown } from './utils/shutDown.js';
import router from './router/badge.router.js';

const app = express();
app.use(express.static('public')); // Serve static files from the "public" directory
const PORT = process.env.PORT || 3000;

app.use('/badge.svg',router);

// Graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

app.listen(PORT, () => {
    console.log(`🚀 GitHub Contribution Scraper running on port ${PORT}`);
    console.log(`📊 Badge: http://localhost:${PORT}/badge.svg?username=yourname`);
});
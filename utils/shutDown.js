export const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down...`);
  if (browser) await browser.close();
  process.exit(0);
};
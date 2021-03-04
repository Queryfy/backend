const PageScraper = require('./pageScrapper');

async function scrapeAll(browserInstance, query) {
  let browser;

  try {
    browser = await browserInstance;
    const pageScraper = new PageScraper(browser, query)
    return await pageScraper.scraper();
  } catch (err) {
    console.log('Error', err);
  }
}

module.exports = (browserInstance, query) => scrapeAll(browserInstance, query);

const puppeteer = require('puppeteer');

async function startBrowser() {
  let browser;
  try {
    console.log("Opening the browser......");
    browser = await puppeteer.launch({
      headless: true,
      args: ["--disable-setuid-sandbox"],
      'ignoreHTTPSErrors': true
    });
  } catch (err) {
    console.log('Error', err);
  }

  return browser;
}

module.exports = {
  startBrowser,
};

const puppeteer = require('puppeteer-extra');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const blockResourcesPlugin = require('puppeteer-extra-plugin-block-resources');

puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
puppeteer.use(blockResourcesPlugin()); //Flags warning.

async function startBrowser() {
  let browser;
  try {
    console.log("Opening the browser......");
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox','--disable-setuid-sandbox'],
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

import { Builder, Browser, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import firefox from 'selenium-webdriver/firefox';

const argBrowser = process.argv.find((arg) => arg.startsWith('--browser='))?.split('=')[1];
const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
const requestedBrowser = (argBrowser || process.env.SELENIUM_BROWSER || 'chrome').toLowerCase();
const seleniumMode = (process.env.SELENIUM_MODE || 'local').toLowerCase();
const gridUrl = process.env.SELENIUM_GRID_URL || '';

function resolveBrowser(browserName: string) {
  if (browserName === 'firefox') return Browser.FIREFOX;
  return Browser.CHROME;
}

async function buildDriver() {
  const browser = resolveBrowser(requestedBrowser);

  if (seleniumMode === 'grid') {
    if (!gridUrl) {
      throw new Error('SELENIUM_GRID_URL is required when SELENIUM_MODE=grid');
    }

    return new Builder().usingServer(gridUrl).forBrowser(browser).build();
  }

  if (browser === Browser.FIREFOX) {
    const options = new firefox.Options();
    options.addArguments('-headless');
    return new Builder().forBrowser(Browser.FIREFOX).setFirefoxOptions(options).build();
  }

  const options = new chrome.Options();
  options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage');
  return new Builder().forBrowser(Browser.CHROME).setChromeOptions(options).build();
}

async function runSmoke() {
  const driver = await buildDriver();

  try {
    await driver.get(baseUrl);
    await driver.wait(until.elementLocated(By.css('body')), 10000);

    const body = await driver.findElement(By.css('body'));
    const bodyText = await body.getText();

    if (!bodyText || bodyText.trim().length === 0) {
      throw new Error('Smoke check failed: page body text is empty');
    }

    console.log(`✅ Selenium smoke passed on ${requestedBrowser} (${seleniumMode}) against ${baseUrl}`);
  } finally {
    await driver.quit();
  }
}

async function main() {
  try {
    await runSmoke();
  } catch (error) {
    console.error('❌ Selenium smoke failed');
    console.error(error);
    process.exit(1);
  }
}

void main();

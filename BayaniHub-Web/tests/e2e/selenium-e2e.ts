import { Builder, Browser, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import firefox from 'selenium-webdriver/firefox';
import { spawn } from 'node:child_process';
import net from 'node:net';

const argBrowser = process.argv.find((arg) => arg.startsWith('--browser='))?.split('=')[1];
const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
const requestedBrowser = (argBrowser || process.env.SELENIUM_BROWSER || 'chrome').toLowerCase();
const seleniumMode = (process.env.SELENIUM_MODE || 'local').toLowerCase();
const gridUrl = process.env.SELENIUM_GRID_URL || '';
const appStartCommand = process.env.E2E_APP_START_CMD || 'npm run dev';
const startupTimeoutMs = Number(process.env.E2E_STARTUP_TIMEOUT_MS || 120000);

function parseBaseUrl() {
  const url = new URL(baseUrl);
  const isHttps = url.protocol === 'https:';
  const port = url.port ? Number(url.port) : isHttps ? 443 : 80;

  return {
    hostname: url.hostname,
    port,
  };
}

function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function isPortOpen(hostname: string, port: number, timeoutMs = 1500) {
  return new Promise<boolean>((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, hostname);
  });
}

async function waitForPort(hostname: string, port: number, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await isPortOpen(hostname, port)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for app server at ${hostname}:${port}`);
}

async function ensureLocalAppServer() {
  const { hostname, port } = parseBaseUrl();

  if (seleniumMode !== 'local' || !isLocalHost(hostname)) {
    return null;
  }

  if (await isPortOpen(hostname, port)) {
    return null;
  }

  console.log(`ℹ️ Starting local app server with "${appStartCommand}" for ${baseUrl}`);
  const appProcess = spawn(appStartCommand, {
    shell: true,
    stdio: 'inherit',
    env: process.env,
  });

  await waitForPort(hostname, port, startupTimeoutMs);
  return appProcess;
}

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
  const appProcess = await ensureLocalAppServer();

  try {
    await runSmoke();
  } catch (error) {
    console.error('❌ Selenium smoke failed');
    console.error(error);
    process.exit(1);
  } finally {
    if (appProcess) {
      appProcess.kill();
    }
  }
}

void main();

// Build-time tools only. The story page never imports this file.
import { createRequire } from 'node:module';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
const cache = join(homedir(), '.npm', '_npx');
const candidates = [process.env.PUPPETEER_CORE_PATH, 'puppeteer-core',
  ...(existsSync(cache) ? readdirSync(cache).map(dir => join(cache, dir, 'node_modules/puppeteer-core')) : [])].filter(Boolean);
let puppeteer;
for (const candidate of candidates) {
  try { puppeteer = require(candidate); break; } catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; }
}
if (!puppeteer) throw new Error('Install puppeteer-core@25.11.0, or set PUPPETEER_CORE_PATH to an existing installation. No browser download is needed.');
export { puppeteer };
export const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

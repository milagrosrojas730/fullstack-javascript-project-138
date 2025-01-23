import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import pageLoader from '../src/page-loader.js';

describe('Page Loader', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  });

  test('descarga una página y la guarda', async () => {
    const url = 'https://example.com';
    const filePath = path.join(tempDir, 'example-com.html');
    await pageLoader(url, tempDir);

    const fileExists = await fs.access(filePath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
  });
});

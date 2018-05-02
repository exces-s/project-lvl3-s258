import axios from 'axios';
import nock from 'nock';
import httpAdapter from 'axios/lib/adapters/http';
import fs from 'mz/fs';
import path from 'path';
import os from 'os';
import pageLoad from '../src';
import half from '../src/half';


const testData = '<html><head></head><body>test data</body></html>';

const hostTest = 'http://test.com';
const urlTest = 'http://test.com/test';

const resultFileName = '/test-com-test.html';
const outDirName = '/test-com-test_files';

const pathToOutDirTest2 = '__tests__/__fixtures__';

const urlTest3 = 'https://github.com/';
const resultFileNameTest3 = '/github-com.html';
const outDirNameTest3 = '/github-com_files';

axios.defaults.adapter = httpAdapter;

nock(hostTest)
  .persist()
  .get('/test')
  .reply(200, testData);

test('Check for correct jest work', () => {
  expect(half(6)).toBe(3);
});

test('1. Test with --output. Output directory doesn\'t exist ', async () => {
  const pathToOutDir = await fs.mkdtemp(`${os.tmpdir()}${path.sep}`);
  const outDirPath = `${pathToOutDir}${outDirName}`;
  const resultFilePath = `${pathToOutDir}${resultFileName}`;

  await pageLoad(urlTest, pathToOutDir);
  const expectedData = await fs.readFile(resultFilePath, 'utf8');
  expect(expectedData).toBe(testData);
  expect(fs.existsSync(outDirPath)).toBeTruthy();
});

test('2. Test with --output. Output directory exists', async () => {
  const outDirPath = `${pathToOutDirTest2}${outDirName}`;
  const resultFilePath = `${pathToOutDirTest2}${resultFileName}`;

  await fs.writeFile(`${pathToOutDirTest2}${resultFileName}`, '', 'utf8');

  await pageLoad(urlTest, pathToOutDirTest2);
  const expectedData = await fs.readFile(resultFilePath, 'utf8');
  expect(fs.existsSync(outDirPath)).toBeTruthy();
  expect(expectedData).toBe(testData);
});

test('3. Test with --output. Loaded page is external page', async () => {
  const pathToOutDir = await fs.mkdtemp(`${os.tmpdir()}${path.sep}`);
  const outDirPath = `${pathToOutDir}${resultFileNameTest3}`;
  const resultFilePath = `${pathToOutDir}${outDirNameTest3}`;

  await pageLoad(urlTest3, pathToOutDir);
  expect(fs.existsSync(outDirPath)).toBeTruthy();
  expect(fs.existsSync(resultFilePath)).toBeTruthy();
});


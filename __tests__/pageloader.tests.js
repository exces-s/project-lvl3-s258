import axios from 'axios';
import nock from 'nock';
import httpAdapter from 'axios/lib/adapters/http';
import fs from 'mz/fs';
import path from 'path';
import os from 'os';
import pageLoad from '../src';
import half from '../src/half';

axios.defaults.adapter = httpAdapter;

const testData = '<html><head></head><body>test data</body></html>';

const hostTest = 'http://test.com';
const urlTest = 'http://test.com/test';

const fixturesPath = '__tests__/__fixtures__';

const urlTest3 = 'https://github.com/';
const resultFileNameTest3 = '/github-com.html';
const outDirNameTest3 = '/github-com_files';

beforeEach(() => nock(hostTest)
  .get('/test')
  .reply(200, testData));

beforeEach(() => nock(hostTest)
  .get('/404')
  .reply(404, testData));


test('Check for correct jest work', () => {
  expect(half(6)).toBe(3);
});

test('1. Option: --output. Output directory doesn\'t exist ', async () => {
  const pathToOutDir = await fs.mkdtemp(`${os.tmpdir()}${path.sep}`);
  const outDirFullPath = `${pathToOutDir}/test-com-test_files`;
  const resultFilePath = `${pathToOutDir}/test-com-test.html`;

  await pageLoad(urlTest, pathToOutDir);

  const isOutDirExist = fs.existsSync(outDirFullPath);
  const expectedData = await fs.readFile(resultFilePath, 'utf8');

  expect(expectedData).toBe(testData);
  expect(isOutDirExist).toBeTruthy();
});

test('2. Option: --output. Output directory exists', async () => {
  const outDirFullPath = '__tests__/__fixtures__/test-com-test_files';
  const resultFilePath = '__tests__/__fixtures__/test-com-test.html';
  const isFileExist = fs.existsSync(resultFilePath);

  if (isFileExist) {
    await fs.unlink(resultFilePath);
  }
  await pageLoad(urlTest, fixturesPath);

  const isOutDirExist = fs.existsSync(outDirFullPath);
  const expectedData = await fs.readFile(resultFilePath, 'utf8');

  expect(isOutDirExist).toBeTruthy();
  expect(expectedData).toBe(testData);
});

test('3. Option: --output. Loaded page is external page', async () => {
  const pathToOutDir = await fs.mkdtemp(`${os.tmpdir()}${path.sep}`);
  const resultFilePath = `${pathToOutDir}${resultFileNameTest3}`;
  const outDirFullPath = `${pathToOutDir}${outDirNameTest3}`;
  const actualOpensearch = await fs.readFile(`${fixturesPath}/opensearch.xml`);

  await pageLoad(urlTest3, pathToOutDir);

  const loadedOpensearch = await fs.readFile(`${outDirFullPath}/opensearch.xml`);
  const isOutDirExist = fs.existsSync(outDirFullPath);
  const isResultFileExist = fs.existsSync(resultFilePath);

  expect(isOutDirExist).toBeTruthy();
  expect(isResultFileExist).toBeTruthy();
  expect(loadedOpensearch).toEqual(actualOpensearch);
});

test('4. Option: --output. Incorrect output directory path', async () => {
  const errMessage = 'NETWORK ERROR. Remote server error or network problems. Url: http://test.com/404';
  const result = await pageLoad('http://test.com/404', `${fixturesPath}`);
  expect(result).toEqual(errMessage);
});

test('5. Option: --output. Incorrect url', async () => {
  const errMessage = `ENOENT ERROR. No such file or directory. Check this path: ${path.resolve('__tests__/__fixtures__/incorrectPath/test-com-test_files')}`;
  const result = await pageLoad('http://test.com/test', `${fixturesPath}/incorrectPath`);
  expect(result).toEqual(errMessage);
});

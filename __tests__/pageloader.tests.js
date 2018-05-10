import axios from 'axios';
import nock from 'nock';
import httpAdapter from 'axios/lib/adapters/http';
import fs from 'mz/fs';
import path from 'path';
import os from 'os';
import pageLoad from '../src';
import half from '../src/half';


const testHtmlPath = '__tests__/__fixtures__/testHtml.html';
const testHtmlWithLocalLinkPath = '__tests__/__fixtures__/testHtmlWithLocalLink.html';
const modTestHtmlWithLocalLinkPath = '__tests__/__fixtures__/modTestHtmlWithLocalLink.html';

const tempDirPath = fs.mkdtemp(`${os.tmpdir()}${path.sep}`);
const fixturesPath = '__tests__/__fixtures__';


axios.defaults.adapter = httpAdapter;

beforeEach(async () => {
  const htmlWithLocalLink = await fs.readFile(testHtmlWithLocalLinkPath, 'utf8');
  const testHtml = await fs.readFile(testHtmlPath, 'utf8');

  nock('http://test.com')
    .get('/test')
    .reply(200, testHtml);

  nock('http://test.com')
    .get('/404')
    .reply(404, testHtml);

  nock('https://google.com')
    .get('/')
    .reply(200, htmlWithLocalLink);
});

test('0. Check for correct jest work', () => {
  expect(half(6)).toBe(3);
});


test('1. Should create directory for local files and create html.file', async () => {
  const url = 'http://test.com/test';
  const pathToOutDir = await tempDirPath;
  const outDirFullPath = `${pathToOutDir}/test-com-test_files`;
  const htmltFilePath = `${pathToOutDir}/test-com-test.html`;

  await pageLoad(url, pathToOutDir);

  const isOutDirExist = await fs.stat(outDirFullPath);
  const actualHtml = await fs.readFile(testHtmlPath, 'utf8');
  const expectedHtml = await fs.readFile(htmltFilePath, 'utf8');

  expect(expectedHtml).toBe(actualHtml);
  expect(isOutDirExist).toBeTruthy();
});

test('2. Should be no mistake if directory for local files exists', async () => {
  const url = 'http://test.com/test';
  const outDirFullPath = `${fixturesPath}/test-com-test_files`;
  const htmltFilePath = `${fixturesPath}/test-com-test.html`;
  const isHtmlFileExist = fs.stat(htmltFilePath);

  if (isHtmlFileExist) {
    await fs.unlink(htmltFilePath);
  }
  await pageLoad(url, fixturesPath);

  const isOutDirExist = fs.stat(outDirFullPath);
  expect(isOutDirExist).toBeTruthy();
});

test('3. Should display network error', async () => {
  const url = 'http://test.com/404';

  const pageloadNetErr = pageLoad(url, `${fixturesPath}/`);
  await expect(pageloadNetErr).rejects.toThrowErrorMatchingSnapshot();
});

test('4. Should display ENOENT error', async () => {
  const url = 'http://test.com/test';

  const pageloadEnoentErr = pageLoad(url, `${fixturesPath}/incorrectPath`);
  await expect(pageloadEnoentErr).rejects.toThrowErrorMatchingSnapshot();
});

test('5. Should load local files from external page', async () => {
  const url = 'https://github.com';
  const pathToOutDir = await tempDirPath;
  const outDirFullPath = `${pathToOutDir}/github-com_files`;

  await pageLoad(url, pathToOutDir);

  const actualOpensearchFile = await fs.readFile(`${fixturesPath}/opensearch.xml`);
  const loadedOpensearchFile = await fs.readFile(`${outDirFullPath}/opensearch.xml`);
  expect(loadedOpensearchFile).toEqual(actualOpensearchFile);
});

test('6. Should replace local link in html', async () => {
  const url = 'https://google.com';
  const pathToOutDir = await tempDirPath;
  const htmltFilePath = `${pathToOutDir}/google-com.html`;

  await pageLoad(url, pathToOutDir);

  const actualHtml = await fs.readFile(modTestHtmlWithLocalLinkPath, 'utf8');
  const expectedHtml = await fs.readFile(htmltFilePath, 'utf8');
  expect(expectedHtml).toEqual(actualHtml);
});


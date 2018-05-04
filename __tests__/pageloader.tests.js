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

const fixturesPath = '__tests__/__fixtures__';

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

  const outDirPath = `${pathToOutDir}/test-com-test_files`;
  const resultFilePath = `${pathToOutDir}/test-com-test.html`;

  await pageLoad(urlTest, pathToOutDir);
  const expectedData = await fs.readFile(resultFilePath, 'utf8');
  expect(expectedData).toBe(testData);
  expect(fs.existsSync(outDirPath)).toBeTruthy();
});

test('2. Test with --output. Output directory exists', async () => {
  const outDirPath = '__tests__/__fixtures__/test-com-test_files';
  const resultFilePath = '__tests__/__fixtures__/test-com-test.html';

  await fs.writeFile(resultFilePath, '', 'utf8');
  // const bar = await fs.readFile(resultFilePath, 'utf8');
  // console.log(bar);

  await pageLoad(urlTest, fixturesPath);

  // const foo = await fs.readFile(resultFilePath, 'utf8');
  // console.log(foo);

  const expectedData = await fs.readFile(resultFilePath, 'utf8');
  expect(await fs.existsSync(outDirPath)).toBeTruthy();
  // console.log(expectedData);
  expect(expectedData).toBe(testData);
});

test('3. Test with --output. Loaded page is external page', async () => {
  const pathToOutDir = await fs.mkdtemp(`${os.tmpdir()}${path.sep}`);
  const resultFilePath = `${pathToOutDir}${resultFileNameTest3}`;
  const outDirPath = `${pathToOutDir}${outDirNameTest3}`;

  const actualOpensearch = await fs.readFile(`${fixturesPath}/opensearch.xml`);

  await pageLoad(urlTest3, pathToOutDir);

  const loadedOpensearch = await fs.readFile(`${outDirPath}/opensearch.xml`);
  expect(fs.existsSync(outDirPath)).toBeTruthy();
  expect(fs.existsSync(resultFilePath)).toBeTruthy();
  expect(loadedOpensearch).toEqual(actualOpensearch);
});


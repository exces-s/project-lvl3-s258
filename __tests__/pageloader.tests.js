import axios from 'axios';
import nock from 'nock';
import httpAdapter from 'axios/lib/adapters/http';
import fs from 'mz/fs';
import pageLoad from '../src';
import half from '../src/half';


const testData = '<html><head></head><body>test data</body></html>';
const destPathTest = '__tests__/__fixtures__';

const hostTest1 = 'http://test1.com';
const urlTest1 = 'http://test1.com/test1';
const pathToResultFileTest1 = '__tests__/__fixtures__/test1-com-test1.html';
const pathToOutputDirTest1 = '__tests__/__fixtures__/test1-com-test1_files';

const hostTest2 = 'http://test2.com';
const urlTest2 = 'http://test2.com/test2';
const pathToResultFileTest2 = '__tests__/__fixtures__/test2-com-test2.html';
const pathToOutputDirTest2 = '__tests__/__fixtures__/test2-com-test2_files';

const urlTest3 = 'https://github.com/';
const pathToResultFileTest3 = '__tests__/__fixtures__/github-com.html';
const pathToOutputDirTest3 = '__tests__/__fixtures__/github-com_files';


axios.defaults.adapter = httpAdapter;

nock(hostTest1)
  .persist()
  .get('/test1')
  .reply(200, testData);

nock(hostTest2)
  .persist()
  .get('/test2')
  .reply(200, testData);

test('Check for correct jest work', () => {
  expect(half(6)).toBe(3);
});

test('1. Test with --output. Output directory doesn\'t exist ', async () => {
  await fs.writeFile(pathToResultFileTest1, '', 'utf8');
  if (fs.existsSync(pathToOutputDirTest1)) {
    await fs.rmdir(pathToOutputDirTest1);
  }
  await pageLoad(urlTest1, destPathTest);
  const expectedData = await fs.readFile(pathToResultFileTest1, 'utf8');
  expect(expectedData).toBe(testData);
});

test('2. Test with --output. Output directory exists', async () => {
  await fs.writeFile(pathToResultFileTest2, '', 'utf8');
  if (fs.existsSync(pathToOutputDirTest2)) {
    await fs.rmdir(pathToOutputDirTest2);
  }
  await pageLoad(urlTest2, destPathTest);
  const expectedData = await fs.readFile(pathToResultFileTest2, 'utf8');
  expect(fs.existsSync(pathToOutputDirTest2)).toBeTruthy();
  expect(expectedData).toBe(testData);
});

test('4. Test with --output. Loaded page is external main page', async () => {
  await fs.writeFile(pathToResultFileTest3, '', 'utf8');
  await pageLoad(urlTest3, destPathTest);
  expect(fs.existsSync(pathToOutputDirTest3)).toBeTruthy();
  expect(fs.existsSync(pathToResultFileTest3)).toBeTruthy();
});


import axios from 'axios';
import fs from 'mz/fs';
import url from 'url';
import path from 'path';
import cheerio from 'cheerio';


const urlToName = (uri) => {
  const parced = url.parse(uri);
  if (parced.protocol !== null) {
    return urlToName(url.format({ ...parced, protocol: null }));
  }
  if (uri[0] === '/') {
    return urlToName(uri.slice(1));
  }
  if (uri[uri.length - 1] === '/') {
    return urlToName(uri.slice(0, uri.length - 1));
  }
  const regex = /\W/g;
  const fileName = uri.replace(regex, '-');
  return fileName;
};

const getLinksByTag = (tag, html) => {
  const links = [];
  const $ = cheerio.load(html);
  $(tag).each(function iter() {
    links.push($(this).attr('src'));
    links.push($(this).attr('href'));
  });
  return links.filter(v => v);
};

const getLinks = (body, uri) => {
  const tags = ['img', 'script', 'link'];

  const allTagsLinks = tags.reduce((acc, tag) =>
    [...acc, ...getLinksByTag(tag, body)], []);

  const rightLinks = allTagsLinks
    .filter((item) => {
      const parsed = url.parse(item);
      return parsed.protocol === null;
    })
    .map(item => url.resolve(uri, item));

  return rightLinks;
};

const getFileNames = (links, dirPath) =>
  links.map((item) => {
    const parsed = path.parse(item);
    const newUrl = path.format({ ...parsed, base: null, ext: null });
    return path.join(dirPath, `${urlToName(newUrl)}${parsed.ext}`);
  });

const writeFile = (filePath, data) => {
  fs.writeFile(filePath, data, 'utf8');
  return Promise.resolve(data);
};

const pageLoad = (uri, destPath) => {
  const fileName = `${urlToName(uri)}.html`;
  const filePath = path.join(destPath, fileName);

  const dirName = `${urlToName(uri)}_files`;
  const dirPath = path.join(destPath, dirName);

  const links = [];
  const filePaths = [];

  return axios.get(uri)
    .then(({ data: html }) => {
      links.push(...getLinks(html, uri));
      filePaths.push(...getFileNames(links, dirPath));
      return html;
    })
    .then(html => fs.writeFile(filePath, html, 'utf8'))
    .then(() => fs.mkdir(dirPath))
    .then(() => {
      // const options = { method: 'get', responseType: 'stream' };
      const loadData = links.map(value =>
        axios.get(value));
        // axios({ ...options, url: value }));
      return Promise.all(loadData);
    })
    .then(loadData => loadData.forEach(({ data }, index) => {
      const dataToWrite = data instanceof Object ?
        JSON.stringify(data) : data;
      writeFile(filePaths[index], dataToWrite);
    }))
    .catch((e) => {
      throw new Error('Oops! Some error here\n', e);
    });
};

export default pageLoad;

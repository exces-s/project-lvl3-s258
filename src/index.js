import axios from 'axios';
import fs from 'mz/fs';
import url from 'url';
import path from 'path';
import cheerio from 'cheerio';
import _ from 'lodash';


const urlToNameWithoutExt = (uri) => {
  const data = url.parse(uri);
  if (data.protocol !== null) {
    const options = { host: data.host, pathname: data.pathname };
    return urlToNameWithoutExt(url.format(options));
  }
  if (_.head(uri) === '/' || _.last(uri) === '/') {
    return urlToNameWithoutExt(_.trim(uri, '/'));
  }
  const regex = /\W/g;
  return _.replace(uri, regex, '-');
};

const urlToNameWithExt = (uri, end) =>
  [urlToNameWithoutExt(uri), end].join('');

const urlToFilename = (link) => {
  const data = path.parse(link);
  const newPath = path.format({ ...data, base: null, ext: null });
  return urlToNameWithExt(newPath, data.ext);
};

const getFilepaths = (links, dirPath) =>
  links.map(item =>
    path.join(dirPath, urlToFilename(item)));

const getLinksByTag = (tag, html) => {
  const attr = tag === 'img' ? 'src' : 'href';
  const links = [];
  const $ = cheerio.load(html);
  $(tag).each(function () {
    links.push($(this).attr(attr));
  });

  return links.filter(v => v);
};

const getLocalLinks = (body, tag) => {
  const allTagsLinks = getLinksByTag(tag, body);
  return allTagsLinks.filter((item) => {
    const data = url.parse(item);
    return data.protocol === null;
  });
};

const getFullLinks = (links, uri) =>
  links.map(item => url.resolve(uri, item));


const replaceLinksByAttr = (html, links, dirName, attr) => {
  const $ = cheerio.load(html);

  links.forEach((item) => {
    const newUrl = path.join(dirName, urlToFilename(item));
    return $(`[${attr}="${item}"]`).each(function iter() {
      $(this).attr(attr, newUrl);
    });
  });

  return $.html();
};

const replaceLinks = (html, hrefLinks, srcLinks, dirName) => {
  const replacedHref = replaceLinksByAttr(html, hrefLinks, dirName, 'href');
  const replacedAll = replaceLinksByAttr(replacedHref, srcLinks, dirName, 'src');

  return replacedAll;
};

const writeFile = (filePath, data) =>
  fs.writeFile(filePath, data, 'utf8');

const mkdir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    return fs.mkdir(dirPath);
  }
  return Promise.resolve();
};

const loadData = (uri, ...links) => {
  const allLinks = _.flatten(links);
  const options = { method: 'get', responseType: 'stream' };
  const fullLinks = getFullLinks(allLinks, uri);
  const requests = fullLinks.map(value =>
    axios({ ...options, url: value }));
  return Promise.all(requests);
};

const getLinks = (html, hrefLinks, srcLinks) => {
  hrefLinks.push(...getLocalLinks(html, 'script'), ...getLocalLinks(html, 'link'));
  srcLinks.push(...getLocalLinks(html, 'img'));
  return html;
};

const writeStreams = (data, dirPath, ...links) => {
  const allLinks = _.flatten(links);
  return data.forEach((item, index) => {
    const filePaths = getFilepaths(allLinks, dirPath);
    item.data.pipe(fs.createWriteStream(filePaths[index]));
  });
};


const pageLoad = (uri, destPath) => {
  const fileName = urlToNameWithExt(uri, '.html');
  const filePath = path.join(destPath, fileName);

  const dirName = urlToNameWithExt(uri, '_files');
  const dirPath = path.join(destPath, dirName);

  const hrefLinks = [];
  const srcLinks = [];

  return axios.get(uri)
    .then(({ data: html }) => getLinks(html, hrefLinks, srcLinks))
    .then(html => replaceLinks(html, hrefLinks, srcLinks, dirName))
    .then(html => writeFile(filePath, html))
    .then(() => mkdir(dirPath))
    .then(() => loadData(uri, hrefLinks, srcLinks))
    .then(responses => writeStreams(responses, dirPath, hrefLinks, srcLinks))
    .catch(e => console.log('Oops! Some error here\n\n', e));
};

export default pageLoad;

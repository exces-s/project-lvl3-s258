import axios from 'axios';
import fs from 'mz/fs';
import url from 'url';
import path from 'path';
import cheerio from 'cheerio';
import _ from 'lodash';
import debug from 'debug';

const plDebug = debug('page-loader');
const programName = 'pageloader';

const tags = ['img', 'link', 'script'];

const typeAttr = {
  img: 'src',
  link: 'href',
  script: 'href',
};

const getAttr = tag => typeAttr[tag];


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

const getLocalLinksByTag = (html, tag) => {
  const attr = getAttr(tag);
  const links = [];
  const $ = cheerio.load(html);
  $(tag).each(function () {
    links.push($(this).attr(attr));
  });

  return links.filter(v => v)
    .filter((item) => {
      const data = url.parse(item);
      return data.protocol === null;
    });
};

const getAllLinksInObj = html =>
  tags.reduce((acc, tag) => {
    const obj = { [tag]: getLocalLinksByTag(html, tag) };
    return { ...acc, ...obj };
  }, {});

const getLinksFromObj = (linksObj) => {
  const tagsList = _.keys(linksObj);
  return _.flatten(tagsList.map(tag => linksObj[tag]));
};


const getFullLinks = (links, uri) =>
  links.map(item => url.resolve(uri, item));

const replaceLinksByTag = (html, links, tag, dirName) => {
  const attr = getAttr(tag);
  const $ = cheerio.load(html);

  links.forEach((item) => {
    const newUrl = path.join(dirName, urlToFilename(item));
    return $(`[${attr}="${item}"]`).each(function iter() {
      $(this).attr(attr, newUrl);
    });
  });

  return $.html();
};

const replaceAllLinks = (html, linksObj, dirName) => {
  let modHtml = html;
  _.forIn(linksObj, (links, tag) => {
    modHtml = replaceLinksByTag(modHtml, links, tag, dirName);
  });

  return modHtml;
};

const mkdirIfNotExist = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    plDebug('creating output directory: %o', dirPath);
    return fs.mkdir(dirPath);
  }
  plDebug('directory already exists');
  return Promise.resolve();
};

const loadDataItem = (link) => {
  const options = { method: 'get', responseType: 'stream' };
  return axios({ ...options, url: link });
};

const loadData = (uri, links) => {
  const fullLinks = getFullLinks(links, uri);
  const responses = fullLinks.map(value =>
    loadDataItem(value));

  return Promise.all(responses);
};

const writeDataItem = (response, dirPath, filePath) =>
  response.data.pipe(fs.createWriteStream(filePath));


const writeAllData = (data, dirPath, links) => {
  if (links.length === 0) {
    plDebug('no data to write');
    plDebug('FINISH %o', programName);
    plDebug('...............................');
  }
  return data.forEach((item, index) => {
    const filePaths = getFilepaths(links, dirPath);
    writeDataItem(item, dirPath, filePaths[index]);
    if (filePaths[index] === _.last(filePaths)) {
      plDebug(`all ${filePaths.length} file(s) created: \n %O`, filePaths.join('; '));
      plDebug('FINISH %o', programName);
      plDebug('...............................');
    }
  });
};


const pageLoad = (uri, destPath) => {
  plDebug('START %o', programName);

  const fileName = urlToNameWithExt(uri, '.html');
  const filePath = path.join(destPath, fileName);
  plDebug('defined path to html-file: %o', filePath);

  const dirName = urlToNameWithExt(uri, '_files');
  const dirPath = path.join(destPath, dirName);
  plDebug('defined path to output dir: %o', dirPath);

  let urls;

  return mkdirIfNotExist(dirPath)
    .then(() => axios.get(uri))
    .then(({ data: html }) => {
      plDebug('html received');
      const linksObj = getAllLinksInObj(html);
      const modHtml = replaceAllLinks(html, linksObj, dirName);
      plDebug('html changed, local links replaced');
      fs.writeFile(filePath, modHtml, 'utf8');
      plDebug('html-file create: %o', filePath);
      return linksObj;
    })
    .then((linksObj) => {
      const links = getLinksFromObj(linksObj);
      const responses = loadData(uri, links);
      plDebug(links.length === 0 ?
        'no data to load' :
        `all ${links.length} data items loaded`);
      urls = [...links];
      return responses;
    })
    .then(responses =>
      writeAllData(responses, dirPath, urls))
    .catch((e) => {
      console.log(e);
      // throw new Error('Oops! Some error here', e);
    });
};

export default pageLoad;

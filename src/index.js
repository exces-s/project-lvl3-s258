import axios from 'axios';
import fs from 'mz/fs';
import url from 'url';
import path from 'path';
import cheerio from 'cheerio';
import _ from 'lodash';
import debug from 'debug';

const programName = 'pageloader';
const plDebug = debug(programName);

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
  if (_.isEmpty(links)) {
    plDebug('no data to write');
    plDebug('FINISH %o', programName);
    plDebug('...............................');
  }
  return data.forEach((item, index) => {
    const filePaths = getFilepaths(links, dirPath);
    writeDataItem(item, dirPath, filePaths[index]);
    if (_.isEqual(_.last(filePaths), filePaths[index])) {
      plDebug(`all ${filePaths.length} file(s) created: \n %O`, filePaths.join('; '));
      plDebug('FINISH %o', programName);
      plDebug('...............................');
    }
  });
};

const getErrMessage = (err) => {
  const { config, code, path: problemPath } = err;
  if (code) {
    const fullPath = path.resolve(problemPath);
    return `${code} ERROR. No such file or directory. Check this path: ${fullPath}`;
  }
  return `NETWORK ERROR. Remote server error or network problems. Url: ${config.url}`;
};

const getHtml = response =>
  (response.status === 200 ?
    response.data :
    Promise.reject(response));


const pageLoad = (uri, destPath) => {
  plDebug('START %o', programName);

  const fileName = urlToNameWithExt(uri, '.html');
  const filePath = path.join(destPath, fileName);
  plDebug('defined path to html-file: %o', filePath);

  const dirName = urlToNameWithExt(uri, '_files');
  const dirPath = path.join(destPath, dirName);
  plDebug('defined path to output dir: %o', dirPath);

  let linksObj = {};

  return mkdirIfNotExist(dirPath)
    .then(() => axios.get(uri))
    .then(response => getHtml(response))
    .then((html) => {
      plDebug('html received');
      linksObj = { ...getAllLinksInObj(html) };
      const modHtml = replaceAllLinks(html, linksObj, dirName);
      plDebug('html changed, local links replaced');
      return fs.writeFile(filePath, modHtml, 'utf8');
    })
    .then(() => {
      plDebug('html-file created: %o', filePath);
      const urls = getLinksFromObj(linksObj);
      const responses = loadData(uri, urls);
      plDebug(_.isEmpty(urls) ?
        'no data to load' :
        `all ${urls.length} data items loaded`);
      return responses;
    })
    .then((responses) => {
      const urls = getLinksFromObj(linksObj);
      writeAllData(responses, dirPath, urls);
      return 'Work is done';
    })
    .catch(error => getErrMessage(error));
};

export default pageLoad;

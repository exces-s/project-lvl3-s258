import axios from 'axios';
import fs from 'mz/fs';
import url from 'url';
import path from 'path';
import cheerio from 'cheerio';
import _ from 'lodash';
import debug from 'debug';
import Listr from 'listr';

const programName = 'pageloader';
const debugLog = debug(programName);

const tags = ['img', 'link', 'script'];

const typeAttr = {
  img: 'src',
  link: 'href',
  script: 'href',
};

const getAttr = tag => typeAttr[tag];

const messageByErrCode = {
  ENOENT: 'ENOENT ERROR. No such file or directory. Check if destination path exists',
  ECONNREFUSED: 'NETWORK ERROR. Connect refused by server',
  undefined: 'NETWORK ERROR. Remote server error or network problems',
};

const getMessageByErrCode = errCode => messageByErrCode[errCode];

const getErrMessage = (err) => {
  const { code } = err;
  const errMessage = getMessageByErrCode(code);
  return errMessage;
};


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


const getFilepath = (link, dirPath) =>
  path.join(dirPath, urlToFilename(link));

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

const addAllLinksToObj = html =>
  tags.reduce((acc, tag) => {
    const obj = { [tag]: getLocalLinksByTag(html, tag) };
    return { ...acc, ...obj };
  }, {});

const getLinksFromObj = (linksObj) => {
  const tagsList = _.keys(linksObj);
  return _.flatten(tagsList.map(tag => linksObj[tag]));
};

const getFullLink = (link, uri) =>
  url.resolve(uri, link);


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
    debugLog('creating output directory: %o', dirPath);
    return fs.mkdir(dirPath);
  }
  debugLog('directory already exists');
  return Promise.resolve();
};


const writeDataFile = (response, filePath) =>
  response.data.pipe(fs.createWriteStream(filePath));

const getResponseWithData = (link) => {
  const options = { method: 'get', responseType: 'stream' };
  return axios({ ...options, url: link });
};

const createTaskConfig = (link, uri, dirPath) => {
  const fullLink = getFullLink(link, uri);
  const filePath = getFilepath(link, dirPath);

  const taskFn = (ctx, task) => getResponseWithData(fullLink)
    .then(responce => writeDataFile(responce, filePath))
    .then(() => Promise.resolve())
    .catch(err => task.skip(err.message));

  return { title: fullLink, task: taskFn };
};

const createTasksConfig = (titles, uri, dirPath) =>
  titles.reduce((acc, item) => {
    const taskOption = createTaskConfig(item, uri, dirPath);
    return [...acc, taskOption];
  }, []);

const getAndWriteAllData = (uri, links, dirPath) => {
  if (_.isEmpty(links)) {
    debugLog('no data to load');
    return Promise.resolve();
  }
  const tasksConfig = createTasksConfig(links, uri, dirPath);
  const tasks = new Listr(tasksConfig);
  return tasks.run();
};

const getHtml = response => response.data;

const isStatus200 = response => response.status === 200;


export default (uri, destPath) => {
  debugLog('START %o', programName);

  const fileName = urlToNameWithExt(uri, '.html');
  const filePath = path.join(destPath, fileName);
  debugLog('defined path to html-file: %o', filePath);

  const dirName = urlToNameWithExt(uri, '_files');
  const dirPath = path.join(destPath, dirName);
  debugLog('defined path to output dir: %o', dirPath);

  let urls = [];

  return mkdirIfNotExist(dirPath)
    .then(() => axios.get(uri))
    .then((response) => {
      debugLog('server responded');
      return isStatus200 ?
        response :
        Promise.reject(response);
    })
    .then(response => getHtml(response))
    .then((html) => {
      debugLog('html received');
      const linksObj = { ...addAllLinksToObj(html) };
      const modHtml = replaceAllLinks(html, linksObj, dirName);
      urls = getLinksFromObj(linksObj);
      debugLog('html changed, local links replaced');
      return fs.writeFile(filePath, modHtml, 'utf8');
    })
    .then(() => {
      debugLog('html-file created: %o', filePath);
      return getAndWriteAllData(uri, urls, dirPath);
    })
    .then(() => `\nPage was downloaded to ${destPath} as ${fileName}`)
    .catch((error) => {
      const errMessage = getErrMessage(error);
      return new Error(errMessage);
    });
};

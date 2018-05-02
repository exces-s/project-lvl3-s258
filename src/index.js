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

const getFileName = (link) => {
  const parsed = path.parse(link);
  const newPath = path.format({ ...parsed, base: null, ext: null });
  return `${urlToName(newPath)}${parsed.ext}`;
};

const getFileNames = (links, dirPath) =>
  links.map(item =>
    path.join(dirPath, getFileName(item)));

const getLinksByTag = (tag, html) => {
  const links = [];
  const $ = cheerio.load(html);
  $(tag).each(function iter() {
    links.push($(this).attr('src'));
    links.push($(this).attr('href'));
  });
  return links.filter(v => v);
};

const getInitLinks = (body, tag) => {
  const allTagsLinks = getLinksByTag(tag, body);
  const rightLinks = allTagsLinks
    .filter((item) => {
      const parsed = url.parse(item);
      return parsed.protocol === null;
    });
  return rightLinks;
};

const getFullLinks = (links, uri) =>
  links.map(item => url.resolve(uri, item));


const replaceLinks = (html, links, dirName, attr) => {
  const $ = cheerio.load(html);

  links.forEach((item) => {
    const newUrl = path.join(dirName, getFileName(item));
    return $(`[${attr}="${item}"]`).each(function iter() {
      $(this).attr(attr, newUrl);
    });
  });

  return $.html();
};

const pageLoad = (uri, destPath) => {
  const fileName = `${urlToName(uri)}.html`;
  const filePath = path.join(destPath, fileName);

  const dirName = `${urlToName(uri)}_files`;
  const dirPath = path.join(destPath, dirName);
  const filePaths = [];

  const hrefLinks = [];
  const srcLinks = [];
  const links = [];
  const fullLinks = [];

  return axios.get(uri)
    .then(({ data: html }) => {
      hrefLinks.push(...getInitLinks(html, 'script'), ...getInitLinks(html, 'link'));
      srcLinks.push(...getInitLinks(html, 'img'));
      links.push(...hrefLinks, ...srcLinks);
      fullLinks.push(...getFullLinks(links, uri));
      filePaths.push(...getFileNames(links, dirPath));
      return html;
    })
    .then((html) => {
      const replacedHref = replaceLinks(html, hrefLinks, dirName, 'href');
      const replacedAll = replaceLinks(replacedHref, srcLinks, dirName, 'src');
      return replacedAll;
    })
    .then(html => fs.writeFile(filePath, html, 'utf8'))
    .then(() => {
      if (!fs.existsSync(dirPath)) {
        return fs.mkdir(dirPath);
      }
      return 1;
    })
    .then(() => {
      const options = { method: 'get', responseType: 'stream' };
      const requests = fullLinks.map(value =>
        // axios.get(value));
        axios({ ...options, url: value }));
      return Promise.all(requests);
    })
    .then(responses => responses.forEach((response, index) => {
      response.data.pipe(fs.createWriteStream(filePaths[index]));
    }))
    .catch(e => console.log('\n\nOops! Some error here\n\n', e));
};

export default pageLoad;

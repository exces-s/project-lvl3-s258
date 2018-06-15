import validator from 'validator';
import _ from 'lodash';
import axios from 'axios';
import $ from 'jquery';
import * as view from './view';


const rssUrlValidateType = [
  {
    type: 'duplicate',
    check: (url, data) => {
      const rssUrls = Object.keys(data.rssFeeds);
      return _.includes(rssUrls, url);
    },
  },
  {
    type: 'empty',
    check: url => url === undefined,
  },
  {
    type: 'valid',
    check: url => validator.isURL(url),
  },
  {
    type: 'invalid',
    check: url => !validator.isURL(url),
  },
];

export const getRssUrlValidateType = (url, data) => {
  const obj = _.find(rssUrlValidateType, ({ check }) => check(url, data));
  return obj.type;
};

const isStatus200 = res => res.status === 200;

const getRssData = url => axios.get(url)
  .then(res => (isStatus200(res) ? res : Promise.reject(res)));

const xmlParse = (data) => {
  const domParser = new DOMParser();
  return domParser.parseFromString(data, 'application/xml');
};

const parseArticleFromXml = (articleFromXml) => {
  const title = articleFromXml.querySelector('title').textContent;
  const link = articleFromXml.querySelector('link').textContent;
  const description = articleFromXml.querySelector('description').textContent;
  const articleObj = { title, link, description };
  return articleObj;
};

const getArticles = (document) => {
  const [...articleElements] = document.querySelectorAll('item');
  return articleElements.map(parseArticleFromXml);
};

const getRssFeedObj = (document) => {
  const description = document.querySelector('description').textContent;
  const title = document.querySelector('title').textContent;
  return { description, title };
};

const parseRssData = (xmlData) => {
  const xmlDocument = xmlParse(xmlData).documentElement;
  const rssFeedObj = getRssFeedObj(xmlDocument);
  const articles = getArticles(xmlDocument);
  return { rssFeedObj, articles };
};

const clearRssUrl = (data) => {
  data.rssUrl = '';                  // eslint-disable-line
};

const updateAllArticles = (state, proxy, root) => {
  const timer = 5000;
  if (_.isEmpty(state.rssFeeds)) {
    return setTimeout(updateAllArticles, timer, state, proxy, root);
  }
  const urls = Object.keys(state.rssFeeds);
  return Promise.all(urls.map(url => getRssData(`${proxy}${url}`)))
    .then(rssDatasArr => rssDatasArr
      .map(({ data }) => parseRssData(data))
      .reduce((acc, { articles }) => [...acc, ...articles], [])
      .filter(article => !state.articles.includes(article))
      .forEach(article => state.articles.push(article)))
    .then(() => view.renderRssData(root, state))
    .then(setTimeout(updateAllArticles, timer, state, proxy, root))
    .catch((err) => {
      console.log('Error for update articles');
      console.log(err);
    });
};


export default () => {
  const rssData = {
    rssUrl: {},
    rssFeeds: {},
    articles: [],
  };

  const corsProxy = 'https://cors-anywhere.herokuapp.com/';
  const root = document.querySelector('.jumbotron');
  const rssAddForm = root.querySelector('form');
  const input = root.querySelector('input');

  const isUrlValid = (url, data) => getRssUrlValidateType(url, data) === 'valid';


  document.addEventListener('DOMContentLoaded', () => {
    input.value = '';
  });

  $('#exampleModal').on('show.bs.modal', function fn(event) {
    const button = event.relatedTarget;
    const modalTitle = this.querySelector('.modal-title');
    const modalBody = this.querySelector('.modal-body');
    modalTitle.textContent = button.dataset.title;
    modalBody.textContent = button.dataset.description;
  });

  rssAddForm.addEventListener('input', (e) => {
    rssData.rssUrl = e.target.value;
    view.colorInput(rssData, input);
  });

  rssAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isUrlValid(rssData.rssUrl, rssData)) {
      view.displayAlertForNotValidRssUrl(rssData.rssUrl, rssData);
    } else {
      view.renderWorkInProcess(root);
      getRssData(`${corsProxy}${rssData.rssUrl}`)
        .then(({ data }) => {
          const parsedData = parseRssData(data, rssData.rssUrl);
          rssData.rssFeeds = { ...rssData.rssFeeds, [rssData.rssUrl]: parsedData.rssFeedObj };
          parsedData.articles.forEach(item => rssData.articles.push(item));
        })
        .then(() => {
          view.renderRssData(root, rssData);
          view.renderWorkIsDone(root);
          clearRssUrl(rssData);
        })
        .catch((err) => {
          console.log('Error in submit', err);
          view.renderNetworkError(root);
        });
    }
  });

  const timer = 5000;
  setTimeout(updateAllArticles, timer, rssData, corsProxy, root);
};

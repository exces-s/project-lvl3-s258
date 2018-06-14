import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import validator from 'validator';
import _ from 'lodash';
import axios from 'axios';
import $ from 'jquery';
import * as render from './view';


const rssData = {
  rssUrl: {},
  rssFeeds: {},
  articles: [],
};

const corsProxy = 'https://cors-anywhere.herokuapp.com/';
const root = document.querySelector('.jumbotron');
const rssAddForm = root.querySelector('form');
const input = rssAddForm.querySelector('input');


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

const getRssUrlValidateType = (url, data) => {
  const obj = _.find(rssUrlValidateType, ({ check }) => check(url, data));
  return obj.type;
};

const isUrlValid = (url, data) => getRssUrlValidateType(url, data) === 'valid';

const isStatus200 = res => res.status === 200;

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

const getRssFeedObj = (document, url) => {
  const description = document.querySelector('description').textContent;
  const title = document.querySelector('title').textContent;
  return { [url]: [description, title] };
};

const parseRssData = (xmlData, rssUrl) => {
  const xmlDocument = xmlParse(xmlData).documentElement;
  const rssFeedObj = getRssFeedObj(xmlDocument, rssUrl);
  const articles = getArticles(xmlDocument);
  return { rssFeedObj, articles };
};

const clearRssUrl = (data) => {
  data.rssUrl = '';                  // eslint-disable-line
};

$('#exampleModal').on('show.bs.modal', function fn(event) {
  const button = event.relatedTarget;
  const modalTitle = this.querySelector('h5');
  const modalBody = this.querySelector('.modal-body');
  modalTitle.textContent = button.dataset.title;
  modalBody.textContent = button.dataset.description;
});

rssAddForm.addEventListener('input', (e) => {
  rssData.rssUrl = e.target.value;
  render.colorInput(rssData, input);
});

rssAddForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!isUrlValid(rssData.rssUrl, rssData)) {
    render.displayAlertForNotValidRssUrl(rssData.rssUrl);
  } else {
    render.renderWorkInProcess(root);
    axios.get(`${corsProxy}${rssData.rssUrl}`)
      .then(res => (isStatus200(res) ?
        res : Promise.reject(res)))
      .then(({ data }) => {
        const parsedData = parseRssData(data, rssData.rssUrl);
        rssData.rssFeeds = { ...rssData.rssFeeds, ...parsedData.rssFeedObj };
        parsedData.articles.forEach(item => rssData.articles.push(item));
      })
      .then(() => {
        render.renderRssData(root, rssData);
        render.renderWorkIsDone(root);
        clearRssUrl(rssData);
      })
      .catch((err) => {
        console.log(err);
        render.renderNetworkError(root);
      });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  input.value = '';
});

export default getRssUrlValidateType;

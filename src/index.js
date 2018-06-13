import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import validator from 'validator';
import axios from 'axios';
import _ from 'lodash';
import $ from 'jquery';


const rssData = {
  rssUrl: {},
  rssFeeds: {},
  articles: [],
};

const corsProxy = 'https://cors-anywhere.herokuapp.com/';
const root = document.querySelector('.jumbotron');
const rssAddForm = root.querySelector('form');
const input = rssAddForm.querySelector('input');


const isDuplicateRssUrl = (rssUrl) => {
  const rssUrls = Object.keys(rssData.rssFeeds);
  return _.includes(rssUrls, rssUrl);
};

const rssUrlValidateType = [
  {
    type: 'duplicate',
    check: url => isDuplicateRssUrl(url),
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

const getRssUrlValidateType = (rssUrl) => {
  const obj = _.find(rssUrlValidateType, ({ check }) => check(rssUrl));
  return obj.type;
};

const paintInputActions = {
  valid: (inputElement) => {
    inputElement.classList.remove('is-invalid');
    inputElement.classList.add('is-valid');
  },
  invalid: (inputElement) => {
    inputElement.classList.remove('is-valid');
    inputElement.classList.add('is-invalid');
  },
  duplicate: (inputElement) => {
    inputElement.classList.remove('is-valid');
    inputElement.classList.add('is-invalid');
  },
  empty: (inputElement) => {
    inputElement.classList.remove('is-invalid');
    inputElement.classList.remove('is-valid');
  },
};

const colorInput = (rssUrl, inputElement) =>
  paintInputActions[getRssUrlValidateType(rssUrl)](inputElement);

const isStatus200 = res => res.status === 200;

const createRssFeedElement = (rssUrl) => {
  const [title, description] = rssData.rssFeeds[rssUrl];
  const rssFeedElement = document.createElement('div');
  rssFeedElement.classList.add('row');
  rssFeedElement.innerHTML = `
    <ul class="class="list-group list-group-flush">
      <li class="list-group-item">${description}</li>
      <li class="list-group-item">${title}</li>
    </ul>
  `;
  return rssFeedElement;
};

const renderRssFeedsListHtml = (rssFeedsListRoot) => {
  rssFeedsListRoot.innerHTML = '';                            // eslint-disable-line
  const rssFeeds = Object.keys(rssData.rssFeeds);
  const rssFeedElements = rssFeeds.map(createRssFeedElement);
  rssFeedElements.forEach(item => rssFeedsListRoot.prepend(item));
};

const createArticleElement = (rssArticleObj) => {
  const articleElement = document.createElement('div');
  articleElement.innerHTML = `
    <div class="row">
      <a href="" class="list-group-item list-group-item-action col-9">
      </a>
      <button type="button" class="btn btn-secondary col-3" data-title="${rssArticleObj.title}" data-link="${rssArticleObj.link}" data-description="${rssArticleObj.description}" data-toggle="modal" data-target="#exampleModal">
        Open description
      </button>
    </div>
    `;
  const articleLink = articleElement.querySelector('a');
  articleLink.href = rssArticleObj.link;
  articleLink.innerText = rssArticleObj.title || 'No title';
  return articleElement;
};

const renderArticlesListHtml = (articlesListRoot) => {
  articlesListRoot.innerHTML = '';                                     // eslint-disable-line
  rssData.articles
    .map(createArticleElement)
    .forEach(item => articlesListRoot.prepend(item));
};

const alertMessages = {
  enterRssFeed: `
  <div class="alert alert-danger alert-dismissible fade show" role="alert">
    RSS-feed field is empty.
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
  `,
  networkError: `
  <div class="alert alert-danger alert-dismissible fade show" role="alert">
    <strong>Network error.</strong> Try again a little later.
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
  `,
  access: `
  <div class="alert alert-success alert-dismissible fade show" role="alert">
    All articles processed.
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
  `,
  duplicatedRssFeed: `
  <div class="alert alert-danger alert-dismissible fade show" role="alert">
    This RSS-feed already processed.
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
  `,
  notRssFeed: `
  <div class="alert alert-success alert-dismissible fade show" role="alert">
    This URL is not RSS-feed.
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
  `,
  workInProgress: `
  <div class="alert alert-info alert-dismissible fade show" role="alert" data-info>
    Work in progress.
  </div>
  `,
};

const displayAlert = (message) => {
  const messageRoot = document.querySelector('.needs-validation');
  const messageDiv = document.createElement('div');
  messageDiv.innerHTML = alertMessages[message];
  messageRoot.append(messageDiv);
};

const closeInfoAlerts = () => {
  const messageElement = document.querySelector('.needs-validation div[data-info]');
  const messageParent = messageElement.parentElement;
  messageParent.removeChild(messageElement);
};

const clearInput = (inputElement) => {
  inputElement.value = '';              // eslint-disable-line
};

const clearRssUrl = () => {
  rssData.rssUrl = '';
};

const toggleButtonActivityMode = (buttonElement) => {
  buttonElement.classList.toggle('disabled');
};

const toggleInputReadonlyMode = (inputElement) => {
  inputElement.hasAttribute('readonly') ?   // eslint-disable-line
    inputElement.removeAttribute('readonly') :
    inputElement.setAttribute('readonly', true);
};

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
  // if (_.isEmpty(rssData.articles)) {
  //   rssData.articles = [];
  // }
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


$('#exampleModal').on('show.bs.modal', function fn(event) {
  const button = event.relatedTarget;
  const modalTitle = this.querySelector('h5');
  const modalBody = this.querySelector('.modal-body');
  console.log(button);
  modalTitle.textContent = button.dataset.title;
  modalBody.textContent = button.dataset.description;
});

rssAddForm.addEventListener('input', (e) => {
  rssData.rssUrl = e.target.value;
  colorInput(rssData.rssUrl, input);
});

rssAddForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (getRssUrlValidateType(rssData.rssUrl) === 'invalid') {
    clearInput(input);
    clearRssUrl();
  } else
  if (getRssUrlValidateType(rssData.rssUrl) === 'duplicate') {
    displayAlert('duplicatedRssFeed');
    clearInput(input);
    clearRssUrl();
  } else
  if (getRssUrlValidateType(rssData.rssUrl) === 'empty') {
    displayAlert('enterRssFeed');
  } else {
    displayAlert('workInProgress');
    const addRssButton = root.querySelector('.jumbotron .form-group .btn');
    toggleButtonActivityMode(addRssButton);
    const addRssInput = root.querySelector('.jumbotron .form-group input');
    toggleInputReadonlyMode(addRssInput);
    axios.get(`${corsProxy}${rssData.rssUrl}`)
      .then(res => (isStatus200(res) ?
        res : Promise.reject(res)))
      .then(({ data }) => {
        const parsedData = parseRssData(data, rssData.rssUrl);
        rssData.rssFeeds = { ...rssData.rssFeeds, ...parsedData.rssFeedObj };
        parsedData.articles.forEach(item => rssData.articles.push(item));
      })
      .then(() => {
        const articlesListRoot = document.querySelector('.jumbotron div.col-md-7');
        renderArticlesListHtml(articlesListRoot);
        const rssFeedsListRoot = document.querySelector('.jumbotron div.col-md-4');
        renderRssFeedsListHtml(rssFeedsListRoot);
      })
      .then(() => {
        closeInfoAlerts();
        displayAlert('access');
        clearInput(input);
        clearRssUrl();
        toggleButtonActivityMode(addRssButton);
        toggleInputReadonlyMode(addRssInput);
      })
      .catch((err) => {
        console.log(err);
        displayAlert('networkError');
        clearInput(input);
        clearRssUrl();
        toggleButtonActivityMode(addRssButton);
        toggleInputReadonlyMode(addRssInput);
      });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  input.value = '';
});


// const createArticleElement = (rssArticleObj) => {
//   const articleElement = document.createElement('a');
//   articleElement.href = rssArticleObj.link;
//   articleElement.innerText = rssArticleObj.title || 'No title';
//   articleElement.classList.add('list-group-item', 'list-group-item-action');
//   return articleElement;
// };

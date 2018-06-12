import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import validator from 'validator';
import axios from 'axios';


let rssUrl = '';
const rssFeedsList = {};
const articlesList = [];

const root = document.querySelector('.jumbotron');
const rssAddForm = root.querySelector('form');
const input = rssAddForm.querySelector('input');
const corsProxy = 'https://cors-anywhere.herokuapp.com/';


const paintInputActions = {
  true: (inputElement) => {
    inputElement.classList.remove('is-invalid');
    inputElement.classList.add('is-valid');
  },
  false: (inputElement) => {
    inputElement.classList.remove('is-valid');
    inputElement.classList.add('is-invalid');
  },
};

const isDuplicateRssUri = (rssUri) => {
  const rssUrls = Object.keys(rssFeedsList);
  return rssUrls.includes(rssUri);
};

const isValidateRssUri = rssUri =>
  validator.isURL(rssUri) && !isDuplicateRssUri(rssUri);

const paintInput = (rssUri, inputElement) => {
  if (rssUri.length === 0) {
    inputElement.classList.remove('is-invalid');
    inputElement.classList.remove('is-valid');
  } else {
    paintInputActions[isValidateRssUri(rssUri)](inputElement);
  }
};

rssAddForm.addEventListener('input', (e) => {
  rssUrl = e.target.value;
  paintInput(rssUrl, input);
});


const isStatus200 = res => res.status === 200;

const xmlParse = (data) => {
  const domParser = new DOMParser();
  return domParser.parseFromString(data, 'application/xml');
};

const addRssFeedToList = (document, url) => {
  const description = document.querySelector('description').textContent;
  const title = document.querySelector('title').textContent;
  rssFeedsList[url] = [description, title];
};

const addArticlesToList = (document) => {
  const articleElements = document.querySelectorAll('item');
  articleElements.forEach(item => articlesList.push(item));
};

const createRssFeedElement = (rssUri) => {
  const [title, description] = rssFeedsList[rssUri];
  const rssFeedElement = document.createElement('div');
  rssFeedElement.classList.add('row');
  rssFeedElement.innerHTML = `
    <ul class="class="list-group list-group-flush">
      <li class="list-group-item">${description}</li>
      <li class="list-group-item">${title}</li>
    </ul>
  `;
  console.log('rssFeedElement', rssFeedElement.outerHTML);
  return rssFeedElement;
};

const renderRssFeedsListHtml = (rssFeedsListRoot) => {
  rssFeedsListRoot.innerHTML = '';
  const rssFeeds = Object.keys(rssFeedsList);
  const rssFeedElements = rssFeeds.map(createRssFeedElement);
  rssFeedElements.forEach(item => rssFeedsListRoot.prepend(item));
};


const createArticleElement = (rssArticle) => {
  const title = rssArticle.querySelector('title').textContent;
  const link = rssArticle.querySelector('link').textContent;
  const articleElement = document.createElement('a');
  articleElement.href = link;
  articleElement.innerText = title;
  articleElement.classList.add('list-group-item', 'list-group-item-action');
  return articleElement;
};

const renderArticlesListHtml = (articlesListRoot) => {
  articlesListRoot.innerHTML = '';
  articlesList
    .map(createArticleElement)
    .forEach(item => articlesListRoot.prepend(item));
};

const alertMessages = {
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
  <div class="alert alert-info alert-dismissible fade show" role="alert">
    Work in progress.
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
  `,
};

const displayAlert = (message) => {
  const messageRoot = document.querySelector('.needs-validation');
  const messageDiv = document.createElement('div');
  messageDiv.innerHTML = alertMessages[message];
  messageRoot.append(messageDiv);
};

const closeAlerts = () => {
  const messageRoot = document.querySelector('.needs-validation');
  messageRoot.textContent = '';
};

rssAddForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validator.isURL(rssUrl)) {
    input.value = '';
  }
  if (isDuplicateRssUri(rssUrl)) {
    displayAlert('duplicatedRssFeed');
    input.value = '';
  } else {
    axios.get(`${corsProxy}${rssUrl}`)
      .then(res => (isStatus200(res) ?
        res : Promise.reject(res)))
      .then(({ data }) => {
        displayAlert('workInProgress');
        return xmlParse(data);
      })
      .then((xmlData) => {
        const document = xmlData.documentElement;
        addRssFeedToList(document, rssUrl);
        addArticlesToList(document);
      })
      .then(() => {
        const articlesListRoot = document.querySelector('.jumbotron div.col-md-7');
        renderArticlesListHtml(articlesListRoot);
        const rssFeedsListRoot = document.querySelector('.jumbotron div.col-md-4');
        renderRssFeedsListHtml(rssFeedsListRoot);
      })
      .then(() => {
        closeAlerts();
        displayAlert('access');
        input.value = '';
      })
      .catch(() => displayAlert('networkError'));
  }
});

document.addEventListener('DOMContentLoaded', () => {
  input.value = '';
});

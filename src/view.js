import alertMessages from './alertMessages';
import { getRssUrlValidateType } from './init';


const colorInputActions = {
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

export const colorInput = (rssData, inputElement) => {
  colorInputActions[getRssUrlValidateType(rssData.rssUrl, rssData)](inputElement);
};

const displayAlert = (message) => {
  const messageRoot = document.querySelector('.needs-validation');
  const messageDiv = document.createElement('div');
  messageDiv.innerHTML = alertMessages[message];
  messageRoot.append(messageDiv);
};

const closeInfoAlert = () => {
  const messageElement = document.querySelector('.needs-validation div[data-info]');
  const messageParent = messageElement.parentElement;
  messageParent.removeChild(messageElement);
};

const clearInput = (inputElement) => {
  inputElement.value = '';              // eslint-disable-line
};


const toggleButtonActivityMode = (buttonElement) => {
  buttonElement.classList.toggle('disabled');
};

const toggleInputReadonlyMode = (inputElement) => {
  if (inputElement.hasAttribute('readonly')) {   // eslint-disable-line
    inputElement.removeAttribute('readonly');
  } else {
    inputElement.setAttribute('readonly', true);
  }
};

const createRssFeedElement = (rssUrl, rssData) => {
  const { title, description } = rssData.rssFeeds[rssUrl];
  const rssFeedElement = document.createElement('div');
  rssFeedElement.classList.add('row');
  rssFeedElement.innerHTML = `
      <ul class="class="list-group list-group-flush">
        <li class="list-group-item">${title}</li>
        <li class="list-group-item">${description}</li>
      </ul>
    `;
  return rssFeedElement;
};

const renderRssFeedsListHtml = (rssFeedsListRoot, rssData) => {
  rssFeedsListRoot.innerHTML = '';                            // eslint-disable-line
  const rssFeeds = Object.keys(rssData.rssFeeds);
  rssFeeds.map(item => createRssFeedElement(item, rssData))
    .forEach(item => rssFeedsListRoot.prepend(item));
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

const renderArticlesListHtml = (articlesListRoot, rssData) => {
  articlesListRoot.innerHTML = '';                                     // eslint-disable-line
  rssData.articles
    .map(createArticleElement)
    .forEach(item => articlesListRoot.prepend(item));
};

export const renderRssData = (root, rssData) => {
  const articlesListRoot = root.querySelector('div[data-articles-list]');
  renderArticlesListHtml(articlesListRoot, rssData);

  const rssFeedsListRoot = root.querySelector('div[data-rss-feeds-list]');
  renderRssFeedsListHtml(rssFeedsListRoot, rssData);
};

const isInvalidRssUrl = rssUrl => getRssUrlValidateType(rssUrl) === 'invalid';
const isDuplicateRssUrl = rssUrl => getRssUrlValidateType(rssUrl) === 'duplicate';
const isEmptyRssUrl = rssUrl => getRssUrlValidateType(rssUrl) === 'empty';

export const displayAlertForNotValidRssUrl = (url) => {
  if (isInvalidRssUrl(url)) {
    displayAlert('invalidUrl');
  } else
  if (isDuplicateRssUrl(url)) {
    displayAlert('duplicatedRssFeed');
  } else
  if (isEmptyRssUrl(url)) {
    displayAlert('enterRssFeed');
  }
};

export const renderWorkInProcess = (root) => {
  displayAlert('workInProgress');
  const addRssButton = root.querySelector('.form-group .btn');
  const addRssInput = root.querySelector('.form-group input');
  toggleButtonActivityMode(addRssButton);
  toggleInputReadonlyMode(addRssInput);
};

export const renderWorkIsDone = (root) => {
  closeInfoAlert();
  displayAlert('access');
  const input = root.querySelector('input');
  clearInput(input);
  const addRssButton = root.querySelector('.form-group .btn');
  const addRssInput = root.querySelector('.form-group input');
  toggleButtonActivityMode(addRssButton);
  toggleInputReadonlyMode(addRssInput);
};

export const renderNetworkError = (root) => {
  closeInfoAlert();
  displayAlert('networkError');
  const addRssButton = root.querySelector('.form-group .btn');
  const addRssInput = root.querySelector('.form-group input');
  toggleButtonActivityMode(addRssButton);
  toggleInputReadonlyMode(addRssInput);
};

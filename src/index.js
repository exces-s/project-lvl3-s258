import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import validator from 'validator';
// import url from 'url';
// import _ from 'lodash';
// import init from './init';

// init();

const root = document.querySelector('.jumbotron');
const rssAddForm = root.querySelector('form');
const input = rssAddForm.querySelector('input');

let rssUrl = '';

const isRssUrlValidate = (rssUri) => {
  if (!validator.isURL(rssUri)) {
    return false;
  }
  // const parsedUrl = url.parse(rssUri);
  return true;
};

const validateInput = (rssUri, inputElement) => {
  if (isRssUrlValidate(rssUri)) {
    inputElement.classList.remove('is-invalid');
    inputElement.classList.add('is-valid');
  } else {
    inputElement.classList.remove('is-valid');
    inputElement.classList.add('is-invalid');
  }
};

rssAddForm.addEventListener('input', (e) => {
  rssUrl = e.target.value;
  validateInput(rssUrl, input);
});

// rssAddForm.addEventListener('submit', (e) => {
//   e.preventDefault();
// });

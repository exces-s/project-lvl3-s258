import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import init from './init';

init();

const root = document.getElementById('point');
const rssAddForm = `
<main role="main" class="container">
  <div class="jumbotron">
    <form>
      <input class="form-control form-control-sm" type="text" placeholder="Add RSS-feed">
      <button type="button" class="btn btn-primary btn-sm">Add</button>
    </form>
  </div>
</main>
`;

root.innerHTML = rssAddForm;

const rssFeddValidate = (rssFeed) => {

}

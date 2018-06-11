import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
// import init from './init';

// init();
const element = document.getElementById('point');
element.innerHTML = `
<main role="main" class="container">
    <div class="jumbotron">
    <form>
    <div class="form-group">
      <label for="exampleFormControlTextarea1">Example textarea</label>
      <textarea class="form-control" id="exampleFormControlTextarea1" rows="1"></textarea>
    </div>
    <button class="btn btn-primary" type="submit">Button</button>
  </form>
    </div>
</main>
</body>
</html>
`;

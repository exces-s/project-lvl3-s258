export default {
  invalidUrl: `
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
      This is not URL.
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    `,
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

# Public A2 Website

Author: Tianyi Li <id_09188388@foxmail.com>.

Pages: `index.html`, `search.html`, `detail.html`. Shared CSS and JavaScript are under `assets/`. The site uses native HTML, CSS, JavaScript, DOM manipulation and fetch.

Extract this zip into `A2/clientside/`, with the API zip extracted into the sibling `A2/api/`. Start the API from `api/` after installing its dependencies and setting up MySQL, then open http://localhost:3000/.

- Home lists upcoming active events and links to details.
- Search supports date, partial location and category filters and Clear filters.
- Details show event information, tickets, fundraising and charity contacts. Register remains disabled while loading or after an error; on success it shows the A2 construction notice.

Directly opening `index.html` also works while the API is running at localhost:3000. Prefer the HTTP URL above. Opening these files alone does not start the API or MySQL. The API serves only this directory, not backend credentials.

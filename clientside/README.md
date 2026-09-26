# Public Homepage

Open http://localhost:3000/ after starting the API. The Express server hosts only this clientside directory, and the page calls /api/events/upcoming on the same origin.

The homepage uses HTML, CSS and native JavaScript DOM operations. It includes charity information, contact details, responsive navigation, event cards, loading/empty/error messages, ticket prices and fundraising progress.

All displayed event dates and date-based past/upcoming labels use Australia/Brisbane. The Home, Events and Contact navigation links work within this module. Search navigation and links to the full event detail page will be added with those later modules.

Directly opening index.html is also supported with the API on localhost:3000. Prefer the HTTP URL when using a custom port.

const express = require('express');
const app = express();
const port = process.env.PORT || 8000;
const browserObject = require('./browser');
const scraperController = require('./pageController');

app.get('/', (req, res) => {
  const query = req.query.search;
  const browserInstance = browserObject.startBrowser();

  if (!query) res.json({
    type: 'error',
    message: 'Missing query param.'
  });

  scraperController(browserInstance, query).then(data => {
    res.json(data);
  })
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});

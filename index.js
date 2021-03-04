const express = require('express');
const app = express();
const port = 8000;
const browserObject = require('./browser');
const scraperController = require('./pageController');

app.get('/', (req, res) => {
  const query = req.query.search;
  // res.json(data);
  const browserInstance = browserObject.startBrowser();

  scraperController(browserInstance, query).then(data => {
    res.json(data);
  })
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});

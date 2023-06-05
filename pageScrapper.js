const scrollPageToBottom = require('puppeteer-autoscroll-down');
const Ecommerces = [
  // 'EXITO', //Check selectors.
  // 'ALKOSTO', //waiting for selector `#salesperson_result` failed: timeout 30000ms exceeded
  'MERCADOLIBRE', //Ok
  'FALABELLA', //Ok
];
const Endpoints = {
  EXITO: `https://www.exito.com/${QUERY}?map=ft`,
  ALKOSTO: 'https://www.alkosto.com/salesperson/result/?q=',
  MERCADOLIBRE: 'https://listado.mercadolibre.com.co/',
  FALABELLA: 'https://www.falabella.com.co/falabella-co/search?Ntt=',
  FALABELLA_FALLBACK: 'https://www.falabella.com.co/falabella-co/search?Ntt=',
};

const SELECTORS = {
  EXITO: {
    WAIT: '.vtex-search-result-3-x-gallery',
    PRODUCT: '.vtex-product-summary-2-x-container',
    PRICE: '.exito-vtex-components-4-x-alliedDiscountPrice span',
    URL: '.vtex-product-summary-2-x-clearLink',
    NAME: '.vtex-store-components-3-x-productBrand',
    IMAGE: '.vtex-product-summary-2-x-imageNormal',
  },
  ALKOSTO: {
    WAIT: '#salesperson_result',
    PRODUCT: '.salesperson-products-grid-item',
    PRICE: '.price',
    URL: '.product-image',
    NAME: '.product-name a',
    IMAGE: '.product-image img',
  },
  MERCADOLIBRE: {
    WAIT: '.ui-search-layout',
    PRODUCT: '.ui-search-layout__item',
    PRICE: '.ui-search-price__part',
    URL: '.ui-search-link',
    NAME: '.ui-search-item__title',
    IMAGE: '.slick-slide .ui-search-result-image__element',
  },
  FALABELLA: {
    WAIT: '.pod-group--products',
    PRODUCT: '.search-results-4-grid.grid-pod',
    PRICE: '.prices-4_GRID .jsx-3736277290',
    URL: '.layout_grid-view',
    NAME: '.pod-subTitle',
    IMAGE: '.pod-head img',
  },
  FALABELLA_FALLBACK: {
    WAIT: '.search-results--products',
    PRODUCT: '.pod',
    PRICE: '.pod-prices .prices-0',
    URL: '.list-view',
    NAME: '.pod-subTitle',
    IMAGE: 'img',
  },
};

class PageScrapper {
  constructor(browser, query) {
    this.browser_ = browser;
    this.query_ = query;
  }

  async scrapePage(ecommerce) {
    const url = `${Endpoints[ecommerce]}${this.query_}`;
    const page = await this.browser_.newPage();
    console.log(`Navigating to ${url}...`);
    try {
      await page.goto(url);
    } catch (err) {
      console.log('>>> goto error')
      console.log(err);
      return [];
    }
    await page.setViewport({
      width: 1200,
      height: 12000,
    });
    await scrollPageToBottom(page);

    try {
      await page.waitForSelector(SELECTORS[ecommerce].WAIT);
      const products = await page.$$eval(SELECTORS[ecommerce].PRODUCT,
          (products, SELECTORS, ecommerce) => {
        const defaultFormatter = (rawPrice) => {
          const reg = /\.|\(precio final\)/gmi;

          return +rawPrice.split('$')[1].replace(reg, '');
        }
        products = products.map(el => {
          const url = el.querySelector(SELECTORS[ecommerce].URL).href;
          const price = el.querySelector(SELECTORS[ecommerce].PRICE).innerText;
          const priceParsed = defaultFormatter(price) ?? price;
          const name = el.querySelector(SELECTORS[ecommerce].NAME).innerText;
          let image;

          try {
            image = el.querySelector(SELECTORS[ecommerce].IMAGE).src;
          } catch (err) {
            image = 'https://via.placeholder.com/250';
          }

          return {
            url,
            price,
            priceParsed,
            name,
            image,
            ecommerce: ecommerce.replace('_FALLBACK', ''),
          };
        });

        return products;
      }, SELECTORS, ecommerce);

      if (products.length === 0) {
        const ecommerceFallback = `${ecommerce}_FALLBACK`;
        console.log('>>> has zero products', {ecommerceFallback})
        if (SELECTORS[ecommerceFallback]) {
          console.log('>>> has fallback')
          return this.scrapePage(ecommerceFallback);
        }
      }
      return products;
    } catch (err) {
      console.log('>>> Error parsing products', err);
      if (!ecommerce.includes('FALLBACK')) {
        const ecommerceFallback = `${ecommerce}_FALLBACK`;
        if (SELECTORS[ecommerceFallback]) {
          console.log('>>> has fallback')
          return this.scrapePage(ecommerceFallback);
        }
      } else {
        return [];
      }
    }
  }

  async scraper () {
    console.time('fetch', 'Start');
    const products = Ecommerces;
    const promises = products.map((product) => this.scrapePage(product));
    const data = await Promise.all(promises);
    console.timeEnd('fetch', 'Finish!');

    return data.flat();
  }
}

module.exports = PageScrapper;

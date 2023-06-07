const scrollPageToBottom = require('puppeteer-autoscroll-down');
const Ecommerces = [
  'EXITO', //Ok
  'ALKOSTO', //Ok
  'MERCADOLIBRE', //Ok
  'FALABELLA', //Ok
];
const Endpoints = {
  EXITO: 'https://www.exito.com/__QUERY__?map=ft',
  ALKOSTO: 'https://www.alkosto.com/search/?text=__QUERY__',
  MERCADOLIBRE: 'https://listado.mercadolibre.com.co/__QUERY__',
  FALABELLA: 'https://www.falabella.com.co/falabella-co/search?Ntt=__QUERY__',
  FALABELLA_FALLBACK: 'https://www.falabella.com.co/falabella-co/search?Ntt=__QUERY__',
};

const SELECTORS = {
  EXITO: {
    WAIT: '.vtex-search-result-3-x-gallery',
    PRODUCT: '.vtex-product-summary-2-x-container',
    PRICE: '.exito-vtex-components-4-x-PricePDP span',
    URL: '.vtex-product-summary-2-x-clearLink',
    NAME: '.vtex-store-components-3-x-productBrand',
    IMAGE: '.vtex-product-summary-2-x-imageNormal',
  },
  ALKOSTO: {
    WAIT: '.product__list',
    PRODUCT: '.product__item',
    PRICE: '.product__price--discounts__price span',
    URL: '.product__item__top__title a',
    NAME: '.product__item__top__title a',
    IMAGE: '.product__item__information__image .js-algolia-product-click',
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
    const url = Endpoints[ecommerce].replace('__QUERY__', this.query_);
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
          const url = el.querySelector(SELECTORS[ecommerce].URL)?.href;
          const price = el.querySelector(SELECTORS[ecommerce].PRICE)?.innerText;
          const priceParsed = defaultFormatter(price);
          const name = el.querySelector(SELECTORS[ecommerce].NAME)?.innerText;
          const imageSrc = el.querySelector(SELECTORS[ecommerce].IMAGE)?.srcset ? el.querySelector(SELECTORS[ecommerce].IMAGE)?.srcset.split(' ')[0] : el.querySelector(SELECTORS[ecommerce].IMAGE)?.src;
          const image = imageSrc ?? 'https://via.placeholder.com/250';

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

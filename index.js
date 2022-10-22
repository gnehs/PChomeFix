const axios = require('axios');
const colors = require('colors');
const serve = require('koa-static')
const path = require('path');
const pangu = require('pangu');
const cheerio = require('cheerio');
const Koa = require('koa');
const Router = require('@koa/router');

const app = new Koa();
const router = new Router();

async function pchomeJsonpAPI(url) {
  let res = await axios.get(url);
  res = res.data;
  res = res.replace('try{jsonp(', '');
  res = res.replace(');}catch(e){if(window.console){console.log(e);}}', '');
  return JSON.parse(res);
}

app.use(serve(path.join(__dirname, 'public')));
router.get('/', async (ctx) => {

  let title = `PChome 預覽連結好朋友`
  let description = `協助修正 PChome 線上購物商品在社群媒體與通訊軟體中的預覽`
  let img = `https://p.pancake.tw/og.jpg`
  let url = `https://p.pancake.tw/`
  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css" integrity="sha512-NhSC1YmyruXifcj/KFRWoC561YpHpc5Jtzgvbuzx5VozKpWvQ+4nXhPdFgmx8xqexRcpAglTj9sIBWINXa8x5w==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown.min.css" integrity="sha512-KUoB3bZ1XRBYj1QcH4BHCQjurAZnCO3WdrswyLDtp7BMwCw7dPZngSLqILf68SGgvnWHTD5pPaYrXi6wiRJ65g==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <style>
      .markdown-body {
        box-sizing: border-box;
        min-width: 200px;
        max-width: 980px;
        margin: 0 auto;
        padding: 45px;
      }

      @media (max-width: 767px) {
        .markdown-body {
          padding: 15px;
        }
      }
      img.banner {
        border-radius: 16px;
      }
    </style>

    <title>${title}</title>
    <meta name="title" content="${title}" />
    <meta name="description" content="${description}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:site_name" content="PChome 預覽連結好朋友" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${img}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${url}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${img}" />
  </head>
  <body class="markdown-body">
    <img src="https://p.pancake.tw/og.jpg" alt="PChome 預覽連結好朋友" class="banner" />
    <h1>PChome 預覽連結好朋友</h1>
    <p>協助修正 PChome 線上購物商品在社群媒體與通訊軟體中的預覽</p>
    <h2>如何使用？</h2>
    <h3>直接使用</h3>
    <p>將連結中的 <code>https://24h.pchome.com.tw</code> 替換為 <code>https://p.pancake.tw</code> 即可</p>
    <h3>透過 UserScript 使用</h3>
    <p>輕觸「<a href="https://github.com/gnehs/userscripts/raw/main/pchome-link-copy.user.js" target="_blank">這裡</a>」來安裝 UserScript，當開啟支援的商品頁面時便會自動顯示複製連結在網頁右上角。</p>
    <h2>相關連結</h2>
    <ul>
      <li><a href="https://github.com/gnehs/PChomeFix" target="_blank">GitHub</a></li>
    </ul>
  </body>
  </html>`
  ctx.set('Cache-Control', 'public, max-age=604800');
  ctx.type = 'text/html';
  ctx.body = html;
})
router.get('/prod/:id', async (ctx) => {
  const { id } = ctx.params;
  let prod = await pchomeJsonpAPI(`https://ecapi.pchome.com.tw/ecshop/prodapi/v2/prod/${id}&fields=Id,Name,Nick,Price,Discount,Pic&_callback=jsonp`)
  let desc = await pchomeJsonpAPI(`https://ecapi-cdn.pchome.com.tw/cdn/ecshop/prodapi/v2/prod/${id}/desc&fields=Id,Slogan&_callback=jsonp`)
  prod = Object.values(prod)[0];
  desc = Object.values(desc)[0];
  let title = pangu.spacing(cheerio.load(prod.Name).text());
  let description = pangu.spacing(cheerio.load(desc.Slogan).text());
  let img = Object.entries(prod.Pic).map(([server, url]) => `https://cs-${server}.ecimg.tw${url}`)[0]
  let url = `https://24h.pchome.com.tw/prod/${id}`
  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <!-- Redirect -->
    <meta http-equiv="refresh" content="0; url = ${url}" />
    <!-- SEO -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <meta name="title" content="${title}" />
    <meta name="description" content="${description}" />

    <!-- Style -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css" integrity="sha512-NhSC1YmyruXifcj/KFRWoC561YpHpc5Jtzgvbuzx5VozKpWvQ+4nXhPdFgmx8xqexRcpAglTj9sIBWINXa8x5w==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.1.0/github-markdown.min.css" integrity="sha512-KUoB3bZ1XRBYj1QcH4BHCQjurAZnCO3WdrswyLDtp7BMwCw7dPZngSLqILf68SGgvnWHTD5pPaYrXi6wiRJ65g==" crossorigin="anonymous" referrerpolicy="no-referrer" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:site_name" content="PChome 線上購物" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${img}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${url}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${img}" />
    <style>
      .markdown-body {
        box-sizing: border-box;
        min-width: 200px;
        max-width: 980px;
        margin: 0 auto;
        padding: 45px;
      }

      @media (max-width: 767px) {
        .markdown-body {
          padding: 15px;
        }
      }
      img.banner {
        border-radius: 16px;
      }
    </style>
  </head>
  <body class="markdown-body">
    <h1>PChome 預覽連結好朋友</h1>
    <p>
      正在帶您前往「<a href="${url}">${title}</a>」。
    </p>
  </body>
  </html>
  `
  ctx.set('Cache-Control', 'public, max-age=604800');
  ctx.type = 'text/html';
  ctx.body = html;

  let country = ctx.request.header['cf-ipcountry'];
  console.log(`${country || ctx.ip} ${ctx.url} `.gray + `${ctx.status}`.green);
});
router.get('/(.*)', async (ctx) => {
  // redirect to pchome
  ctx.redirect(`https://24h.pchome.com.tw/${ctx.params[0]}`);

  let country = ctx.request.header['cf-ipcountry'];
  console.log(`${country || ctx.ip} ${ctx.url} `.gray + `${ctx.status}`.green);
})

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);
console.log('Server running on http://localhost:3000');
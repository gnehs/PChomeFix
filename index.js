const axios = require('axios');
const colors = require('colors');
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
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <meta name="title" content="${title}" />
    <meta name="description" content="${description}" />

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
  </head>
  <body>
    <a href="${url}">${title}</a>
    <script>
      window.location.href = '${url}';
    </script>
  </body>
  </html>
  `
  ctx.set('Cache-Control', 'public, max-age=604800');
  ctx.type = 'text/html';
  ctx.body = html;
  console.log(`${ctx.ip} ${ctx.method} ${ctx.url} ${ctx.status}`.green);
});
router.get('/(.*)', async (ctx) => {
  // redirect to pchome
  ctx.redirect(`https://24h.pchome.com.tw/${ctx.params[0]}`);
  console.log(`${ctx.ip} ${ctx.method} ${ctx.url} ${ctx.status}`.green);
})

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);
console.log('Server running on http://localhost:3000');
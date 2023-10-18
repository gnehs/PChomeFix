const colors = require("colors");
const serve = require("koa-static");
const path = require("path");
const pangu = require("pangu");
const Koa = require("koa");
const Router = require("@koa/router");
const puppeteer = require("puppeteer");
const { JSDOM } = require("jsdom");
const fs = require("fs");

const app = new Koa();
const router = new Router();

let _browser;
async function getBrowser() {
  if (!_browser) {
    _browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return _browser;
}
function parseHtmlToText(html) {
  const h = new JSDOM(`<!DOCTYPE html><body>${html}</body>`);
  return h.window.document.querySelector("body").textContent;
}
async function pchomeJsonpAPI(url) {
  let res = await fetch(url).then((res) => res.text());
  res = res.replace("try{jsonp(", "");
  res = res.replace(");}catch(e){if(window.console){console.log(e);}}", "");
  return JSON.parse(res);
}
async function getProductInfo(id) {
  let prod = await pchomeJsonpAPI(
    `https://ecapi.pchome.com.tw/ecshop/prodapi/v2/prod/${id}&fields=Id,Name,Nick,Price,Discount,Pic&_callback=jsonp`
  );
  let desc = await pchomeJsonpAPI(
    `https://ecapi-cdn.pchome.com.tw/cdn/ecshop/prodapi/v2/prod/${id}/desc&fields=Id,Slogan,SloganInfo&_callback=jsonp`
  );
  prod = Object.values(prod)[0];
  desc = Object.values(desc)[0];
  let title = pangu.spacing(parseHtmlToText(prod.Name));
  let description = pangu.spacing(parseHtmlToText(desc.Slogan)).trim();
  if (description == "" && desc?.SloganInfo) {
    description = `・` + desc.SloganInfo.join("\n・");
  }
  let img = Object.entries(prod.Pic).map(
    ([server, url]) => `https://cs-${server}.ecimg.tw${url}`
  )[0];
  let price = prod.Price.P;

  return {
    title,
    description,
    img,
    price,
  };
}
app.use(serve(path.join(__dirname, "public")));
router.get("/", async (ctx) => {
  let title = `PChome 預覽連結好朋友`;
  let description = `協助修正 PChome 線上購物商品在社群媒體與通訊軟體中的預覽`;
  let img = `https://p.pancake.tw/og.jpg`;
  let url = `https://p.pancake.tw/`;
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
    <p>輕觸「<a href="https://github.com/gnehs/userscripts/raw/main/pchome-link-copy.user.js" target="_blank">這裡</a>」來安裝 UserScript，當開啟支援的商品頁面時便會自動顯示複製連結在商品圖片下方。</p>
    <h2>相關連結</h2>
    <ul>
      <li><a href="https://github.com/gnehs/PChomeFix" target="_blank">GitHub</a></li>
    </ul>
  </body>
  </html>`;
  ctx.set("Cache-Control", "public, max-age=604800");
  ctx.type = "text/html";
  ctx.body = html;
});
router.get(["/prod/:id", "/prod/:version/:id"], async (ctx) => {
  const { id } = ctx.params;
  let { title, description } = await getProductInfo(id);
  let img = `https://p.pancake.tw/og/${id}`;
  let url = `https://24h.pchome.com.tw/prod/${id}`;
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
  `;
  ctx.set("Cache-Control", "public, max-age=604800");
  ctx.type = "text/html";
  ctx.body = html;

  let country = ctx.request.header["cf-ipcountry"];
  console.log(`${country || ctx.ip} ${ctx.url} `.gray + `${ctx.status}`.green);
});
router.get("/og/:id", async (ctx) => {
  const { id } = ctx.params;
  let { title, description, img, price } = await getProductInfo(id);
  // generate og html
  const h = new JSDOM(
    fs.readFileSync(path.join(__dirname, "/public/og.html"), "utf8")
  );
  h.window.document.querySelector("[data-title]").textContent = title;
  h.window.document.querySelector(
    "[data-price]"
  ).textContent = `$${price.toLocaleString()}`;
  h.window.document.querySelector("[data-description]").innerHTML =
    description.replaceAll("\n", "<br />");
  h.window.document.querySelector("[data-image]").src = img;
  h.window.document.querySelector("[data-generate-time]").textContent =
    new Date().toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
      hour12: false,
    });
  // generate og image
  console.time(`[og-image] ${id}`);
  const browser = await getBrowser();
  const page = await browser.newPage();

  // Set the viewport to your preferred image size
  await page.setViewport({ width: 1200, height: 640 });

  // Set the content to our rendered HTML
  await page.setContent(h.serialize(), {
    waitUntil: "domcontentloaded",
  });

  // Wait until all images and fonts have loaded
  await page.evaluate(async () => {
    const selectors = Array.from(document.querySelectorAll("img"));
    await Promise.all([
      document.fonts.ready,
      ...selectors.map((img) => {
        // Image has already finished loading, let’s see if it worked
        if (img.complete) {
          // Image loaded and has presence
          if (img.naturalHeight !== 0) return;
          // Image failed, so it has no height
          throw new Error("Image failed to load");
        }
        // Image hasn’t loaded yet, added an event listener to know when it does
        return new Promise((resolve, reject) => {
          img.addEventListener("load", resolve);
          img.addEventListener("error", reject);
        });
      }),
    ]);
  });

  const screenshotBuffer = await page.screenshot({
    fullPage: false,
    type: "jpeg",
    quality: 95,
    height: 1200,
    width: 640,
  });

  await page.close();
  console.timeEnd(`[og-image] ${id}`);

  ctx.set("Cache-Control", "public, max-age=604800");
  ctx.type = "image/png";
  ctx.body = screenshotBuffer;

  let country = ctx.request.header["cf-ipcountry"];
  console.log(`${country || ctx.ip} ${ctx.url} `.gray + `${ctx.status}`.green);
});
router.get("/(.*)", async (ctx) => {
  // redirect to pchome
  ctx.redirect(`https://24h.pchome.com.tw/${ctx.params[0]}`);

  let country = ctx.request.header["cf-ipcountry"];
  console.log(`${country || ctx.ip} ${ctx.url} `.gray + `${ctx.status}`.green);
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);
console.log("Server running on http://localhost:3000");

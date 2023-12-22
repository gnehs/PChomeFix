const Router = require("@koa/router");
const { getBrowser } = require("../browser");
const router = new Router();
router.get("/gmaps/:id", async (ctx) => {
  const id = ctx.params.id;
  const browser = await getBrowser();
  const page = await browser.newPage();
  const url = `https://maps.app.goo.gl/${id}`;
  await page.goto(url, {
    waitUntil: "networkidle2",
  });
  // get "og:title", "og:description"
  await page.waitForSelector("meta[property='og:title']");
  const title = await page.$eval("meta[property='og:title']", (el) =>
    el.getAttribute("content")
  );
  const description = await page.$eval(
    "meta[property='og:description']",
    (el) => el.getAttribute("content")
  );
  const img = `https://p.pancake.tw/og/gmaps/${id}`;
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
    <meta property="og:site_name" content="Google Maps" />
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
    <h1>Google Maps 預覽連結好朋友</h1>
    <p>
      正在帶您前往「<a href="${url}">${title}</a>」。
    </p>
  </body>
  </html>
  `;
  ctx.set("Cache-Control", "public, max-age=604800");
  ctx.type = "text/html";
  ctx.body = html;
  fetch(img);
});
router.get("/og/gmaps/:id", async (ctx) => {
  const { id } = ctx.params;
  console.time(`[og-image][gamps] ${id}`);

  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 600, height: 315, deviceScaleFactor: 2 });
  await page.goto(`https://maps.app.goo.gl/${id}`, {
    waitUntil: "networkidle2",
  });
  await page.waitForTimeout(100);

  // put marker in center
  // get url
  let url = await page.url();
  // remove location to center the marker
  url = url.replace(/\/@.*?z\//, "/");
  await page.goto(url, {
    waitUntil: "networkidle2",
  });

  await page.waitForSelector(".id-scene");
  // hide elements
  await page.evaluate(() => {
    document.querySelector("#minimap").style.display = "none";
    document.querySelector("#vasquette").style.display = "none";
    document.querySelector(".scene-footer").style.display = "none";
    document.querySelector(".app-viewcard-strip").style.display = "none";
    document.querySelector("button[jsaction^='drawer.close;']").style.display =
      "none";
    document.querySelector("button[jsaction^='drawer.close;']").click();
  });

  await page.waitForTimeout(1000);
  // screenshot element .id-scene
  const element = await page.$(".id-scene");
  const screenshotBuffer = await element.screenshot();
  await page.close();
  console.timeEnd(`[og-image][gamps] ${id}`);

  ctx.set("Cache-Control", "public, max-age=604800");
  ctx.type = "image/png";
  ctx.body = screenshotBuffer;
});

module.exports = router;

const colors = require("colors");
const serve = require("koa-static");
const path = require("path");
const Koa = require("koa");
const Router = require("@koa/router");

const app = new Koa();
const router = new Router();

const pchomeRouter = require("./router/pchome");
router.use(pchomeRouter.routes());
router.use(pchomeRouter.allowedMethods());

const gampsRouter = require("./router/gmaps");
router.use(gampsRouter.routes());
router.use(gampsRouter.allowedMethods());

app.use(serve(path.join(__dirname, "public")));

router.get("/(.*)", async (ctx) => {
  // redirect to pchome
  ctx.redirect(`https://24h.pchome.com.tw/${ctx.params[0]}`);

  let country = ctx.request.header["cf-ipcountry"];
});
// logger
app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.get("X-Response-Time");
  let country = ctx.request.header["cf-ipcountry"];
  console.log(`${country || ctx.ip} ${ctx.url} `.gray + `${ctx.status}`.green);
});
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);
console.log("Server running on http://localhost:3000");

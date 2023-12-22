const puppeteer = require("puppeteer");
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
exports.getBrowser = getBrowser;

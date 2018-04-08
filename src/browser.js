if (!Array.from) {
  Array.from = require("array.from").getPolyfill();
}
const xhook = require("./vendor/xhook");
window.xhook = xhook;
const xdomain = require("./index");
window.xdomain = xdomain;

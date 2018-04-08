const xhook = require("../vendor/xhook");

const config = require("./config");

exports.COMPAT_VERSION = "V1";

const { location } = window;
exports.currentOrigin = location.protocol + "//" + location.host;
config.origin = exports.currentOrigin;

//emits 'warn' 'log' and 'timeout' events
exports.globalEmitter = xhook.EventEmitter(true);

exports.console = window.console || {};

let counter = 0;
exports.guid = () => {
  if (counter >= 1e6) counter = 0;
  let n = String(++counter);
  while (n.length < 6) n = "0" + n;
  return `xdomain-${n}`;
};

exports.slice = (o, n) => {
  return Array.prototype.slice.call(o, n);
};

//create a logger of type
const newLogger = type => {
  return msg => {
    msg = `xdomain (${exports.currentOrigin}): ${msg}`;
    //emit event
    exports.globalEmitter.fire(type, msg);
    //skip logs when debug isnt enabled
    if (type === "log" && !config.debug) {
      return;
    }
    //user provided log/warn functions
    if (type in config) {
      config[type](msg);
      //fallback console
    } else if (type in console) {
      console[type](msg);
      //fallbackback alert
    } else if (type === "warn") {
      alert(msg);
    }
  };
};

exports.log = newLogger("log");
exports.warn = newLogger("warn");

exports.instOf = (obj, global) => {
  return global in window && obj instanceof window[global];
};

//absolute url parser (relative urls aren't crossdomain)
exports.parseUrl = url => {
  if (/^((https?:)?\/\/[^\/\?]+)(\/.*)?/.test(url)) {
    return {
      origin: (RegExp.$2 ? "" : location.protocol) + RegExp.$1,
      path: RegExp.$3
    };
  } else {
    exports.log(`failed to parse absolute url: ${url}`);
    return null;
  }
};
config.parseUrl = exports.parseUrl;

exports.toRegExp = obj => {
  if (obj instanceof RegExp) {
    return obj;
  }
  const str = obj
    .toString()
    .replace(/\W/g, str => `\\${str}`)
    .replace(/\\\*/g, ".*");
  return new RegExp(`^${str}$`);
};

//strip functions and objects from an object
exports.strip = src => {
  const dst = {};
  for (let k in src) {
    if (k === "returnValue") {
      continue;
    }
    const v = src[k];
    const t = typeof v;
    if (t !== "function" && t !== "object") {
      dst[k] = v;
    }
  }
  return dst;
};

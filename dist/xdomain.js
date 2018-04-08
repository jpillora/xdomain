// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  // Override the current require with this new one
  return newRequire;
})({3:[function(require,module,exports) {
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

// XHook - v1.3.5 - https://github.com/jpillora/xhook
// Jaime Pillora <dev@jpillora.com> - MIT Copyright 2016

var AFTER,
    BEFORE,
    COMMON_EVENTS,
    EventEmitter,
    FIRE,
    FormData,
    NativeFormData,
    NativeXMLHttp,
    OFF,
    ON,
    READY_STATE,
    UPLOAD_EVENTS,
    XHookFormData,
    XHookHttpRequest,
    XMLHTTP,
    convertHeaders,
    depricatedProp,
    document,
    fakeEvent,
    mergeObjects,
    msie,
    proxyEvents,
    slice,
    xhook,
    _base,
    __indexOf = [].indexOf || function (item) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (i in this && this[i] === item) return i;
  }
  return -1;
};

document = window.document;

BEFORE = "before";

AFTER = "after";

READY_STATE = "readyState";

ON = "addEventListener";

OFF = "removeEventListener";

FIRE = "dispatchEvent";

XMLHTTP = "XMLHttpRequest";

FormData = "FormData";

UPLOAD_EVENTS = ["load", "loadend", "loadstart"];

COMMON_EVENTS = ["progress", "abort", "error", "timeout"];

msie = parseInt((/msie (\d+)/.exec(navigator.userAgent.toLowerCase()) || [])[1]);

if (isNaN(msie)) {
  msie = parseInt((/trident\/.*; rv:(\d+)/.exec(navigator.userAgent.toLowerCase()) || [])[1]);
}

(_base = Array.prototype).indexOf || (_base.indexOf = function (item) {
  var i, x, _i, _len;
  for (i = _i = 0, _len = this.length; _i < _len; i = ++_i) {
    x = this[i];
    if (x === item) {
      return i;
    }
  }
  return -1;
});

slice = function slice(o, n) {
  return Array.prototype.slice.call(o, n);
};

depricatedProp = function depricatedProp(p) {
  return p === "returnValue" || p === "totalSize" || p === "position";
};

mergeObjects = function mergeObjects(src, dst) {
  var k, v;
  for (k in src) {
    v = src[k];
    if (depricatedProp(k)) {
      continue;
    }
    try {
      dst[k] = src[k];
    } catch (_error) {}
  }
  return dst;
};

proxyEvents = function proxyEvents(events, src, dst) {
  var event, p, _i, _len;
  p = function p(event) {
    return function (e) {
      var clone, k, val;
      clone = {};
      for (k in e) {
        if (depricatedProp(k)) {
          continue;
        }
        val = e[k];
        clone[k] = val === src ? dst : val;
      }
      return dst[FIRE](event, clone);
    };
  };
  for (_i = 0, _len = events.length; _i < _len; _i++) {
    event = events[_i];
    if (dst._has(event)) {
      src["on" + event] = p(event);
    }
  }
};

fakeEvent = function fakeEvent(type) {
  var msieEventObject;
  if (document.createEventObject != null) {
    msieEventObject = document.createEventObject();
    msieEventObject.type = type;
    return msieEventObject;
  } else {
    try {
      return new Event(type);
    } catch (_error) {
      return {
        type: type
      };
    }
  }
};

EventEmitter = function EventEmitter(nodeStyle) {
  var emitter, events, listeners;
  events = {};
  listeners = function listeners(event) {
    return events[event] || [];
  };
  emitter = {};
  emitter[ON] = function (event, callback, i) {
    events[event] = listeners(event);
    if (events[event].indexOf(callback) >= 0) {
      return;
    }
    i = i === undefined ? events[event].length : i;
    events[event].splice(i, 0, callback);
  };
  emitter[OFF] = function (event, callback) {
    var i;
    if (event === undefined) {
      events = {};
      return;
    }
    if (callback === undefined) {
      events[event] = [];
    }
    i = listeners(event).indexOf(callback);
    if (i === -1) {
      return;
    }
    listeners(event).splice(i, 1);
  };
  emitter[FIRE] = function () {
    var args, event, i, legacylistener, listener, _i, _len, _ref;
    args = slice(arguments);
    event = args.shift();
    if (!nodeStyle) {
      args[0] = mergeObjects(args[0], fakeEvent(event));
    }
    legacylistener = emitter["on" + event];
    if (legacylistener) {
      legacylistener.apply(emitter, args);
    }
    _ref = listeners(event).concat(listeners("*"));
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      listener = _ref[i];
      listener.apply(emitter, args);
    }
  };
  emitter._has = function (event) {
    return !!(events[event] || emitter["on" + event]);
  };
  if (nodeStyle) {
    emitter.listeners = function (event) {
      return slice(listeners(event));
    };
    emitter.on = emitter[ON];
    emitter.off = emitter[OFF];
    emitter.fire = emitter[FIRE];
    emitter.once = function (e, fn) {
      var _fire;
      _fire = function fire() {
        emitter.off(e, _fire);
        return fn.apply(null, arguments);
      };
      return emitter.on(e, _fire);
    };
    emitter.destroy = function () {
      return events = {};
    };
  }
  return emitter;
};

xhook = EventEmitter(true);

xhook.EventEmitter = EventEmitter;

xhook[BEFORE] = function (handler, i) {
  if (handler.length < 1 || handler.length > 2) {
    throw "invalid hook";
  }
  return xhook[ON](BEFORE, handler, i);
};

xhook[AFTER] = function (handler, i) {
  if (handler.length < 2 || handler.length > 3) {
    throw "invalid hook";
  }
  return xhook[ON](AFTER, handler, i);
};

xhook.enable = function () {
  window[XMLHTTP] = XHookHttpRequest;
  if (NativeFormData) {
    window[FormData] = XHookFormData;
  }
};

xhook.disable = function () {
  window[XMLHTTP] = xhook[XMLHTTP];
  if (NativeFormData) {
    window[FormData] = NativeFormData;
  }
};

convertHeaders = xhook.headers = function (h, dest) {
  var header, headers, k, name, v, value, _i, _len, _ref;
  if (dest == null) {
    dest = {};
  }
  switch (typeof h === "undefined" ? "undefined" : _typeof(h)) {
    case "object":
      headers = [];
      for (k in h) {
        v = h[k];
        name = k.toLowerCase();
        headers.push("" + name + ":\t" + v);
      }
      return headers.join("\n");
    case "string":
      headers = h.split("\n");
      for (_i = 0, _len = headers.length; _i < _len; _i++) {
        header = headers[_i];
        if (/([^:]+):\s*(.+)/.test(header)) {
          name = (_ref = RegExp.$1) != null ? _ref.toLowerCase() : void 0;
          value = RegExp.$2;
          if (dest[name] == null) {
            dest[name] = value;
          }
        }
      }
      return dest;
  }
};

NativeFormData = window[FormData];

XHookFormData = function XHookFormData(form) {
  var entries;
  this.fd = form ? new NativeFormData(form) : new NativeFormData();
  this.form = form;
  entries = [];
  Object.defineProperty(this, "entries", {
    get: function get() {
      var fentries;
      fentries = !form ? [] : slice(form.querySelectorAll("input,select")).filter(function (e) {
        var _ref;
        return (_ref = e.type) !== "checkbox" && _ref !== "radio" || e.checked;
      }).map(function (e) {
        return [e.name, e.type === "file" ? e.files : e.value];
      });
      return fentries.concat(entries);
    }
  });
  this.append = function (_this) {
    return function () {
      var args;
      args = slice(arguments);
      entries.push(args);
      return _this.fd.append.apply(_this.fd, args);
    };
  }(this);
};

if (NativeFormData) {
  xhook[FormData] = NativeFormData;
  window[FormData] = XHookFormData;
}

NativeXMLHttp = window[XMLHTTP];

xhook[XMLHTTP] = NativeXMLHttp;

XHookHttpRequest = window[XMLHTTP] = function () {
  var ABORTED, currentState, emitFinal, emitReadyState, event, facade, hasError, hasErrorHandler, readBody, readHead, request, response, setReadyState, status, transiting, writeBody, writeHead, xhr, _i, _len, _ref;
  ABORTED = -1;
  xhr = new xhook[XMLHTTP]();
  request = {};
  status = null;
  hasError = void 0;
  transiting = void 0;
  response = void 0;
  readHead = function readHead() {
    var key, name, val, _ref;
    response.status = status || xhr.status;
    if (!(status === ABORTED && msie < 10)) {
      response.statusText = xhr.statusText;
    }
    if (status !== ABORTED) {
      _ref = convertHeaders(xhr.getAllResponseHeaders());
      for (key in _ref) {
        val = _ref[key];
        if (!response.headers[key]) {
          name = key.toLowerCase();
          response.headers[name] = val;
        }
      }
    }
  };
  readBody = function readBody() {
    if (!xhr.responseType || xhr.responseType === "text") {
      response.text = xhr.responseText;
      response.data = xhr.responseText;
    } else if (xhr.responseType === "document") {
      response.xml = xhr.responseXML;
      response.data = xhr.responseXML;
    } else {
      response.data = xhr.response;
    }
    if ("responseURL" in xhr) {
      response.finalUrl = xhr.responseURL;
    }
  };
  writeHead = function writeHead() {
    facade.status = response.status;
    facade.statusText = response.statusText;
  };
  writeBody = function writeBody() {
    if ("text" in response) {
      facade.responseText = response.text;
    }
    if ("xml" in response) {
      facade.responseXML = response.xml;
    }
    if ("data" in response) {
      facade.response = response.data;
    }
    if ("finalUrl" in response) {
      facade.responseURL = response.finalUrl;
    }
  };
  emitReadyState = function emitReadyState(n) {
    while (n > currentState && currentState < 4) {
      facade[READY_STATE] = ++currentState;
      if (currentState === 1) {
        facade[FIRE]("loadstart", {});
      }
      if (currentState === 2) {
        writeHead();
      }
      if (currentState === 4) {
        writeHead();
        writeBody();
      }
      facade[FIRE]("readystatechange", {});
      if (currentState === 4) {
        setTimeout(emitFinal, 0);
      }
    }
  };
  emitFinal = function emitFinal() {
    if (!hasError) {
      facade[FIRE]("load", {});
    }
    facade[FIRE]("loadend", {});
    if (hasError) {
      facade[READY_STATE] = 0;
    }
  };
  currentState = 0;
  setReadyState = function setReadyState(n) {
    var hooks, _process;
    if (n !== 4) {
      emitReadyState(n);
      return;
    }
    hooks = xhook.listeners(AFTER);
    _process = function process() {
      var hook;
      if (!hooks.length) {
        return emitReadyState(4);
      }
      hook = hooks.shift();
      if (hook.length === 2) {
        hook(request, response);
        return _process();
      } else if (hook.length === 3 && request.async) {
        return hook(request, response, _process);
      } else {
        return _process();
      }
    };
    _process();
  };
  facade = request.xhr = EventEmitter();
  xhr.onreadystatechange = function (event) {
    try {
      if (xhr[READY_STATE] === 2) {
        readHead();
      }
    } catch (_error) {}
    if (xhr[READY_STATE] === 4) {
      transiting = false;
      readHead();
      readBody();
    }
    setReadyState(xhr[READY_STATE]);
  };
  hasErrorHandler = function hasErrorHandler() {
    hasError = true;
  };
  facade[ON]("error", hasErrorHandler);
  facade[ON]("timeout", hasErrorHandler);
  facade[ON]("abort", hasErrorHandler);
  facade[ON]("progress", function () {
    if (currentState < 3) {
      setReadyState(3);
    } else {
      facade[FIRE]("readystatechange", {});
    }
  });
  if ("withCredentials" in xhr || xhook.addWithCredentials) {
    facade.withCredentials = false;
  }
  facade.status = 0;
  _ref = COMMON_EVENTS.concat(UPLOAD_EVENTS);
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    event = _ref[_i];
    facade["on" + event] = null;
  }
  facade.open = function (method, url, async, user, pass) {
    currentState = 0;
    hasError = false;
    transiting = false;
    request.headers = {};
    request.headerNames = {};
    request.status = 0;
    response = {};
    response.headers = {};
    request.method = method;
    request.url = url;
    request.async = async !== false;
    request.user = user;
    request.pass = pass;
    setReadyState(1);
  };
  facade.send = function (body) {
    var hooks, k, modk, _process2, send, _j, _len1, _ref1;
    _ref1 = ["type", "timeout", "withCredentials"];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      k = _ref1[_j];
      modk = k === "type" ? "responseType" : k;
      if (modk in facade) {
        request[k] = facade[modk];
      }
    }
    request.body = body;
    send = function send() {
      var header, value, _k, _len2, _ref2, _ref3;
      proxyEvents(COMMON_EVENTS, xhr, facade);
      if (facade.upload) {
        proxyEvents(COMMON_EVENTS.concat(UPLOAD_EVENTS), xhr.upload, facade.upload);
      }
      transiting = true;
      xhr.open(request.method, request.url, request.async, request.user, request.pass);
      _ref2 = ["type", "timeout", "withCredentials"];
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        k = _ref2[_k];
        modk = k === "type" ? "responseType" : k;
        if (k in request) {
          xhr[modk] = request[k];
        }
      }
      _ref3 = request.headers;
      for (header in _ref3) {
        value = _ref3[header];
        if (header) {
          xhr.setRequestHeader(header, value);
        }
      }
      if (request.body instanceof XHookFormData) {
        request.body = request.body.fd;
      }
      xhr.send(request.body);
    };
    hooks = xhook.listeners(BEFORE);
    _process2 = function process() {
      var done, hook;
      if (!hooks.length) {
        return send();
      }
      done = function done(userResponse) {
        if ((typeof userResponse === "undefined" ? "undefined" : _typeof(userResponse)) === "object" && (typeof userResponse.status === "number" || typeof response.status === "number")) {
          mergeObjects(userResponse, response);
          if (__indexOf.call(userResponse, "data") < 0) {
            userResponse.data = userResponse.response || userResponse.text;
          }
          setReadyState(4);
          return;
        }
        _process2();
      };
      done.head = function (userResponse) {
        mergeObjects(userResponse, response);
        return setReadyState(2);
      };
      done.progress = function (userResponse) {
        mergeObjects(userResponse, response);
        return setReadyState(3);
      };
      hook = hooks.shift();
      if (hook.length === 1) {
        return done(hook(request));
      } else if (hook.length === 2 && request.async) {
        return hook(request, done);
      } else {
        return done();
      }
    };
    _process2();
  };
  facade.abort = function () {
    status = ABORTED;
    if (transiting) {
      xhr.abort();
    } else {
      facade[FIRE]("abort", {});
    }
  };
  facade.setRequestHeader = function (header, value) {
    var lName, name;
    lName = header != null ? header.toLowerCase() : void 0;
    name = request.headerNames[lName] = request.headerNames[lName] || header;
    if (request.headers[name]) {
      value = request.headers[name] + ", " + value;
    }
    request.headers[name] = value;
  };
  facade.getResponseHeader = function (header) {
    var name;
    name = header != null ? header.toLowerCase() : void 0;
    return response.headers[name];
  };
  facade.getAllResponseHeaders = function () {
    return convertHeaders(response.headers);
  };
  if (xhr.overrideMimeType) {
    facade.overrideMimeType = function () {
      return xhr.overrideMimeType.apply(xhr, arguments);
    };
  }
  if (xhr.upload) {
    facade.upload = request.upload = EventEmitter();
  }
  return facade;
};

module.exports = xhook;
},{}],7:[function(require,module,exports) {
var config = function config(o) {
  if (o) {
    if (o.masters) {
      config.masters(o.masters);
    }
    if (o.slaves) {
      config.slaves(o.slaves);
    }
  }
};

//default config
config.debug = false;
config.timeout = 15e3;
config.cookies = {
  master: "Master-Cookie",
  slave: "Slave-Cookie"
};
//extras are also attached to config

module.exports = config;
},{}],4:[function(require,module,exports) {
var global = (1,eval)("this");
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var xhook = require("../vendor/xhook");

var config = require("./config");

exports.COMPAT_VERSION = "V1";

var _window = window,
    location = _window.location;

exports.currentOrigin = location.protocol + "//" + location.host;
config.origin = exports.currentOrigin;

//emits 'warn' 'log' and 'timeout' events
exports.globalEmitter = xhook.EventEmitter(true);

exports.console = window.console || {};

var counter = 0;
exports.guid = function () {
  if (counter >= 1e6) counter = 0;
  var n = String(++counter);
  while (n.length < 6) {
    n = "0" + n;
  }return "xdomain-" + n;
};

exports.slice = function (o, n) {
  return Array.prototype.slice.call(o, n);
};

//create a logger of type
var newLogger = function newLogger(type) {
  return function (msg) {
    msg = "xdomain (" + exports.currentOrigin + "): " + msg;
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

exports.instOf = function (obj, global) {
  return global in window && obj instanceof window[global];
};

//absolute url parser (relative urls aren't crossdomain)
exports.parseUrl = function (url) {
  if (/^((https?:)?\/\/[^\/\?]+)(\/.*)?/.test(url)) {
    return {
      origin: (RegExp.$2 ? "" : location.protocol) + RegExp.$1,
      path: RegExp.$3
    };
  } else {
    exports.log("failed to parse absolute url: " + url);
    return null;
  }
};
config.parseUrl = exports.parseUrl;

exports.toRegExp = function (obj) {
  if (obj instanceof RegExp) {
    return obj;
  }
  var str = obj.toString().replace(/\W/g, function (str) {
    return "\\" + str;
  }).replace(/\\\*/g, ".*");
  return new RegExp("^" + str + "$");
};

//strip functions and objects from an object
exports.strip = function (src) {
  var dst = {};
  for (var k in src) {
    if (k === "returnValue") {
      continue;
    }
    var v = src[k];
    if (!["function", "object"].includes(typeof v === "undefined" ? "undefined" : _typeof(v))) {
      dst[k] = v;
    }
  }
  return dst;
};
},{"../vendor/xhook":3,"./config":7}],9:[function(require,module,exports) {
var xhook = require("../vendor/xhook");
var config = require("./config");

var _require = require("./util"),
    log = _require.log,
    warn = _require.warn,
    toRegExp = _require.toRegExp,
    strip = _require.strip,
    parseUrl = _require.parseUrl,
    COMPAT_VERSION = _require.COMPAT_VERSION;

//when you add masters, this node
//enables slave listeners

var enabled = false;
var masters = {};

exports.addMasters = function (config) {
  //validate iframe
  if (window === window.parent) {
    warn("slaves must be in an iframe");
    return;
  }
  //enable slave handler
  if (!enabled) {
    enabled = true;
    log("now handling incoming sockets...");
    window.parent.postMessage("XDPING_" + COMPAT_VERSION, "*");
  }
  //white-list the provided set of masters
  for (var origin in config) {
    var path = config[origin];
    if (origin === "file://" && path !== "*") {
      warn("file protocol only supports the * path");
      path = "*";
    }
    log("adding master: " + origin);
    masters[origin] = path;
  }
};

config.masters = exports.addMasters;

exports.handleSocket = function (origin, socket) {
  if (!enabled) {
    return;
  }
  //null means no origin can be determined,
  //this is true for file:// and data:// URIs.
  //html data:// URI are now blocked, they can
  //only be copy-and-pasted into the URL bar.
  if (origin === "null") {
    origin = "file://";
  }
  log("handle socket for \"" + origin + "\"");
  var pathRegex = null;
  for (var master in masters) {
    var regex = masters[master];
    try {
      var masterRegex = toRegExp(master);
      if (masterRegex.test(origin)) {
        pathRegex = toRegExp(regex);
        break;
      }
    } catch (error) {}
  }
  if (!pathRegex) {
    warn("blocked request from: '" + origin + "'");
    return;
  }
  socket.once("request", function (req) {
    log("request: " + req.method + " " + req.url);
    var p = parseUrl(req.url);
    if (!p || !pathRegex.test(p.path)) {
      warn("blocked request to path: '" + p.path + "' by regex: " + pathRegex);
      socket.close();
      return;
    }
    //perform real XHR here!
    //pass results to the socket
    var xhr = new XMLHttpRequest();
    xhr.open(req.method, req.url);
    xhr.addEventListener("*", function (e) {
      return socket.emit("xhr-event", e.type, strip(e));
    });
    if (xhr.upload) {
      xhr.upload.addEventListener("*", function (e) {
        return socket.emit("xhr-upload-event", e.type, strip(e));
      });
    }
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) {
        return;
      }
      //extract properties
      var resp = {
        status: xhr.status,
        statusText: xhr.statusText,
        data: xhr.response,
        headers: xhook.headers(xhr.getAllResponseHeaders())
      };
      try {
        resp.text = xhr.responseText;
      } catch (error1) {}
      // XML over postMessage not supported
      // try resp.xml = xhr.responseXML
      return socket.emit("response", resp);
    };
    //allow aborts from the facade
    socket.once("abort", function () {
      return xhr.abort();
    });
    // document.cookie (Cookie header) can't be set inside an iframe
    // as many browsers have 3rd party cookies disabled. slaveCookie
    // contains the 'xdomain.cookie.slave' string set on the master.
    if (req.withCredentials) {
      xhr.withCredentials = true;
      if (req.slaveCookie) {
        req.headers[req.slaveCookie] = document.cookie;
      }
    }
    if (req.timeout) {
      xhr.timeout = req.timeout;
    }
    if (req.type) {
      xhr.responseType = req.type;
    }
    for (var k in req.headers) {
      var v = req.headers[k];
      xhr.setRequestHeader(k, v);
    }
    //deserialize FormData
    if (req.body instanceof Array && req.body[0] === "XD_FD") {
      var fd = new xhook.FormData();
      var entries = req.body[1];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Array.from(entries)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var args = _step.value;

          //deserialize blobs from arraybuffs
          //[0:marker, 1:real-args, 2:arraybuffer, 3:type]
          if (args[0] === "XD_BLOB" && args.length === 4) {
            var blob = new Blob([args[2]], { type: args[3] });
            args = args[1];
            args[1] = blob;
          }
          fd.append.apply(fd, args);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      req.body = fd;
    }
    //fire off request
    xhr.send(req.body || null);
  });
  log("slave listening for requests on socket: " + socket.id);
};
},{"../vendor/xhook":3,"./config":7,"./util":4}],5:[function(require,module,exports) {
var xhook = require("../vendor/xhook");

var config = require("./config");

var _require = require("./util"),
    globalEmitter = _require.globalEmitter,
    log = _require.log,
    warn = _require.warn,
    COMPAT_VERSION = _require.COMPAT_VERSION;

var _require2 = require("./slave"),
    handleSocket = _require2.handleSocket;

//constants


var CHECK_STRING = "XD_CHECK";
var CHECK_INTERVAL = 100;
//state
var sockets = {};
var jsonEncode = true;

//a 'sock' is a two-way event-emitter,
//each side listens for messages with on()
//and the other side sends messages with emit()
exports.createSocket = function (id, frame) {
  var ready = false;
  var socket = xhook.EventEmitter(true);
  sockets[id] = socket;
  socket.id = id;
  socket.once("close", function () {
    socket.destroy();
    socket.close();
  });
  var pendingEmits = [];
  socket.emit = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var extra = typeof args[1] === "string" ? " -> " + args[1] : "";
    log("send socket: " + id + ": " + args[0] + extra);
    args.unshift(id);
    if (ready) {
      emit(args);
    } else {
      pendingEmits.push(args);
    }
  };
  var emit = function emit(args) {
    //convert to string when necessary
    if (jsonEncode) {
      args = JSON.stringify(args);
    }
    //send!
    frame.postMessage(args, "*");
  };

  socket.close = function () {
    socket.emit("close");
    log("close socket: " + id);
    sockets[id] = null;
  };

  socket.once(CHECK_STRING, function (obj) {
    jsonEncode = typeof obj === "string";
    ready = socket.ready = true;
    socket.emit("ready");
    log("ready socket: " + id + " (emit #" + pendingEmits.length + " pending)");
    while (pendingEmits.length) {
      emit(pendingEmits.shift());
    }
  });

  //start checking connectivitiy
  var checks = 0;
  var check = function check() {
    // send test message NO ENCODING
    frame.postMessage([id, CHECK_STRING, {}], "*");
    if (ready) {
      return;
    }
    if (checks++ >= config.timeout / CHECK_INTERVAL) {
      warn("Timeout waiting on iframe socket");
      globalEmitter.fire("timeout");
      socket.fire("abort"); //self-emit "abort"
    } else {
      log("check again in " + CHECK_INTERVAL + "ms...");
      setTimeout(check, CHECK_INTERVAL);
    }
  };
  setTimeout(check);

  log("new socket: " + id);
  return socket;
};

//ONE WINDOW LISTENER!
//double purpose:
//  creates new sockets by passing incoming events to the 'handler'
//  passes events to existing sockets (created by connect or by the server)
exports.initialise = function () {
  var handle = function handle(e) {
    var d = e.data;
    //return if not a json string
    if (typeof d === "string") {
      //only old versions of xdomain send XPINGs...
      if (/^XDPING(_(V\d+))?$/.test(d) && RegExp.$2 !== COMPAT_VERSION) {
        return warn("your master is not compatible with your slave, check your xdomain.js version");
        //IE will "toString()" the array, this reverses that action
      } else if (/^xdomain-/.test(d)) {
        d = d.split(",");
        //this browser must json encode postmessages
      } else if (jsonEncode) {
        try {
          d = JSON.parse(d);
        } catch (error) {
          return;
        }
      }
    }
    //return if not an array
    if (!(d instanceof Array)) {
      return;
    }
    //return unless lead by an xdomain id
    var id = d.shift();
    if (!/^xdomain-/.test(id)) {
      return;
    }
    //finally, create/get socket
    var socket = sockets[id];
    //closed
    if (socket === null) {
      return;
    }
    //needs creation
    if (socket === undefined) {
      //send unsolicited requests to the listening server
      if (!handleSocket) {
        return;
      }
      socket = exports.createSocket(id, e.source);
      handleSocket(e.origin, socket);
    }
    var extra = typeof d[1] === "string" ? " -> " + d[1] : "";
    log("receive socket: " + id + ": " + d[0] + extra);
    //emit data
    socket.fire.apply(socket, d);
  };
  if (document.addEventListener) {
    return window.addEventListener("message", handle);
  } else {
    return window.attachEvent("onmessage", handle);
  }
};
},{"../vendor/xhook":3,"./config":7,"./util":4,"./slave":9}],8:[function(require,module,exports) {
var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var xhook = require("../vendor/xhook");
var config = require("./config");

var _require = require("./util"),
    currentOrigin = _require.currentOrigin,
    log = _require.log,
    warn = _require.warn,
    parseUrl = _require.parseUrl,
    guid = _require.guid,
    strip = _require.strip;

var socketlib = require("./socket");
var createSocket = socketlib.createSocket;

//when you add slaves, this node
//enables master listeners

var enabled = false;
var slaves = {};

exports.addSlaves = function (newSlaves) {
  //register master xhook handler
  if (!enabled) {
    enabled = true;
    //unless already set, add withCredentials to xhrs to trick jquery
    //in older browsers into thinking cors is allowed
    if (!("addWithCredentials" in xhook)) {
      xhook.addWithCredentials = true;
    }
    //hook XHR calls
    xhook.before(beforeXHR);
  }
  //include the provided set of slave
  for (var origin in newSlaves) {
    var path = newSlaves[origin];
    log("adding slave: " + origin);
    slaves[origin] = path;
  }
};

config.slaves = exports.addSlaves;

var beforeXHR = function beforeXHR(request, callback) {
  //allow unless we have a slave domain
  var p = parseUrl(request.url);
  if (!p || p.origin === currentOrigin) {
    callback();
    return;
  }
  if (!slaves[p.origin]) {
    if (p) {
      log("no slave matching: '" + p.origin + "'");
    }
    callback();
    return;
  }
  log("proxying request to slave: '" + p.origin + "'");
  if (request.async === false) {
    warn("sync not supported because postmessage is async");
    callback();
    return;
  }
  //get or insert frame
  var frame = getFrame(p.origin, slaves[p.origin]);
  //connect to slave
  var socket = createSocket(guid(), frame);
  //queue callback
  socket.on("response", function (resp) {
    callback(resp);
    socket.close();
  });
  //user wants to abort
  request.xhr.addEventListener("abort", function () {
    return socket.emit("abort");
  });
  //kick off
  if (socket.ready) {
    handleRequest(request, socket);
  } else {
    socket.once("ready", function () {
      return handleRequest(request, socket);
    });
  }
};

var frames = {};
var getFrame = function getFrame(origin, proxyPath) {
  //cache origin
  if (frames[origin]) {
    return frames[origin];
  }
  var frame = document.createElement("iframe");
  frame.id = frame.name = guid();
  log("creating iframe " + frame.id);
  frame.src = "" + origin + proxyPath;
  frame.setAttribute("style", "display:none;");
  document.body.appendChild(frame);
  return frames[origin] = frame.contentWindow;
};

var convertToArrayBuffer = function convertToArrayBuffer(args, done) {
  var _Array$from = Array.from(args),
      _Array$from2 = _slicedToArray(_Array$from, 2),
      name = _Array$from2[0],
      obj = _Array$from2[1];

  var isBlob = instOf(obj, "Blob");
  var isFile = instOf(obj, "File");
  if (!isBlob && !isFile) {
    return 0;
  }
  var reader = new FileReader();
  reader.onload = function () {
    // clear value
    args[1] = null;
    // formdata.append(name, value, **filename**)
    if (isFile) {
      args[2] = obj.name;
    }
    return done(["XD_BLOB", args, this.result, obj.type]);
  };
  reader.readAsArrayBuffer(obj);
  return 1;
};

//this FormData is actually XHooks custom FormData `fd`,
//which exposes all `entries` added, where each entry
//is the arguments object
var convertFormData = function convertFormData(entries, send) {
  //expand FileList -> [File, File, File]
  entries.forEach(function (args, i) {
    var _Array$from3 = Array.from(args),
        _Array$from4 = _slicedToArray(_Array$from3, 2),
        name = _Array$from4[0],
        value = _Array$from4[1];

    if (instOf(value, "FileList")) {
      entries.splice(i, 1);
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Array.from(value)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var file = _step.value;

          entries.splice(i, 0, [name, file]);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  });
  //basically: async.parallel([filter:files], send)
  var c = 0;
  entries.forEach(function (args, i) {
    c += convertToArrayBuffer(args, function (newargs) {
      entries[i] = newargs;
      if (--c === 0) {
        send();
      }
    });
  });
  if (c === 0) {
    send();
  }
};

var handleRequest = function handleRequest(request, socket) {
  socket.on("xhr-event", function () {
    return request.xhr.dispatchEvent.apply(null, arguments);
  });
  socket.on("xhr-upload-event", function () {
    return request.xhr.upload.dispatchEvent.apply(null, arguments);
  });

  var obj = strip(request);
  obj.headers = request.headers;
  //add master cookie
  if (request.withCredentials) {
    if (config.cookies.master) {
      obj.headers[config.cookies.master] = document.cookie;
    }
    obj.slaveCookie = config.cookies.slave;
  }

  var send = function send() {
    return socket.emit("request", obj);
  };

  if (request.body) {
    obj.body = request.body;
    //async serialize formdata
    if (instOf(obj.body, "FormData")) {
      var entries = obj.body.entries;

      obj.body = ["XD_FD", entries];
      convertFormData(entries, send);
      return;
    }
  }
  send();
};
},{"../vendor/xhook":3,"./config":7,"./util":4,"./socket":5}],6:[function(require,module,exports) {
var config = require("./config");

var _require = require("./util"),
    parseUrl = _require.parseUrl;

var _require2 = require("./master"),
    addSlaves = _require2.addSlaves;

var _require3 = require("./slave"),
    addMasters = _require3.addMasters;

var _window = window,
    document = _window.document;
//auto init using attributes

exports.initialise = function () {
  //attribute handlers
  var attrs = {
    debug: function debug(value) {
      if (typeof value !== "string") {
        return;
      }
      config.debug = value !== "false";
    },
    slave: function slave(value) {
      if (!value) {
        return;
      }
      var p = parseUrl(value);
      if (!p) {
        return;
      }
      var s = {};
      s[p.origin] = p.path;
      addSlaves(s);
    },
    master: function master(value) {
      var p = void 0;
      if (!value) {
        return;
      }
      if (value === "*") {
        p = { origin: "*", path: "*" };
      } else if (value === "file://*") {
        p = { origin: "file://", path: "*" };
      } else {
        p = parseUrl(value);
      }
      if (!p) {
        return;
      }
      var m = {};
      m[p.origin] = p.path.replace(/^\//, "") ? p.path : "*";
      addMasters(m);
    }
  };
  //find all script tags referencing 'xdomain' and then
  //find all attributes with handlers registered
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = Array.from(document.getElementsByTagName("script"))[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var script = _step.value;

      if (/xdomain/.test(script.src)) {
        var _arr = ["", "data-"];

        for (var _i = 0; _i < _arr.length; _i++) {
          var prefix = _arr[_i];
          for (var k in attrs) {
            var fn = attrs[k];
            fn(script.getAttribute(prefix + k));
          }
        }
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }
};
},{"./config":7,"./util":4,"./master":8,"./slave":9}],2:[function(require,module,exports) {
"use strict";

//feature detect

var _require = require("./lib/util"),
    warn = _require.warn;

var _arr = ["postMessage", "JSON"];

for (var _i = 0; _i < _arr.length; _i++) {
  var feature = _arr[_i];
  if (!window[feature]) {
    warn("requires '" + feature + "' and this browser does not support it");
  }
}

//init socket (post message mini-library)
var socket = require("./lib/socket");
socket.initialise();

//initialise script (load config from script tag)
var script = require("./lib/script");
script.initialise();

//public api
var initialise = require("./lib/config");
//config is also the primary intialise function
module.exports = initialise;
},{"./lib/util":4,"./lib/socket":5,"./lib/script":6,"./lib/config":7}],1:[function(require,module,exports) {
var xhook = require("./vendor/xhook");
window.xhook = xhook;
var xdomain = require("./index");
window.xdomain = xdomain;
},{"./vendor/xhook":3,"./index":2}]},{},[1])
//# sourceMappingURL=xdomain.map
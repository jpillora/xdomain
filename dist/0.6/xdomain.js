// XDomain - v0.6.7 - https://github.com/jpillora/xdomain
// Jaime Pillora <dev@jpillora.com> - MIT Copyright 2014
(function(window,undefined) {// XHook - v1.1.7 - https://github.com/jpillora/xhook
// Jaime Pillora <dev@jpillora.com> - MIT Copyright 2014
(function(window,undefined) {var AFTER, BEFORE, COMMON_EVENTS, EventEmitter, FIRE, FormData, OFF, ON, READY_STATE, UPLOAD_EVENTS, XHookHttpRequest, XMLHTTP, convertHeaders, document, fakeEvent, mergeObjects, proxyEvents, slice, xhook, _base,
  __slice = [].slice;

document = window.document;

BEFORE = 'before';

AFTER = 'after';

READY_STATE = 'readyState';

ON = 'addEventListener';

OFF = 'removeEventListener';

FIRE = 'dispatchEvent';

XMLHTTP = 'XMLHttpRequest';

FormData = 'FormData';

UPLOAD_EVENTS = ['load', 'loadend', 'loadstart'];

COMMON_EVENTS = ['progress', 'abort', 'error', 'timeout'];

(_base = Array.prototype).indexOf || (_base.indexOf = function(item) {
  var i, x, _i, _len;
  for (i = _i = 0, _len = this.length; _i < _len; i = ++_i) {
    x = this[i];
    if (x === item) {
      return i;
    }
  }
  return -1;
});

slice = function(o, n) {
  return Array.prototype.slice.call(o, n);
};

mergeObjects = function(src, dst) {
  var k, v;
  for (k in src) {
    v = src[k];
    if (k === "returnValue") {
      continue;
    }
    try {
      dst[k] = src[k];
    } catch (_error) {}
  }
  return dst;
};

proxyEvents = function(events, from, to) {
  var event, p, _i, _len;
  p = function(event) {
    return function(e) {
      var clone, k, val;
      clone = {};
      for (k in e) {
        if (k === "returnValue") {
          continue;
        }
        val = e[k];
        clone[k] = val === from ? to : val;
      }
      clone;
      return to[FIRE](event, clone);
    };
  };
  for (_i = 0, _len = events.length; _i < _len; _i++) {
    event = events[_i];
    from["on" + event] = p(event);
  }
};

fakeEvent = function(type) {
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

EventEmitter = function(nodeStyle) {
  var emitter, events, listeners;
  events = {};
  listeners = function(event) {
    return events[event] || [];
  };
  emitter = {};
  emitter[ON] = function(event, callback, i) {
    events[event] = listeners(event);
    if (events[event].indexOf(callback) >= 0) {
      return;
    }
    i = i === undefined ? events[event].length : i;
    events[event].splice(i, 0, callback);
  };
  emitter[OFF] = function(event, callback) {
    var i;
    i = listeners(event).indexOf(callback);
    if (i === -1) {
      return;
    }
    listeners(event).splice(i, 1);
  };
  emitter[FIRE] = function() {
    var args, event, i, legacylistener, listener, _i, _len, _ref;
    args = slice(arguments);
    event = args.shift();
    if (!nodeStyle) {
      args[0] = mergeObjects(args[0], fakeEvent(event));
    }
    legacylistener = emitter["on" + event];
    if (legacylistener) {
      legacylistener.apply(undefined, args);
    }
    _ref = listeners(event).concat(listeners("*"));
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      listener = _ref[i];
      listener.apply(undefined, args);
    }
  };
  if (nodeStyle) {
    emitter.listeners = function(event) {
      return slice(listeners(event));
    };
    emitter.on = emitter[ON];
    emitter.off = emitter[OFF];
    emitter.fire = emitter[FIRE];
    emitter.once = function(e, fn) {
      var fire;
      fire = function() {
        emitter.off(e, fire);
        return fn.apply(null, arguments);
      };
      return emitter.on(e, fire);
    };
    emitter.destroy = function() {
      return events = {};
    };
  }
  return emitter;
};

xhook = EventEmitter(true);

xhook.EventEmitter = EventEmitter;

xhook[BEFORE] = function(handler, i) {
  if (handler.length < 1 || handler.length > 2) {
    throw "invalid hook";
  }
  return xhook[ON](BEFORE, handler, i);
};

xhook[AFTER] = function(handler, i) {
  if (handler.length < 2 || handler.length > 3) {
    throw "invalid hook";
  }
  return xhook[ON](AFTER, handler, i);
};

xhook.addWithCredentials = true;

xhook.enable = function() {
  window[XMLHTTP] = XHookHttpRequest;
};

xhook.disable = function() {
  window[XMLHTTP] = xhook[XMLHTTP];
};

convertHeaders = xhook.headers = function(h, dest) {
  var header, headers, k, v, _i, _len;
  if (dest == null) {
    dest = {};
  }
  switch (typeof h) {
    case "object":
      headers = [];
      for (k in h) {
        v = h[k];
        headers.push("" + k + ":\t" + v);
      }
      return headers.join('\n');
    case "string":
      headers = h.split('\n');
      for (_i = 0, _len = headers.length; _i < _len; _i++) {
        header = headers[_i];
        if (/([^:]+):\s*(.+)/.test(header)) {
          if (!dest[RegExp.$1]) {
            dest[RegExp.$1] = RegExp.$2;
          }
        }
      }
      return dest;
  }
};

xhook[FormData] = window[FormData];

window[FormData] = function() {
  var _this = this;
  this.fd = new xhook[FormData];
  this.entries = [];
  this.append = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    _this.entries.push(args);
    return _this.fd.append.apply(_this.fd, args);
  };
};

xhook[XMLHTTP] = window[XMLHTTP];

XHookHttpRequest = window[XMLHTTP] = function() {
  var currentState, facade, readBody, readHead, request, response, setReadyState, transiting, writeBody, writeHead, xhr;
  xhr = new xhook[XMLHTTP]();
  transiting = false;
  request = {};
  request.headers = {};
  response = {};
  response.headers = {};
  readHead = function() {
    var key, val, _ref;
    response.status = xhr.status;
    response.statusText = xhr.statusText;
    _ref = convertHeaders(xhr.getAllResponseHeaders());
    for (key in _ref) {
      val = _ref[key];
      if (!response.headers[key]) {
        response.headers[key] = val;
      }
    }
  };
  readBody = function() {
    try {
      response.text = xhr.responseText;
    } catch (_error) {}
    try {
      response.xml = xhr.responseXML;
    } catch (_error) {}
    response.data = xhr.response || response.text;
  };
  writeHead = function() {
    facade.status = response.status;
    facade.statusText = response.statusText;
  };
  writeBody = function() {
    if (response.hasOwnProperty('text')) {
      facade.responseText = response.text;
    } else if (response.hasOwnProperty('xml')) {
      facade.responseXML = response.xml;
    } else {
      facade.response = response.data || null;
    }
  };
  currentState = 0;
  setReadyState = function(n) {
    var checkReadyState, hooks, process;
    checkReadyState = function() {
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
          facade[FIRE]("load", {});
          facade[FIRE]("loadend", {});
        }
      }
    };
    if (n < 4) {
      checkReadyState();
      return;
    }
    hooks = xhook.listeners(AFTER);
    process = function() {
      var hook;
      if (!hooks.length) {
        return checkReadyState();
      }
      hook = hooks.shift();
      if (hook.length === 2) {
        hook(request, response);
        return process();
      } else if (hook.length === 3) {
        return hook(request, response, process);
      }
    };
    process();
  };
  xhr.onreadystatechange = function(event) {
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
  facade = request.xhr = EventEmitter();
  facade[ON]('progress', function() {
    return setReadyState(3);
  });
  proxyEvents(COMMON_EVENTS, xhr, facade);
  if (xhook.addWithCredentials) {
    facade.withCredentials = false;
  }
  facade.status = 0;
  facade.open = function(method, url, async, user, pass) {
    request.method = method;
    request.url = url;
    if (async === false) {
      throw "sync xhr not supported by XHook";
    }
    request.user = user;
    request.pass = pass;
    setReadyState(1);
  };
  facade.send = function(body) {
    var hooks, k, modk, process, send, _i, _len, _ref;
    _ref = ['type', 'timeout', 'withCredentials'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      k = _ref[_i];
      modk = k === "type" ? "responseType" : k;
      if (modk in facade) {
        request[k] = facade[modk];
      }
    }
    request.body = body;
    send = function() {
      var header, value, _j, _len1, _ref1, _ref2;
      transiting = true;
      xhr.open(request.method, request.url, true, request.user, request.pass);
      _ref1 = ['type', 'timeout', 'withCredentials'];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        k = _ref1[_j];
        modk = k === "type" ? "responseType" : k;
        if (k in request) {
          xhr[modk] = request[k];
        }
      }
      _ref2 = request.headers;
      for (header in _ref2) {
        value = _ref2[header];
        xhr.setRequestHeader(header, value);
      }
      if (request.body instanceof window[FormData]) {
        request.body = request.body.fd;
      }
      xhr.send(request.body);
    };
    hooks = xhook.listeners(BEFORE);
    process = function() {
      var done, hook;
      if (!hooks.length) {
        return send();
      }
      done = function(resp) {
        if (typeof resp === 'object' && (typeof resp.status === 'number' || typeof response.status === 'number')) {
          mergeObjects(resp, response);
          setReadyState(4);
          return;
        }
        process();
      };
      done.head = function(resp) {
        mergeObjects(resp, response);
        return setReadyState(2);
      };
      done.progress = function(resp) {
        mergeObjects(resp, response);
        return setReadyState(3);
      };
      hook = hooks.shift();
      if (hook.length === 1) {
        return done(hook(request));
      } else if (hook.length === 2) {
        return hook(request, done);
      }
    };
    process();
  };
  facade.abort = function() {
    if (transiting) {
      xhr.abort();
    }
    facade[FIRE]('abort', {});
  };
  facade.setRequestHeader = function(header, value) {
    request.headers[header] = value;
  };
  facade.getResponseHeader = function(header) {
    return response.headers[header];
  };
  facade.getAllResponseHeaders = function() {
    return convertHeaders(response.headers);
  };
  if (xhr.overrideMimeType) {
    facade.overrideMimeType = function() {
      return xhr.overrideMimeType.apply(xhr, arguments);
    };
  }
  if (xhr.upload) {
    facade.upload = request.upload = EventEmitter();
    proxyEvents(COMMON_EVENTS.concat(UPLOAD_EVENTS), xhr.upload, facade.upload);
  }
  return facade;
};

(this.define || Object)((this.exports || this).xhook = xhook);
}(this));
var CHECK_INTERVAL, COMPAT_VERSION, XD_CHECK, addMasters, addSlaves, connect, console, createSocket, currentOrigin, document, feature, frames, getFrame, guid, handler, initMaster, initSlave, instOf, jsonEncode, listen, location, log, masters, onMessage, parseUrl, prep, slaves, slice, sockets, startPostMessage, strip, toRegExp, warn, xdomain, _i, _len, _ref;

slaves = null;

addSlaves = function(s) {
  var origin, path;
  if (slaves === null) {
    slaves = {};
    initMaster();
  }
  for (origin in s) {
    path = s[origin];
    log("adding slave: " + origin);
    slaves[origin] = path;
  }
};

frames = {};

getFrame = function(origin, proxyPath) {
  var frame;
  if (frames[origin]) {
    return frames[origin];
  }
  frame = document.createElement("iframe");
  frame.id = frame.name = guid();
  log("creating iframe " + frame.id);
  frame.src = "" + origin + proxyPath;
  frame.setAttribute('style', 'display:none;');
  document.body.appendChild(frame);
  return frames[origin] = frame.contentWindow;
};

initMaster = function() {
  return xhook.before(function(request, callback) {
    var frame, obj, p, socket;
    p = parseUrl(request.url);
    if (!p || p.origin === currentOrigin) {
      return callback();
    }
    if (!slaves[p.origin]) {
      if (p) {
        log("no slave matching: '" + p.origin + "'");
      }
      return callback();
    }
    log("proxying request to slave: '" + p.origin + "'");
    if (request.async === false) {
      warn("sync not supported");
      return callback();
    }
    frame = getFrame(p.origin, slaves[p.origin]);
    socket = connect(frame);
    socket.on("response", function(resp) {
      callback(resp);
      return socket.close();
    });
    request.xhr.addEventListener('abort', function() {
      return socket.emit("abort");
    });
    socket.on("xhr-event", function() {
      return request.xhr.dispatchEvent.apply(null, arguments);
    });
    socket.on("xhr-upload-event", function() {
      return request.xhr.upload.dispatchEvent.apply(null, arguments);
    });
    obj = strip(request);
    obj.headers = request.headers;
    if (instOf(request.body, 'FormData')) {
      obj.body = ["XD_FD", request.body.entries];
    }
    if (instOf(request.body, 'Uint8Array')) {
      obj.body = request.body;
    }
    if (request.withCredentials) {
      obj.credentials = document.cookie;
    }
    socket.emit("request", obj);
  });
};

masters = null;

addMasters = function(m) {
  var origin, path;
  if (masters === null) {
    masters = {};
    initSlave();
  }
  for (origin in m) {
    path = m[origin];
    log("adding master: " + origin);
    masters[origin] = path;
  }
};

initSlave = function() {
  listen(function(origin, socket) {
    var master, masterRegex, pathRegex, regex;
    if (origin === "null") {
      origin = "*";
    }
    pathRegex = null;
    for (master in masters) {
      regex = masters[master];
      try {
        masterRegex = toRegExp(master);
        if (masterRegex.test(origin)) {
          pathRegex = toRegExp(regex);
          break;
        }
      } catch (_error) {}
    }
    if (!pathRegex) {
      warn("blocked request from: '" + origin + "'");
      return;
    }
    socket.once("request", function(req) {
      var args, fd, k, p, v, xhr, _i, _len, _ref, _ref1;
      log("request: " + req.method + " " + req.url);
      p = parseUrl(req.url);
      if (!(p && pathRegex.test(p.path))) {
        warn("blocked request to path: '" + p.path + "' by regex: " + pathRegex);
        socket.close();
        return;
      }
      xhr = new XMLHttpRequest();
      xhr.open(req.method, req.url);
      xhr.addEventListener("*", function(e) {
        return socket.emit('xhr-event', e.type, strip(e));
      });
      if (xhr.upload) {
        xhr.upload.addEventListener("*", function(e) {
          return socket.emit('xhr-upload-event', e.type, strip(e));
        });
      }
      socket.once("abort", function() {
        return xhr.abort();
      });
      xhr.onreadystatechange = function() {
        var resp;
        if (xhr.readyState !== 4) {
          return;
        }
        resp = {
          status: xhr.status,
          statusText: xhr.statusText,
          data: xhr.response,
          headers: xhook.headers(xhr.getAllResponseHeaders())
        };
        try {
          resp.text = xhr.responseText;
        } catch (_error) {}
        return socket.emit('response', resp);
      };
      if (req.withCredentials) {
        req.headers['XDomain-Cookie'] = req.credentials;
      }
      if (req.timeout) {
        xhr.timeout = req.timeout;
      }
      if (req.type) {
        xhr.responseType = req.type;
      }
      _ref = req.headers;
      for (k in _ref) {
        v = _ref[k];
        xhr.setRequestHeader(k, v);
      }
      if (req.body instanceof Array && req.body[0] === "XD_FD") {
        fd = new xhook.FormData();
        _ref1 = req.body[1];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          args = _ref1[_i];
          fd.append.apply(fd, args);
        }
        req.body = fd;
      }
      xhr.send(req.body || null);
    });
    log("slave listening for requests on socket: " + socket.id);
  });
  if (window === window.parent) {
    return warn("slaves must be in an iframe");
  } else {
    return window.parent.postMessage("XDPING_" + COMPAT_VERSION, '*');
  }
};

onMessage = function(fn) {
  if (document.addEventListener) {
    return window.addEventListener("message", fn);
  } else {
    return window.attachEvent("onmessage", fn);
  }
};

handler = null;

sockets = {};

jsonEncode = true;

XD_CHECK = "XD_CHECK";

startPostMessage = function() {
  return onMessage(function(e) {
    var d, extra, id, sock;
    d = e.data;
    if (typeof d === "string") {
      if (/^XPING_/.test(d)) {
        return warn("your master is not compatible with your slave, check your xdomain.js verison");
      } else if (/^xdomain-/.test(d)) {
        d = d.split(",");
      } else if (jsonEncode) {
        try {
          d = JSON.parse(d);
        } catch (_error) {
          return;
        }
      }
    }
    if (!(d instanceof Array)) {
      return;
    }
    id = d.shift();
    if (!/^xdomain-/.test(id)) {
      return;
    }
    sock = sockets[id];
    if (sock === null) {
      return;
    }
    if (sock === undefined) {
      if (!handler) {
        return;
      }
      sock = createSocket(id, e.source);
      handler(e.origin, sock);
    }
    extra = typeof d[1] === "string" ? ": '" + d[1] + "'" : "";
    log("receive socket: " + id + ": '" + d[0] + "'" + extra);
    sock.fire.apply(sock, d);
  });
};

createSocket = function(id, frame) {
  var check, checks, emit, pendingEmits, ready, sock,
    _this = this;
  ready = false;
  sock = sockets[id] = xhook.EventEmitter(true);
  sock.id = id;
  sock.once('close', function() {
    sock.destroy();
    return sock.close();
  });
  pendingEmits = [];
  sock.emit = function() {
    var args, extra;
    args = slice(arguments);
    extra = typeof args[1] === "string" ? ": '" + args[1] + "'" : "";
    log("send socket: " + id + ": " + args[0] + extra);
    args.unshift(id);
    if (ready) {
      emit(args);
    } else {
      pendingEmits.push(args);
    }
  };
  emit = function(args) {
    if (jsonEncode) {
      args = JSON.stringify(args);
    }
    frame.postMessage(args, "*");
  };
  sock.close = function() {
    sock.emit('close');
    log("close socket: " + id);
    sockets[id] = null;
  };
  sock.once(XD_CHECK, function(obj) {
    jsonEncode = typeof obj === "string";
    ready = true;
    log("ready socket: " + id);
    while (pendingEmits.length) {
      emit(pendingEmits.shift());
    }
  });
  checks = 0;
  check = function() {
    frame.postMessage([id, XD_CHECK, {}], "*");
    if (ready) {
      return;
    }
    if (checks++ === xdomain.timeout / CHECK_INTERVAL) {
      warn("Timeout waiting on iframe socket");
    } else {
      setTimeout(check, CHECK_INTERVAL);
    }
  };
  setTimeout(check);
  log("new socket: " + id);
  return sock;
};

connect = function(target) {
  var s;
  s = createSocket(guid(), target);
  return s;
};

listen = function(h) {
  handler = h;
};

'use strict';

xdomain = function(o) {
  if (!o) {
    return;
  }
  if (o.masters) {
    addMasters(o.masters);
  }
  if (o.slaves) {
    addSlaves(o.slaves);
  }
};

xdomain.masters = addMasters;

xdomain.slaves = addSlaves;

xdomain.debug = false;

xdomain.timeout = 15e3;

CHECK_INTERVAL = 100;

document = window.document;

location = window.location;

currentOrigin = xdomain.origin = location.protocol + '//' + location.host;

guid = function() {
  return 'xdomain-' + Math.round(Math.random() * Math.pow(2, 32)).toString(16);
};

slice = function(o, n) {
  return Array.prototype.slice.call(o, n);
};

prep = function(s) {
  return "xdomain (" + currentOrigin + "): " + s;
};

console = window.console || {};

log = function(str) {
  if (!xdomain.debug) {
    return;
  }
  str = prep(str);
  if ('log' in xdomain) {
    xdomain.log(str);
  }
  if ('log' in console) {
    console.log(str);
  }
};

warn = function(str) {
  str = prep(str);
  if ('warn' in xdomain) {
    xdomain.warn(str);
  }
  if ('warn' in console) {
    console.warn(str);
  } else {
    alert(str);
  }
};

_ref = ['postMessage', 'JSON'];
for (_i = 0, _len = _ref.length; _i < _len; _i++) {
  feature = _ref[_i];
  if (!window[feature]) {
    warn("requires '" + feature + "' and this browser does not support it");
    return;
  }
}

instOf = function(obj, global) {
  if (typeof window[global] !== "function") {
    return false;
  }
  return obj instanceof window[global];
};

COMPAT_VERSION = "V1";

parseUrl = xdomain.parseUrl = function(url) {
  if (/^((https?:)?\/\/[^\/\?]+)(\/.*)?/.test(url)) {
    return {
      origin: (RegExp.$2 ? '' : location.protocol) + RegExp.$1,
      path: RegExp.$3
    };
  } else {
    log("failed to parse absolute url: " + url);
    return null;
  }
};

toRegExp = function(obj) {
  var str;
  if (obj instanceof RegExp) {
    return obj;
  }
  str = obj.toString().replace(/\W/g, function(str) {
    return "\\" + str;
  }).replace(/\\\*/g, ".*");
  return new RegExp("^" + str + "$");
};

strip = function(src) {
  var dst, k, v, _ref1;
  dst = {};
  for (k in src) {
    if (k === "returnValue") {
      continue;
    }
    v = src[k];
    if ((_ref1 = typeof v) !== "function" && _ref1 !== "object") {
      dst[k] = v;
    }
  }
  return dst;
};

(function() {
  var attrs, fn, k, prefix, script, _j, _k, _len1, _len2, _ref1, _ref2;
  attrs = {
    debug: function(value) {
      if (typeof value !== "string") {
        return;
      }
      return xdomain.debug = value !== "false";
    },
    slave: function(value) {
      var p, s;
      if (!value) {
        return;
      }
      p = parseUrl(value);
      if (!p) {
        return;
      }
      s = {};
      s[p.origin] = p.path;
      return addSlaves(s);
    },
    master: function(value) {
      var m, p;
      if (!value) {
        return;
      }
      if (value === "*") {
        p = {
          origin: "*",
          path: "*"
        };
      } else {
        p = parseUrl(value);
      }
      if (!p) {
        return;
      }
      m = {};
      m[p.origin] = p.path.replace(/^\//, "") ? p.path : "*";
      return addMasters(m);
    }
  };
  _ref1 = document.getElementsByTagName("script");
  for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
    script = _ref1[_j];
    if (/xdomain/.test(script.src)) {
      _ref2 = ['', 'data-'];
      for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
        prefix = _ref2[_k];
        for (k in attrs) {
          fn = attrs[k];
          fn(script.getAttribute(prefix + k));
        }
      }
    }
  }
})();

startPostMessage();

window.xdomain = xdomain;
}(this));
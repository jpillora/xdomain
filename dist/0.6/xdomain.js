// XDomain - v0.6.0 - https://github.com/jpillora/xdomain
// Jaime Pillora <dev@jpillora.com> - MIT Copyright 2014
(function(window,undefined) {// XHook - v1.1.2 - https://github.com/jpillora/xhook
// Jaime Pillora <dev@jpillora.com> - MIT Copyright 2014
(function(window,undefined) {var AFTER, BEFORE, COMMON_EVENTS, EventEmitter, FIRE, OFF, ON, READY_STATE, UPLOAD_EVENTS, XMLHTTP, convertHeaders, document, fakeEvent, mergeObjects, proxyEvents, xhook, _base;

document = window.document;

BEFORE = 'before';

AFTER = 'after';

READY_STATE = 'readyState';

ON = 'addEventListener';

OFF = 'removeEventListener';

FIRE = 'dispatchEvent';

XMLHTTP = 'XMLHttpRequest';

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

mergeObjects = function(src, dst) {
  var k, v;
  for (k in src) {
    v = src[k];
    try {
      dst[k] = v;
    } catch (_error) {}
  }
};

proxyEvents = function(events, from, to) {
  var event, p, _i, _len;
  p = function(event) {
    return function(e) {
      var clone, key, val;
      clone = {};
      for (key in e) {
        val = e[key];
        clone[key] = val === from ? to : val;
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

EventEmitter = function(internal) {
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
  emitter[FIRE] = function(event, obj) {
    var e, i, legacylistener, listener, _i, _len, _ref;
    e = fakeEvent(event);
    mergeObjects(obj, e);
    legacylistener = emitter["on" + event];
    if (legacylistener) {
      legacylistener(e);
    }
    _ref = listeners(event);
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      listener = _ref[i];
      listener(e);
    }
  };
  if (internal) {
    emitter.listeners = function(event) {
      return Array.prototype.slice.call(listeners(event));
    };
    emitter.on = emitter[ON];
    emitter.off = emitter[OFF];
    emitter.fire = emitter[FIRE];
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

xhook[XMLHTTP] = window[XMLHTTP];

window[XMLHTTP] = function() {
  var currentState, facade, readBody, readHead, request, response, setReadyState, transiting, writeBody, writeHead, xhr;
  xhr = new xhook[XMLHTTP]();
  transiting = false;
  request = EventEmitter(true);
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
    facade.response = response.data || response.text || null;
    facade.responseText = response.text || '';
    facade.responseXML = response.xml || null;
  };
  currentState = 0;
  setReadyState = function(n) {
    var checkReadyState, hooks, process;
    checkReadyState = function() {
      while (n > currentState && currentState < 4) {
        facade[READY_STATE] = ++currentState;
        if (currentState === 1) {
          facade[FIRE]("loadstart", fakeEvent("loadstart"));
        }
        if (currentState === 2) {
          writeHead();
        }
        if (currentState === 4) {
          writeHead();
          writeBody();
        }
        facade[FIRE]("readystatechange", fakeEvent("readystatechange"));
        if (currentState === 4) {
          facade[FIRE]("load", fakeEvent("load"));
          facade[FIRE]("loadend", fakeEvent("loadend"));
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
  facade = EventEmitter();
  facade[ON]('progress', function() {
    return setReadyState(3);
  });
  proxyEvents(COMMON_EVENTS, xhr, facade);
  request.on = function(event, fn) {
    facade[ON](event, fn);
  };
  request.fire = function(event, obj) {
    facade[FIRE](event, obj);
  };
  facade.withCredentials = false;
  facade.response = null;
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
    var hooks, process, send;
    request.body = body;
    send = function() {
      var header, k, modk, value, _i, _len, _ref, _ref1;
      transiting = true;
      xhr.open(request.method, request.url, true, request.user, request.pass);
      _ref = ['type', 'timeout'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        k = _ref[_i];
        modk = k === "type" ? "responseType" : k;
        xhr[modk] = request[k] || facade[modk];
      }
      _ref1 = request.headers;
      for (header in _ref1) {
        value = _ref1[header];
        xhr.setRequestHeader(header, value);
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
      done.text = function(text) {
        response.text = text;
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
    facade[FIRE]('abort', arguments);
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
  facade.upload = request.upload = EventEmitter();
  if (xhr.upload) {
    proxyEvents(COMMON_EVENTS.concat(UPLOAD_EVENTS), xhr.upload, facade.upload);
  }
  return facade;
};

(this.define || Object)((this.exports || this).xhook = xhook);
}(this));
var CHECK_INTERVAL, COMPAT_VERSION, XD_ENCODE, XD_OBJ_TEST, addMasters, addSlaves, attr, connect, console, createSocket, currentOrigin, feature, frames, getFrame, guid, initMaster, initSlave, listen, log, m, masters, offMessage, onMessage, p, parseUrl, prefix, prep, s, script, server, slaves, slice, sockets, toRegExp, warn, xdomain, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2,
  __slice = [].slice;

onMessage = function(fn) {
  if (document.addEventListener) {
    return window.addEventListener("message", fn);
  } else {
    return window.attachEvent("onmessage", fn);
  }
};

offMessage = function(fn) {
  if (document.removeEventListener) {
    return window.removeEventListener("message", fn);
  } else {
    return window.dettachEvent("onmessage", fn);
  }
};

server = null;

sockets = {};

XD_ENCODE = true;

XD_OBJ_TEST = {
  XD_OBJ: true
};

onMessage(function(e) {
  var d, id, sock;
  d = e.data;
  switch (typeof d) {
    case "string":
      try {
        d = JSON.parse(d);
      } catch (_error) {
        return;
      }
      break;
    case "object":
      if (XD_ENCODE) {
        e.source.postMessage(XD_OBJ_TEST, "*");
      }
      XD_ENCODE = false;
      if (d.XD_OBJ) {
        return;
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
  if (!sock) {
    if (!server) {
      return;
    }
    sock = server.handle(id, e.source);
  }
  sock.fire.apply(sock, d);
  return {
    readyCheck: function(callback) {
      if (ready) {
        return callback();
      }
      waiters.push(callback);
      if (waiters.length !== 1) {
        return;
      }
      check();
    }
  };
});

createSocket = function(id, frame) {
  var check, pendingEmits, ready, sock, waits,
    _this = this;
  waits = 0;
  ready = false;
  pendingEmits = [];
  sock = sockets[id] = xhook.EventEmitter(true);
  check = function() {
    frame.postMessage(XD_OBJ_TEST);
    if (waits++ >= xdomain.timeout / CHECK_INTERVAL) {
      throw "Timeout waiting on iframe socket";
    } else {
      return setTimeout(check, CHECK_INTERVAL);
    }
  };
  check();
  sock.once('xd_ready', function() {
    sock.destroy();
    return sock.close();
  });
  sock.once('close', function() {
    sock.destroy();
    return sock.close();
  });
  sock.emit = function() {
    var args;
    args = slice(arguments);
    args.unshift(id);
    if (XD_ENCODE) {
      args = JSON.stringify(args);
    }
    return frame.postMessage(args, "*");
  };
  sock.close = function() {
    return delete sockets[id];
  };
  return sock;
};

connect = function(target) {
  var s;
  s = new Socket(guid(), target);
  return s;
};

listen = function(handler) {
  server = function(e, id) {
    var s;
    s = new Socket(id, e.source);
    handler(e, s);
    return s;
  };
};

slaves = null;

addSlaves = function(s) {
  var origin, path;
  if (slaves === null) {
    slaves = {};
    initMaster();
  }
  for (origin in s) {
    path = s[origin];
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
  frame.id = frame.name = 'xdomain-' + guid();
  frame.src = origin + proxyPath;
  frame.setAttribute('style', 'display:none;');
  document.body.appendChild(frame);
  return frames[origin] = frame.contentWindow;
};

initMaster = function() {
  return xhook.before(function(request, callback) {
    var c, frame, p;
    p = parseUrl(request.url);
    if (!(p && slaves[p.origin])) {
      log("no slave matching: '" + p.origin + "'");
      return callback();
    }
    log("proxying request slave: '" + p.origin + "'");
    if (request.async === false) {
      warn("sync not supported");
      return callback();
    }
    frame = getFrame(p.origin, slaves[p.origin]);
    c = connect(frame);
    c.on("response", function(resp) {
      callback(resp);
      return c.close();
    });
    request.on('abort', function() {
      return c.emit("abort");
    });
    c.on("abort", function() {
      return c.close();
    });
    c.on("xhr-event", function(args) {
      return request.fire.apply(null, args);
    });
    c.emit("request", request);
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
    masters[origin] = path;
  }
};

initSlave = function() {
  var proxy, proxyXhrs;
  proxyXhrs = {};
  proxy = function(id, msg) {};
  onMessage(function(event) {
    var emit, frame, id, k, master, masterRegex, msg, origin, p, pathRegex, proxyXhr, regex, v, _ref, _ref1;
    origin = event.origin === "null" ? "*" : event.origin;
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
    frame = event.source;
    _ref = getMessage(event.data), id = _ref.id, msg = _ref.msg;
    p = parseUrl(req.url);
    if (!(p && pathRegex.test(p.path))) {
      warn("blocked request to path: '" + p.path + "' by regex: " + regex);
      return;
    }
    emit = function() {
      var args, event;
      event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return frame.postMessage(setMessage([id, event].concat(args)), origin);
    };
    proxyXhr = new XMLHttpRequest();
    proxyXhr.open(req.method, req.url);
    proxyXhr.onprogress = function(e) {
      return emit('download', {
        loaded: e.loaded,
        total: e.total
      });
    };
    proxyXhr.upload.onprogress = function(e) {
      return emit('upload', {
        loaded: e.loaded,
        total: e.total
      });
    };
    proxyXhr.onabort = function() {
      return emit('abort');
    };
    proxyXhr.onreadystatechange = function() {
      var resp;
      if (proxyXhr.readyState !== 4) {
        return;
      }
      resp = {
        status: proxyXhr.status,
        statusText: proxyXhr.statusText,
        text: proxyXhr.responseText,
        headers: xhook.headers(proxyXhr.getAllResponseHeaders())
      };
      return emit('response', resp);
    };
    if (req.timeout) {
      proxyXhr.timeout = req.timeout;
    }
    _ref1 = req.headers;
    for (k in _ref1) {
      v = _ref1[k];
      proxyXhr.setRequestHeader(k, v);
    }
    return proxyXhr.send(req.body || null);
  });
  if (window === window.parent) {
    return warn("slaves must be in an iframe");
  } else {
    return window.parent.postMessage("XDPING_" + COMPAT_VERSION, '*');
  }
};

'use strict';

currentOrigin = location.protocol + '//' + location.host;

guid = function() {
  return (Math.random() * Math.pow(2, 32)).toString(16);
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
  if ('log' in console) {
    console.log(str);
  }
};

warn = function(str) {
  str = prep(str);
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

COMPAT_VERSION = "V0";

parseUrl = function(url) {
  if (/(https?:\/\/[^\/\?]+)(\/.*)?/.test(url)) {
    return {
      origin: RegExp.$1,
      path: RegExp.$2
    };
  } else {
    log("failed to parse url: " + url);
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
  }).replace(/\\\*/g, ".+");
  return new RegExp("^" + str + "$");
};

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

xdomain.debug = false;

xdomain.masters = addMasters;

xdomain.slaves = addSlaves;

xdomain.parseUrl = parseUrl;

xdomain.origin = currentOrigin;

xdomain.timeout = 15e3;

CHECK_INTERVAL = 100;

window.xdomain = xdomain;

_ref1 = document.getElementsByTagName("script");
for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
  script = _ref1[_j];
  if (/xdomain/.test(script.src)) {
    _ref2 = ['', 'data-'];
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      prefix = _ref2[_k];
      attr = script.getAttribute(prefix + 'slave');
      if (attr) {
        p = parseUrl(attr);
        if (!p) {
          return;
        }
        s = {};
        s[p.origin] = p.path;
        addSlaves(s);
        break;
      }
      attr = script.getAttribute(prefix + 'master');
      if (attr) {
        m = {};
        m[attr] = /./;
        addMasters(m);
      }
    }
  }
}
}(this));
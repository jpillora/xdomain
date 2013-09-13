// XDomain - v0.5.4 - https://github.com/jpillora/xdomain
// Jaime Pillora <dev@jpillora.com> - MIT Copyright 2013
(function(window,document,undefined) {
// XHook - v1.0.1 - https://github.com/jpillora/xhook
// Jaime Pillora <dev@jpillora.com> - MIT Copyright 2013
(function(window,document,undefined) {
var AFTER, BEFORE, EventEmitter, INVALID_PARAMS_ERROR, READY_STATE, convertHeaders, createXHRFacade, patchClass, pluginEvents, xhook, _base,
  __slice = [].slice;

BEFORE = 'before';

AFTER = 'after';

READY_STATE = 'readyState';

INVALID_PARAMS_ERROR = "Invalid number or parameters. Please see API documentation.";

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

EventEmitter = function(ctx) {
  var emitter, events, listeners;
  events = {};
  listeners = function(event) {
    return events[event] || [];
  };
  emitter = {
    listeners: function(event) {
      return Array.prototype.slice.call(listeners(event));
    },
    on: function(event, callback, i) {
      events[event] = listeners(event);
      if (events[event].indexOf(callback) >= 0) {
        return;
      }
      i = i === undefined ? events[event].length : i;
      events[event].splice(i, 0, callback);
    },
    off: function(event, callback) {
      var i;
      i = listeners(event).indexOf(callback);
      if (i === -1) {
        return;
      }
      listeners(event).splice(i, 1);
    },
    fire: function() {
      var args, event, listener, _i, _len, _ref;
      event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      _ref = listeners(event);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        listener = _ref[_i];
        listener.apply(ctx, args);
      }
    }
  };
  return emitter;
};

pluginEvents = EventEmitter();

xhook = {};

xhook[BEFORE] = function(handler, i) {
  return pluginEvents.on(BEFORE, handler, i);
};

xhook[AFTER] = function(handler, i) {
  return pluginEvents.on(AFTER, handler, i);
};

convertHeaders = function(h, dest) {
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

xhook.headers = convertHeaders;

patchClass = function(name) {
  var Class;
  Class = window[name];
  if (!Class) {
    return;
  }
  window[name] = function(arg) {
    if (typeof arg === "string" && !/\.XMLHTTP/.test(arg)) {
      return;
    }
    return createXHRFacade(new Class(arg));
  };
};

patchClass("ActiveXObject");

patchClass("XMLHttpRequest");

createXHRFacade = function(xhr) {
  var checkEvent, currentState, event, extractProps, face, readyBody, readyHead, request, response, setReadyState, transiting, xhrEvents, _i, _len, _ref;
  if (pluginEvents.listeners(BEFORE).length === 0 && pluginEvents.listeners(AFTER).length === 0) {
    return xhr;
  }
  transiting = false;
  request = {
    headers: {}
  };
  response = null;
  xhrEvents = EventEmitter();
  readyHead = function() {
    face.status = response.status;
    face.statusText = response.statusText;
    response.headers || (response.headers = {});
  };
  readyBody = function() {
    face.responseType = response.type || '';
    face.response = response.data || null;
    face.responseText = response.text || response.data || '';
    face.responseXML = response.xml || null;
  };
  currentState = 0;
  setReadyState = function(n) {
    var fire, hooks, process;
    extractProps();
    fire = function() {
      while (n > currentState && currentState < 4) {
        face[READY_STATE] = ++currentState;
        if (currentState === 2) {
          readyHead();
        }
        if (currentState === 4) {
          readyBody();
        }
        xhrEvents.fire("readystatechange");
        if (currentState === 4) {
          xhrEvents.fire("load");
        }
      }
    };
    if (n < 4) {
      return fire();
    }
    hooks = pluginEvents.listeners(AFTER);
    process = function() {
      var hook;
      if (!hooks.length) {
        return fire();
      }
      hook = hooks.shift();
      if (hook.length === 2) {
        hook(request, response);
        return process();
      } else if (hook.length === 3) {
        return hook(request, response, process);
      } else {
        throw INVALID_PARAMS_ERROR;
      }
    };
    process();
  };
  checkEvent = function(e) {
    var clone, key, val;
    clone = {};
    for (key in e) {
      val = e[key];
      clone[key] = val === xhr ? face : val;
    }
    return clone;
  };
  extractProps = function() {
    var fn, key, _i, _len, _ref;
    _ref = ['timeout'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      if (xhr[key] && request[key] === undefined) {
        request[key] = xhr[key];
      }
    }
    for (key in face) {
      fn = face[key];
      if (typeof fn === 'function' && /^on(\w+)/.test(key)) {
        xhrEvents.on(RegExp.$1, fn);
      }
    }
  };
  xhr.onreadystatechange = function(event) {
    var key, val, _ref;
    if (xhr[READY_STATE] === 2) {
      response.status = xhr.status;
      response.statusText = xhr.statusText;
      _ref = convertHeaders(xhr.getAllResponseHeaders());
      for (key in _ref) {
        val = _ref[key];
        if (!response.headers[key]) {
          response.headers[key] = val;
        }
      }
    }
    if (xhr[READY_STATE] === 4) {
      transiting = false;
      response.type = xhr.responseType;
      response.text = xhr.responseText;
      response.data = xhr.response || response.text;
      response.xml = xhr.responseXML;
      setReadyState(xhr[READY_STATE]);
    }
  };
  _ref = ['abort', 'progress'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    event = _ref[_i];
    xhr["on" + event] = function(obj) {
      return xhrEvents.fire(event, checkEvent(obj));
    };
  }
  face = {
    withCredentials: false,
    response: null,
    status: 0
  };
  face.addEventListener = function(event, fn) {
    return xhrEvents.on(event, fn);
  };
  face.removeEventListener = xhrEvents.off;
  face.dispatchEvent = function() {};
  face.open = function(method, url, async) {
    request.method = method;
    request.url = url;
    request.async = async;
    setReadyState(1);
  };
  face.send = function(body) {
    var hooks, process, send;
    request.body = body;
    send = function() {
      var header, value, _ref1;
      response = {
        headers: {}
      };
      transiting = true;
      xhr.open(request.method, request.url, request.async);
      if (request.timeout) {
        xhr.timeout = request.timeout;
      }
      _ref1 = request.headers;
      for (header in _ref1) {
        value = _ref1[header];
        xhr.setRequestHeader(header, value);
      }
      xhr.send(request.body);
    };
    hooks = pluginEvents.listeners(BEFORE);
    process = function() {
      var done, hook;
      if (!hooks.length) {
        return send();
      }
      done = function(resp) {
        if (typeof resp === 'object' && typeof resp.status === 'number') {
          response = resp;
          setReadyState(4);
        } else {
          return process();
        }
      };
      hook = hooks.shift();
      if (hook.length === 1) {
        return done(hook(request));
      } else if (hook.length === 2) {
        return hook(request, done);
      } else {
        throw INVALID_PARAMS_ERROR;
      }
    };
    process();
  };
  face.abort = function() {
    if (transiting) {
      xhr.abort();
    }
    xhrEvents.fire('abort', arguments);
  };
  face.setRequestHeader = function(header, value) {
    request.headers[header] = value;
  };
  face.getResponseHeader = function(header) {
    return response.headers[header];
  };
  face.getAllResponseHeaders = function() {
    return convertHeaders(response.headers);
  };
  face.upload = EventEmitter();
  return face;
};

window.xhook = xhook;
}(window,document));
'use strict';
var CHECK_INTERVAL, COMPAT_VERSION, Frame, addMasters, addSlaves, attr, currentOrigin, feature, getMessage, guid, m, masters, onMessage, p, parseUrl, prefix, s, script, setMessage, setupReceiver, setupSender, slaves, toRegExp, warn, xdomain, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;

currentOrigin = location.protocol + '//' + location.host;

warn = function(str) {
  str = "xdomain (" + currentOrigin + "): " + str;
  if (console['warn']) {
    return console.warn(str);
  } else {
    return alert(str);
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

guid = function() {
  return (Math.random() * Math.pow(2, 32)).toString(16);
};

parseUrl = function(url) {
  if (/(https?:\/\/[^\/]+)(\/.*)?/.test(url)) {
    return {
      origin: RegExp.$1,
      path: RegExp.$2
    };
  } else {
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

onMessage = function(fn) {
  if (document.addEventListener) {
    return window.addEventListener("message", fn);
  } else {
    return window.attachEvent("onmessage", fn);
  }
};

setMessage = function(obj) {
  return JSON.stringify(obj);
};

getMessage = function(str) {
  return JSON.parse(str);
};

masters = null;

addMasters = function(m) {
  var origin, path;
  if (masters === null) {
    masters = {};
    setupReceiver();
  }
  for (origin in m) {
    path = m[origin];
    masters[origin] = path;
  }
};

setupReceiver = function() {
  onMessage(function(event) {
    var frame, k, master, masterRegex, message, origin, p, pathRegex, proxyXhr, regex, req, v, _ref1;
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
    message = getMessage(event.data);
    req = message.msg;
    p = parseUrl(req.url);
    if (!(p && pathRegex.test(p.path))) {
      warn("blocked request to path: '" + p.path + "' by regex: " + regex);
      return;
    }
    proxyXhr = new XMLHttpRequest();
    proxyXhr.open(req.method, req.url);
    proxyXhr.onreadystatechange = function() {
      var resp;
      if (proxyXhr.readyState !== 4) {
        return;
      }
      resp = {
        status: proxyXhr.status,
        statusText: proxyXhr.statusText,
        type: "",
        text: proxyXhr.responseText,
        headers: xhook.headers(proxyXhr.getAllResponseHeaders())
      };
      return frame.postMessage(setMessage({
        id: message.id,
        msg: resp
      }), origin);
    };
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
    return window.parent.postMessage("XPING_" + COMPAT_VERSION, '*');
  }
};

slaves = null;

addSlaves = function(s) {
  var origin, path;
  if (slaves === null) {
    slaves = {};
    setupSender();
  }
  for (origin in s) {
    path = s[origin];
    slaves[origin] = path;
  }
};

setupSender = function() {
  onMessage(function(e) {
    var _ref1;
    return (_ref1 = Frame.prototype.frames[e.origin]) != null ? _ref1.recieve(e) : void 0;
  });
  return xhook.before(function(request, callback) {
    var frame, p;
    p = parseUrl(request.url);
    if (!(p && slaves[p.origin])) {
      return callback();
    }
    if (request.async === false) {
      warn("sync not supported");
    }
    frame = new Frame(p.origin, slaves[p.origin]);
    frame.send(request, callback);
  });
};

Frame = (function() {
  Frame.prototype.frames = {};

  function Frame(origin, proxyPath) {
    this.origin = origin;
    this.proxyPath = proxyPath;
    if (this.frames[this.origin]) {
      return this.frames[this.origin];
    }
    this.frames[this.origin] = this;
    this.listeners = {};
    this.frame = document.createElement("iframe");
    this.frame.id = this.frame.name = 'xdomain-' + guid();
    this.frame.src = this.origin + this.proxyPath;
    this.frame.setAttribute('style', 'display:none;');
    document.body.appendChild(this.frame);
    this.waits = 0;
    this.waiters = [];
    this.ready = false;
  }

  Frame.prototype.post = function(msg) {
    this.frame.contentWindow.postMessage(msg, this.origin);
  };

  Frame.prototype.listen = function(id, callback) {
    if (this.listeners[id]) {
      throw "already listening for: " + id;
    }
    this.listeners[id] = callback;
  };

  Frame.prototype.unlisten = function(id) {
    delete this.listeners[id];
  };

  Frame.prototype.recieve = function(event) {
    var cb, message;
    if (/^XPING(_(V\d+))?$/.test(event.data)) {
      if (RegExp.$2 !== COMPAT_VERSION) {
        warn("your master is not compatible with your slave, check your xdomain.js verison");
        return;
      }
      this.ready = true;
      return;
    }
    message = getMessage(event.data);
    cb = this.listeners[message.id];
    if (!cb) {
      warn("unkown message (" + message.id + ")");
      return;
    }
    this.unlisten(message.id);
    cb(message.msg);
  };

  Frame.prototype.send = function(msg, callback) {
    var _this = this;
    this.readyCheck(function() {
      var id;
      id = guid();
      _this.listen(id, function(data) {
        return callback(data);
      });
      return _this.post(setMessage({
        id: id,
        msg: msg
      }));
    });
  };

  Frame.prototype.readyCheck = function(callback) {
    var check,
      _this = this;
    if (this.ready) {
      return callback();
    }
    this.waiters.push(callback);
    if (this.waiters.length !== 1) {
      return;
    }
    check = function() {
      if (_this.ready) {
        while (_this.waiters.length) {
          _this.waiters.shift()();
        }
        return;
      }
      if (_this.waits++ >= xdomain.timeout / CHECK_INTERVAL) {
        throw "Timeout connecting to iframe: " + _this.origin;
      } else {
        return setTimeout(check, CHECK_INTERVAL);
      }
    };
    check();
  };

  return Frame;

})();

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
}(window,document));
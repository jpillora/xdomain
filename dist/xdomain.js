// XDomain - v0.3.0 - https://github.com/jpillora/xdomain
// © Jaime Pillora <dev@jpillora.com> MIT 2013
(function(window,document,undefined) {

'use strict';
var Frame, PING, currentOrigin, feature, getMessage, guid, log, masters, onMessage, p, parseUrl, script, setMessage, setupMaster, setupSlave, slaves, _i, _j, _len, _len1, _ref, _ref1;

currentOrigin = location.protocol + '//' + location.host;

log = function(str) {
  if (window.console === undefined) {
    return;
  }
  return console.log("xdomain (" + currentOrigin + "): " + str);
};

_ref = ['postMessage', 'JSON'];
for (_i = 0, _len = _ref.length; _i < _len; _i++) {
  feature = _ref[_i];
  if (!window[feature]) {
    log("requires '" + feature + "' and this browser does not support it");
    return;
  }
}

PING = 'XPING';

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

setupSlave = function(masters) {
  onMessage(function(event) {
    var frame, message, origin, p, proxyXhr, regex, req;
    origin = event.origin;
    regex = masters[origin] || masters['*'];
    if (!regex) {
      log("blocked request from: '" + origin + "'");
      return;
    }
    frame = event.source;
    message = getMessage(event.data);
    req = message.req;
    if (regex && regex.test && req) {
      p = parseUrl(req.url);
      if (!regex.test(p.path)) {
        log("blocked request to path: '" + p.path + "' by regex: " + regex);
        return;
      }
    }
    proxyXhr = new XMLHttpRequest();
    proxyXhr.open(req.method, req.url);
    proxyXhr.onreadystatechange = function() {
      var m;
      if (proxyXhr.readyState !== 4) {
        return;
      }
      m = setMessage({
        id: message.id,
        res: {
          props: proxyXhr,
          responseHeaders: window.xhook.headers(proxyXhr.getAllResponseHeaders())
        }
      });
      return frame.postMessage(m, origin);
    };
    return proxyXhr.send();
  });
  return window.parent.postMessage(PING, '*');
};

setupMaster = function(slaves) {
  onMessage(function(e) {
    var _ref1;
    return (_ref1 = Frame.prototype.frames[event.origin]) != null ? _ref1.recieve(e) : void 0;
  });
  return window.xhook(function(xhr) {
    return xhr.onCall('send', function() {
      var frame, p;
      p = parseUrl(xhr.url);
      if (!(p && slaves[p.origin])) {
        return;
      }
      frame = new Frame(p.origin, slaves[p.origin]);
      frame.send(xhr.serialize(), function(res) {
        xhr.deserialize(res);
        return xhr.triggerComplete();
      });
      return false;
    });
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
    this.ready = false;
  }

  Frame.prototype.post = function(msg) {
    return this.frame.contentWindow.postMessage(msg, this.origin);
  };

  Frame.prototype.listen = function(id, callback) {
    if (this.listeners[id]) {
      throw "already listening for: " + id;
    }
    return this.listeners[id] = callback;
  };

  Frame.prototype.unlisten = function(id) {
    return delete this.listeners[id];
  };

  Frame.prototype.recieve = function(event) {
    var cb, message;
    if (event.data === PING) {
      this.ready = true;
      return;
    }
    message = getMessage(event.data);
    cb = this.listeners[message.id];
    if (!cb) {
      console.warn("missing id", message.id);
      return;
    }
    this.unlisten(message.id);
    return cb(message.res);
  };

  Frame.prototype.send = function(req, callback) {
    var _this = this;
    return this.readyCheck(function() {
      var id;
      id = guid();
      _this.listen(id, function(data) {
        return callback(data);
      });
      return _this.post(setMessage({
        id: id,
        req: req
      }));
    });
  };

  Frame.prototype.readyCheck = function(callback) {
    var _this = this;
    if (this.ready === true) {
      return callback();
    }
    if (this.waits++ >= 100) {
      throw "Timeout connecting to iframe: " + this.origin;
    }
    return setTimeout(function() {
      return _this.readyCheck(callback);
    }, 100);
  };

  return Frame;

})();

window.xdomain = function(o) {
  if (!o) {
    return;
  }
  log("init");
  if (o.masters) {
    setupSlave(o.masters);
  }
  if (o.slaves) {
    return setupMaster(o.slaves);
  }
};

xdomain.origin = currentOrigin;

_ref1 = document.getElementsByTagName("script");
for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
  script = _ref1[_j];
  if (/xdomain/.test(script.src)) {
    if (script.hasAttribute('slave')) {
      p = parseUrl(script.getAttribute('slave'));
      if (!p) {
        return;
      }
      slaves = {};
      slaves[p.origin] = p.path;
      xdomain({
        slaves: slaves
      });
    }
    if (script.hasAttribute('master')) {
      p = parseUrl(script.getAttribute('master'));
      if (!p) {
        return;
      }
      masters = {};
      masters[p.origin] = /./;
      xdomain({
        masters: masters
      });
    }
  }
}
}(window,document));
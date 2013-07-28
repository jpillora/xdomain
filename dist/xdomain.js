/** XDomain - v0.0.1 - 2013/07/28
 * 
 * Copyright (c) 2013 Jaime Pillora - MIT
 */

(function(window,document,undefined) {
(function() {
  'use strict';

  var $window, Frame, PING, PONG, feature, getMessage, guid, inherit, log, onMessage, origins, parseUrl, realAjax, setMessage, setupMaster, setupSlave, _i, _len, _ref;

  log = function(str) {
    if (window.console === undefined) {
      return;
    }
    return console.log("xdomain (" + location.origin + "): " + str);
  };

  _ref = ['postMessage', 'JSON'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    feature = _ref[_i];
    if (!window[feature]) {
      log("requires '" + feature + "' and this browser does not support it");
      return;
    }
  }

  $window = $(window);

  realAjax = $.ajax;

  PING = '__xdomain_PING';

  PONG = '__xdomain_PONG';

  origins = {
    masters: {},
    slaves: {}
  };

  if (!location.origin) {
    location.origin = location.protocol + '//' + location.host;
  }

  guid = function() {
    return (Math.random() * Math.pow(2, 32)).toString(16);
  };

  parseUrl = function(url) {
    var m;
    m = url.match(/(https?:\/\/[^\/]+)(\/.*)/);
    return m && {
      origin: m[1],
      path: m[2]
    };
  };

  inherit = function(parent, obj) {
    var F;
    F = function() {};
    F.prototype = parent;
    return $.extend(true, new F(), obj);
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
    return onMessage(function(event) {
      var message, regex;
      regex = masters[event.origin];
      if (!regex) {
        log("blocked message from: " + event.origin);
        return;
      }
      if (event.data === PING) {
        event.source.postMessage(PONG, event.origin);
        return;
      }
      message = getMessage(event.data);
      return realAjax(message.payload).always(function() {
        var args, m;
        args = Array.prototype.slice.call(arguments);
        m = setMessage({
          id: message.id,
          args: args
        });
        return event.source.postMessage(m, event.origin);
      });
    });
  };

  setupMaster = function(slaves) {
    onMessage(function(e) {
      var frame;
      frame = Frame.prototype.frames[event.origin];
      if (frame) {
        return frame.recieve(e);
      }
    });
    return $.ajax = function(url, opts) {
      var d, frame, p;
      if (opts == null) {
        opts = {};
      }
      if (typeof url === 'string') {
        opts.url = url;
      } else {
        opts = url;
        url = opts.url;
      }
      if (!url) {
        throw "url required";
      }
      p = parseUrl(url);
      if (!(p && slaves[p.origin])) {
        return realAjax.call($, url, opts);
      }
      frame = new Frame(p.origin, slaves[p.origin]);
      d = $.Deferred();
      if (typeof opts.success === 'function') {
        d.done(opts.success);
      }
      if (typeof opts.error === 'function') {
        d.fail(opts.error);
      }
      if (typeof opts.complete === 'function') {
        d.always(opts.complete);
      }
      frame.send(opts, function(args) {
        if (args[1] === 'success') {
          return d.resolve.apply(d, args);
        } else if (args[1] === 'error') {
          return d.reject.apply(d, args);
        }
      });
      return d.promise();
    };
  };

  Frame = (function() {

    Frame.prototype.frames = {};

    function Frame(origin, proxyPath) {
      var _this = this;
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
      $(function() {
        return $("body").append($(_this.frame).hide());
      });
      this.pingPong.attempts = 0;
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
      if (event.data === PONG) {
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
      return cb(message.args);
    };

    Frame.prototype.send = function(payload, callback) {
      var _this = this;
      return this.pingPong(function() {
        var id;
        id = guid();
        _this.listen(id, function(data) {
          return callback(data);
        });
        return _this.post(setMessage({
          id: id,
          payload: payload
        }));
      });
    };

    Frame.prototype.pingPong = function(callback) {
      var _ref1,
        _this = this;
      if (this.ready === true) {
        return callback();
      }
      if ((_ref1 = this.frame) != null ? _ref1.contentWindow : void 0) {
        this.post(PING);
      }
      if (this.pingPong.attempts++ >= 10) {
        throw "Timeout connecting to iframe: " + this.origin;
      }
      return setTimeout(function() {
        return _this.pingPong(callback);
      }, 500);
    };

    return Frame;

  })();

  $.xdomain = function(o) {
    if (!o) {
      return;
    }
    if (o.masters) {
      setupSlave(o.masters);
    }
    if (o.slaves) {
      return setupMaster(o.slaves);
    }
  };

}).call(this);

}(window,document));
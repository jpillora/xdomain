/** XDomain - v0.0.1 - 2013/04/10
 * 
 * Copyright (c) 2013 Jaime Pillora - MIT
 */

(function(window,document,undefined) {
(function() {
  'use strict';

  var $window, AjaxCall, Frame, PING, PONG, frames, getMessage, guid, inherit, listen, listeners, origins, parseUrl, realAjax, recieveMessage, setMessage, slave, unlisten;

  slave = window.top !== window;

  $window = $(window);

  realAjax = $.ajax;

  PING = '__xdomain_PING';

  PONG = '__xdomain_PONG';

  origins = {
    masters: {},
    slaves: {}
  };

  frames = {};

  listeners = {};

  listen = function(id, callback) {
    if (listeners[id]) {
      throw "already listening for: " + id;
    }
    return listeners[id] = callback;
  };

  unlisten = function(id) {
    return delete listeners[id];
  };

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

  setMessage = function(obj) {
    return JSON.stringify(obj);
  };

  getMessage = function(obj) {
    return JSON.parse(obj);
  };

  if (slave) {
    recieveMessage = function(jq) {
      var event, message, origin, paths;
      event = jq.originalEvent;
      origin = event.origin;
      if (event.data === PING) {
        event.source.postMessage(PONG, origin);
        return;
      }
      message = getMessage(event.data);
      paths = origins.masters[origin];
      if (!paths) {
        throw "Origin not allowed: " + origin;
      }
      if (paths !== '*') {
        throw "Path checks not implemented";
      }
      return realAjax(message.payload).always(function() {
        var args, m;
        args = Array.prototype.slice.call(arguments);
        m = setMessage({
          id: message.id,
          args: args
        });
        return event.source.postMessage(m, event.origin);
      });
    };
  } else {
    recieveMessage = function(jq) {
      var callback, event, message;
      event = jq.originalEvent;
      if (event.data === PONG) {
        frames[event.origin].ready = true;
        return;
      }
      message = getMessage(event.data);
      callback = listeners[message.id];
      if (!callback) {
        console.warn("missing id", message.id);
        return;
      }
      return callback(message.args);
    };
  }

  $window.on('message', recieveMessage);

  Frame = (function() {

    function Frame(origin, path) {
      var _this = this;
      this.origin = origin;
      if (frames[this.origin]) {
        return frames[this.origin];
      }
      this.id = guid();
      this.frame = document.createElement("iframe");
      this.frame.id = this.id;
      this.frame.name = this.id;
      this.frame.src = this.origin + path;
      $(function() {
        $("body").append($(_this.frame).hide());
        return _this.win = _this.frame.contentWindow;
      });
      frames[this.origin] = this;
      this.ready = false;
      undefined;

    }

    Frame.prototype.send = function(payload, callback) {
      var _this = this;
      return this.check(function() {
        var id;
        id = guid();
        listen(id, function(data) {
          unlisten(id);
          return callback(data);
        });
        return _this.win.postMessage(setMessage({
          id: id,
          payload: payload
        }), _this.origin);
      });
    };

    Frame.prototype.check = function(callback) {
      var cur, max, t,
        _this = this;
      if (this.ready) {
        return callback();
      }
      cur = 0;
      max = 3;
      return t = setInterval(function() {
        if (_this.ready) {
          clearInterval(t);
          callback();
          return;
        }
        try {
          return _this.win.postMessage(PING, _this.origin);
        } catch (e) {
          if (cur++ >= max) {
            clearInterval(t);
            throw "timeout";
          }
        }
      }, 500);
    };

    return Frame;

  })();

  AjaxCall = (function() {

    function AjaxCall(origin, url, opts) {
      var proxyPath;
      this.origin = origin;
      this.url = url;
      this.opts = opts;
      proxyPath = origins.slaves[this.origin];
      if (!proxyPath) {
        throw "Missing slave origin: " + this.origin;
      }
      this.frame = new Frame(this.origin, proxyPath);
      this.d = $.Deferred();
      this.frame.send(this.opts, $.proxy(this.handleResponse, this));
      this.d.promise();
    }

    AjaxCall.prototype.handleResponse = function(args) {
      if (args[1] === 'success') {
        return this.d.resolve.apply(this.d, args);
      } else if (args[1] === 'error') {
        return this.d.reject.apply(this.d, args);
      }
    };

    return AjaxCall;

  })();

  $.xdomain = function(o) {
    return $.extend(origins, o);
  };

  $.ajax = function(url, opts) {
    var ajax, p;
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
    if (p && p.origin) {
      ajax = new AjaxCall(p.origin, url, opts);
      return ajax.d;
    }
    return realAjax.call($, url, opts);
  };

}).call(this);

}(window,document));
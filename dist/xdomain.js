/** XDomain - v0.0.1 - 2013/04/10
 * 
 * Copyright (c) 2013 Jaime Pillora - MIT
 */

(function(window,document,undefined) {
(function() {
  'use strict';

  var $window, AjaxCall, Frame, PING, PONG, frames, getMessage, guid, inherit, listen, listeners, log, origins, parseUrl, recieveMessage, setMessage, slave, unlisten;

  log = function(msg) {
    if (!(console && console['log'])) {
      return;
    }
    return console.log('xdomain', window.location.host, ': ', msg);
  };

  log("init client");

  slave = window.top !== window;

  $window = $(window);

  PING = '__xdomain_PING';

  PONG = '__xdomain_PONG';

  origins = {};

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
    return obj;
  };

  getMessage = function(obj) {
    return obj;
  };

  if (slave) {
    recieveMessage = function(jq) {
      var event, id, message;
      event = jq.originalEvent;
      message = getMessage(event.data);
      console.log("slave", message);
      if (message === PING) {
        event.source.postMessage(PONG, event.origin);
        return;
      }
      id = message.id;
      return $.ajax(message.payload).always(function(data, result, xhr) {
        var args;
        args = {
          data: data,
          result: result
        };
        return event.source.postMessage({
          id: id,
          args: args
        }, event.origin);
      });
    };
  } else {
    recieveMessage = function(jq) {
      var callback, event, id, message;
      event = jq.originalEvent;
      message = getMessage(event.data);
      console.log("master", message);
      if (message === PONG) {
        frames[event.origin].ready = true;
        return;
      }
      id = message.id;
      callback = listeners[id];
      if (!callback) {
        return;
      }
      return callback(message.args);
    };
  }

  $window.on('message', recieveMessage);

  Frame = (function() {

    function Frame(origin, path) {
      this.origin = origin;
      if (frames[this.origin]) {
        return frames[this.origin];
      }
      this.id = guid();
      this.frame = document.createElement("iframe");
      this.frame.id = this.id;
      this.frame.name = this.id;
      this.frame.src = this.origin + path;
      $("body").append($(this.frame).hide());
      this.win = this.frame.contentWindow;
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
        return _this.win.postMessage({
          id: id,
          payload: payload
        }, _this.origin);
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
          return console.log(e.toString());
        }
      }, 500);
    };

    return Frame;

  })();

  AjaxCall = (function() {

    AjaxCall.prototype.frames = {};

    AjaxCall.prototype.proxies = {};

    function AjaxCall(ajaxOpts, xOpts) {
      var proxyPath,
        _this = this;
      this.ajaxOpts = ajaxOpts;
      if (xOpts == null) {
        xOpts = {};
      }
      if (!ajaxOpts) {
        throw "ajax options required";
      }
      if (!ajaxOpts.url) {
        throw "url required";
      }
      this.url = ajaxOpts.url;
      this.origin = parseUrl(this.url).origin;
      if (!this.origin) {
        throw "invalid url";
      }
      proxyPath = origins[this.origin];
      if (!proxyPath) {
        throw "missing origin: " + this.origin;
      }
      this.opts = inherit(this.defaults, xOpts);
      this.frame = new Frame(this.origin, proxyPath);
      this.d = $.Deferred();
      this.frame.send(this.ajaxOpts, function(result) {
        return _this.d.resolve(result);
      });
      this.d.promise();
    }

    return AjaxCall;

  })();

  $.xdomain = function(o) {
    return $.extend(origins, o);
  };

  $.xdomain.ajax = function(ajaxOpts, xOpts) {
    var ajax;
    ajax = new AjaxCall(ajaxOpts, xOpts);
    return ajax.d;
  };

}).call(this);

}(window,document));
/** XDomain - v0.0.1 - 2013/04/09
 * 
 * Copyright (c) 2013 Jaime Pillora - MIT
 */

(function(window,document,undefined) {
(function() {
  'use strict';

  var AjaxCall, guid, inherit, log, makeIFrame, parseUrl, windows;

  log = function(msg) {
    if (!(console && console['log'])) {
      return;
    }
    return console.log('xdomain', window.location.host, ': ', msg);
  };

  log("init client");

  windows = {};

  makeIFrame = function(origin, remoteProxy, returnProxy) {
    var frame, id, remote, win;
    if (windows[origin]) {
      return windows[origin];
    }
    frame = document.createElement("iframe");
    id = guid();
    frame.id = id;
    frame.name = id;
    remote = origin + remoteProxy;
    frame.src = remote;
    win = frame.contentWindow;
    $("body").append(frame);
    windows[origin] = win;
    return win;
  };

  $(window).on('message', function(event) {
    var id, req, xdomain;
    xdomain = event.data;
    id = xdomain.id;
    req = $.ajax(xdomain.ajax);
    return req.always(function() {
      var result;
      result = {
        id: id,
        args: arguments
      };
      return event.source.postMessage(result, e.origin);
    });
  });

  AjaxCall = (function() {

    AjaxCall.prototype.frames = {};

    AjaxCall.prototype.proxies = {};

    AjaxCall.prototype.defaults = {
      localProxy: '/xdomain/example/proxy.html',
      remoteProxy: '/xdomain/example/proxy.html'
    };

    function AjaxCall(ajaxOpts, xOpts) {
      var d, gotResult, id, t;
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
      this.opts = inherit(this.defaults, xOpts);
      this.proxy = makeIFrame(this.opts.localProxy, this.opts.remoteProxy, this.origin);
      d = $.Deferred();
      id = guid();
      t = setInterval(function() {
        try {
          this.proxy.postMessage({
            id: id,
            ajax: this.ajaxOpts
          });
        } catch (e) {
          return;
        }
        return clearInterval(t);
      }, 50);
      gotResult = function(e) {
        log("got result");
        d.resolve();
        return $(window).off('message', gotResult);
      };
      $(window).on('message', gotResult);
      this.d = d.promise();
    }

    return AjaxCall;

  })();

  $.xdomain = function(xOpts) {
    return $.extend(AjaxCall.prototype.defaults, xOpts);
  };

  $.xdomain.ajax = function(ajaxOpts, xOpts) {
    var x;
    x = new AjaxCall(ajaxOpts, xOpts);
    return x.d;
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

}).call(this);

}(window,document));
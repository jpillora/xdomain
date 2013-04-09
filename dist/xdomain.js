/** XDomain - v0.0.1 - 2013/04/09
 * 
 * Copyright (c) 2013 Jaime Pillora - MIT
 */

(function(window,document,undefined) {
(function() {
  'use strict';

  var AjaxCall, frames, guid, inherit, log, makeProxy, parseUrl, proxies;

  log = function(msg) {
    if (!(console && console['log'])) {
      return;
    }
    return console.log('xdomain', window.location.host, ': ', msg);
  };

  log("init");

  frames = {};

  proxies = {};

  makeProxy = function(returnProxy, remoteProxy, origin) {
    var frame, id, local, remote;
    if (proxies[origin]) {
      return proxies[origin];
    }
    frame = document.createElement("iframe");
    id = guid();
    frame.id = id;
    frame.name = id;
    remote = origin + remoteProxy;
    local = returnProxy ? window.location.origin + returnProxy : '';
    frame.src = remote + "#" + local;
    frames[origin] = frame;
    $("body").append(frame);
    proxies[origin] = proxy;
    return proxy;
  };

  AjaxCall = (function() {

    AjaxCall.prototype.frames = {};

    AjaxCall.prototype.proxies = {};

    AjaxCall.prototype.defaults = {
      localProxy: '/xdomain/example/proxy.html',
      remoteProxy: '/xdomain/example/proxy.html'
    };

    function AjaxCall(ajaxOpts, xOpts) {
      var _this = this;
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
      this.proxy = makeProxy(this.opts.localProxy, this.opts.remoteProxy, this.origin);
      this.run();
      setTimeout(function() {
        log("fire!");
        return _this.proxy.post("test");
      }, 2000);
    }

    AjaxCall.prototype.run = function() {
      var d;
      d = $.Deferred();
      return this.d = d.promise();
    };

    return AjaxCall;

  })();

  $(document).ready(function() {
    var hash, origin, path, proxy, _ref;
    Porthole.WindowProxyDispatcher.start();
    hash = window.location.hash.substr(1);
    if (!hash) {
      return;
    }
    _ref = parseUrl(hash), origin = _ref.origin, path = _ref.path;
    proxy = makeProxy(null, path, origin);
    proxy.addEventListener(function(a, b, c, d) {
      return console.log(arguments);
    });
    return setTimeout(function() {
      log("fire!");
      return proxy.post("test");
    }, 2000);
  });

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
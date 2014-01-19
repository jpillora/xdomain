// XHook - v1.0.6 - https://github.com/jpillora/xhook
// Jaime Pillora <dev@jpillora.com> - MIT Copyright 2013
(function(window,document,undefined) {
var AFTER, BEFORE, EventEmitter, INVALID_PARAMS_ERROR, READY_STATE, XMLHttpRequest, convertHeaders, pluginEvents, xhook, _base,
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

XMLHttpRequest = window.XMLHttpRequest;

window.XMLHttpRequest = function() {
  var checkEvent, copyBody, copyHead, currentState, event, extractProps, facade, facadeEventEmitter, makeFakeEvent, readyBody, readyHead, request, response, setReadyState, transiting, xhr, _i, _len, _ref;
  xhr = new XMLHttpRequest;
  if (pluginEvents.listeners(BEFORE).length === 0 && pluginEvents.listeners(AFTER).length === 0) {
    return xhr;
  }
  transiting = false;
  request = {
    headers: {}
  };
  response = null;
  facadeEventEmitter = EventEmitter();
  readyHead = function() {
    facade.status = response.status;
    facade.statusText = response.statusText;
    response.headers || (response.headers = {});
  };
  readyBody = function() {
    facade.responseType = response.type || '';
    facade.response = response.data || response.text || null;
    facade.responseText = response.text || response.data || '';
    facade.responseXML = response.xml || null;
  };
  copyHead = function() {
    var key, val, _ref, _results;
    response.status = xhr.status;
    response.statusText = xhr.statusText;
    _ref = convertHeaders(xhr.getAllResponseHeaders());
    _results = [];
    for (key in _ref) {
      val = _ref[key];
      if (!response.headers[key]) {
        _results.push(response.headers[key] = val);
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  };
  copyBody = function() {
    response.type = xhr.responseType;
    response.text = xhr.responseText;
    response.data = xhr.response || response.text;
    return response.xml = xhr.responseXML;
  };
  currentState = 0;
  setReadyState = function(n) {
    var checkReadyState, hooks, process;
    extractProps();
    checkReadyState = function() {
      while (n > currentState && currentState < 4) {
        facade[READY_STATE] = ++currentState;
        if (currentState === 2) {
          readyHead();
        }
        if (currentState === 4) {
          readyBody();
        }
        facadeEventEmitter.fire("readystatechange", makeFakeEvent("readystatechange"));
        if (currentState === 4) {
          facadeEventEmitter.fire("load", makeFakeEvent("load"));
          facadeEventEmitter.fire("loadend", makeFakeEvent("loadend"));
        }
      }
    };
    if (n < 4) {
      return checkReadyState();
    }
    hooks = pluginEvents.listeners(AFTER);
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
      } else {
        throw INVALID_PARAMS_ERROR;
      }
    };
    process();
  };
  makeFakeEvent = function(type) {
    var msieEventObject;
    if (window.document.createEventObject != null) {
      msieEventObject = window.document.createEventObject();
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
  checkEvent = function(e) {
    var clone, key, val;
    clone = {};
    for (key in e) {
      val = e[key];
      clone[key] = val === xhr ? facade : val;
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
    for (key in facade) {
      fn = facade[key];
      if (typeof fn === 'function' && /^on(\w+)/.test(key)) {
        facadeEventEmitter.on(RegExp.$1, fn);
      }
    }
  };
  xhr.onreadystatechange = function(event) {
    try {
      if (xhr[READY_STATE] === 2) {
        copyHead();
        setReadyState(2);
      }
    } catch (_error) {}
    if (xhr[READY_STATE] === 4) {
      transiting = false;
      copyHead();
      copyBody();
      setReadyState(4);
    }
  };
  _ref = ['abort', 'progress'];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    event = _ref[_i];
    xhr["on" + event] = function(obj) {
      return facadeEventEmitter.fire(event, checkEvent(obj));
    };
  }
  facade = {
    withCredentials: false,
    response: null,
    status: 0
  };
  facade.addEventListener = function(event, fn) {
    return facadeEventEmitter.on(event, fn);
  };
  facade.removeEventListener = facadeEventEmitter.off;
  facade.dispatchEvent = function() {};
  facade.open = function(method, url, async) {
    request.method = method;
    request.url = url;
    request.async = async;
    setReadyState(1);
  };
  facade.send = function(body) {
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
  facade.abort = function() {
    if (transiting) {
      xhr.abort();
    }
    facadeEventEmitter.fire('abort', arguments);
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
  return facade;
};

window.xhook = xhook;
}(window,document));

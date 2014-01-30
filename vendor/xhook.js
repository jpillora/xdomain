// XHook - v1.1.2 - https://github.com/jpillora/xhook
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
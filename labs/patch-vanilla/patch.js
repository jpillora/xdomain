(function() {

  var consts = ["UNSENT", "OPENED", "HEADERS_RECEIVED", "LOADING", "DONE"];
  var fns = ["open", "setRequestHeader", "send", "abort", "getAllResponseHeaders", "getResponseHeader", "overrideMimeType", "addEventListener", "removeEventListener", "dispatchEvent"];
  var events = ["onreadystatechange", "onprogress", "onloadstart", "onloadend", "onload", "onerror", "onabort"];
  var status = ["statusText", "status", "response", "responseType", "responseXML", "responseText", "upload", "readyState", "withCredentials"];

  var patchXhr = function(xhr, Class) {

    //init 'withCredentials' on object so jQuery thinks we have CORS
    var x = { withCredentials:false }, i,
        req = { headers:{} },
        res = { headers:{} };

    var copyStatus = function() {
      try {
        for(var i in status)
          x[status[i]] = status[i] === 'responseText' ? xhr[status[i]].replace(/[aeiou]/g,'z') : xhr[status[i]];
      } catch(e) {}
    };

    //send method calls TO xhr
    var copyFn = function(key) {
      x[key] = function() {
        switch(key) {
          case "send":
            req.data = arguments[0];
            break;
          case "open":
            req.method = arguments[0];
            req.url = arguments[1];
            req.async = arguments[2];
            break;
          case "setRequestHeader":
            req.headers[arguments[0]] = arguments[1];
            break;
        }

        if(xhr[key]) xhr[key].apply(xhr, arguments);
      };
    };
    for(i in fns) copyFn(fns[i]);

    //recieve event calls FROM xhr
    var proxyEvent = function(key) {
      xhr[key] = function() {
        copyStatus();
        if(x[key] && xhr.readyState === 4) console.log(req);
        if(x[key]) x[key].apply(x, arguments);
      };
    };
    for(i in events) proxyEvent(events[i]);

    return x;
  };

  var patchClass = function(name) {
    var Class = window[name];
    if(!Class) return;
    window[name] = function(arg) {
      if(typeof arg === 'string' &&
         !/\.XMLHTTP/.test(arg)) return;
      return patchXhr(new Class(arg), Class);
    };
  };

  patchClass('ActiveXObject');
  patchClass('XMLHttpRequest');

})();
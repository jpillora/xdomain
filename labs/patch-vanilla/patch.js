(function() {

  var consts = ["UNSENT", "OPENED", "HEADERS_RECEIVED", "LOADING", "DONE"];
  var fns = ["open", "setRequestHeader", "send", "abort", "getAllResponseHeaders", "getResponseHeader", "overrideMimeType", "addEventListener", "removeEventListener", "dispatchEvent"];
  var events = ["onreadystatechange", "onprogress", "onloadstart", "onloadend", "onload", "onerror", "onabort"];
  var status = ["statusText", "status", "response", "responseType", "responseXML", "responseText", "upload", "withCredentials", "readyState"];

  var patchXhr = function(xhr, Class) {

    var x = {}, i;

    var copyStatus = function() {
      try {
        for(var i in status)
          x[status[i]] = status[i] === 'responseText' ? xhr[status[i]].replace(/[aeiou]/g,'z') : xhr[status[i]];
      } catch(e) {}
    };

    //send method calls TO xhr
    var copyFn = function(key) {
      x[key] = function() {
        if(xhr[key]) xhr[key].apply(xhr, arguments);
      };
    };
    for(i in fns) copyFn(fns[i]);

    //recieve event calls FROM xhr
    var proxyEvent = function(key) {
      xhr[key] = function() {
        copyStatus();
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
         !/\.XMLHTTP$/.test(arg)) return;
      return patchXhr(new Class(arg), Class);
    };
  };

  patchClass('ActiveXObject');
  patchClass('XMLHttpRequest');

})();
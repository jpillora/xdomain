# XDomain

<a href="https://twitter.com/intent/tweet?hashtags=xdomain&original_referer=http%3A%2F%2Fgithub.com%2F&text=XDomain+-+A+pure+JavaScript+CORS+alternative&tw_p=tweetbutton&url=https%3A%2F%2Fgithub.com%2Fjpillora%2Fxdomain" target="_blank">
  <img src="http://jpillora.com/github-twitter-button/img/tweet.png"></img>
</a>

## Summary

A pure JavaScript CORS alternative/polyfill. No server configuration required - 
just add a `proxy.html` on the domain you wish to communicate with. This
library utilizes [XHook](http://jpillora.com/xhook) to hook all XHR, so XDomain should work in
conjunction with any library.

## Features

* Simple
* Library Agnostic
  * Tested with [jQuery](http://jpillora.com/xdomain)  `$.ajax` (and subsequently `$.get`, `$.post`)
  * Tested with [Angular](http://jpillora.com/xdomain/example/angular) `$http` service
* Cross domain XHR just magically works
  * No need to modify the server code
  * No need to use IE's silly [XDomainRequest Object](http://msdn.microsoft.com/en-us/library/ie/cc288060.aspx)
* Easy XHR access to file servers:
  * [Amazon](http://jpillora.com/xdomain)
  * [Dropbox](http://jpillora.com/xdomain/example/dropbox)
* Includes [XHook](http://jpillora.com/xhook) and its [features](https://github.com/jpillora/xhook#features)
* `proxy.html` files (slaves) may:
  * White-list domains
  * White-list paths using regular expressions (e.g. only allow API calls: `/^\/api/`)
* Highly [performant](http://jpillora.com/xdomain/example/performance/)
* Seamless integration with [FormData](http://jpillora.com/xdomain/example/formdata/)

## Download

* Development [xdomain.js](https://cdn.rawgit.com/jpillora/xdomain/gh-pages/dist/0.6/xdomain.js) 25KB
* Production [xdomain.min.js](https://cdn.rawgit.com/jpillora/xdomain/gh-pages/dist/0.6/xdomain.min.js) 12KB (2.8KB Gzip)

## Live Demos

* [Simple GET from S3](http://jpillora.com/xdomain) 

* [XHR from file:// or data://](http://jpillora.com/xdomain/example/file/data-uri.html) 

* [Serverless S3 Client](http://jpillora.com/s3hook)

## Browser Support

All except IE6/7 as they don't have `postMessage`

[![Build Status](https://travis-ci.org/jpillora/xdomain.png)](https://travis-ci.org/jpillora/xdomain)

[![Selenium Test Status](https://saucelabs.com/browser-matrix/jpillora-xdomain.svg)](https://saucelabs.com/u/jpillora-xdomain)

## Quick Usage

Note: It's **important** to include XDomain before any other library.
When XDomain loads, XHook replaces the current `window.XMLHttpRequest`.
So if another library saves a reference to the original `window.XMLHttpRequest`
and uses that, XHook won't be able to intercept those requests.

1. On your slave domain (`http://xyz.example.com`), create a small `proxy.html` file:
  
    ``` html
    <!DOCTYPE HTML>
    <script src="http://jpillora.com/xdomain/dist/0.6/xdomain.min.js" master="http://abc.example.com"></script>
    ```

2. Then, on your master domain (`http://abc.example.com`), point to your new `proxy.html`:

    ``` html
    <script src="http://jpillora.com/xdomain/dist/0.6/xdomain.min.js" slave="http://xyz.example.com/proxy.html"></script>
    ```

3. **And that's it!** Now, on your master domain, any XHR to `http://xyz.example.com` will automagically work: 

    ``` js
    //do some vanilla XHR
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://xyz.example.com/secret/file.txt');
    xhr.onreadystatechange = function(e) {
      if(xhr.readyState === 4)
        alert(xhr.responseText);
    };
    xhr.send();

    //or if we are using jQuery...
    $.get('http://xyz.example.com/secret/file.txt').done(function(data) {
      console.log("got result: ", data);
    });
    ```

*Tip: If you enjoy being standards compliant, you can also use `data-master` and `data-slave` attributes.*

### Using multiple masters and slaves

  The following two snippets are equivalent:

  ``` html
  <script src="http://jpillora.com/xdomain/dist/0.6/xdomain.min.js" master="http://abc.example.com/api/*"></script>
  ```

  ``` html
  <script src="http://jpillora.com/xdomain/dist/0.6/xdomain.min.js"></script>
  <script>
  xdomain.masters({
    'http://abc.example.com': '/api/*'
  });
  </script>
  ```

  So, we can then add more `masters` or (`slaves`) by simply including them
  in the `object`, see API below.

## API

### `xdomain.slaves`(`slaves`)

  Will initialize as a master
  
  Each of the `slaves` must be defined as: `origin`: `proxy file`
  
  The `slaves` object is used as a *list* slaves to force one proxy file per origin.

  The **Quick Usage** step 2 above is equivalent to:
  ```html
  <script src="http://jpillora.com/xdomain/dist/0.6/xdomain.min.js"></script>
  <script>
    xdomain.slaves({
      "http://xyz.example.com": "/proxy.html"
    });
  </script>
  ```

### `xdomain.masters`(`masters`)

  Will initialize as a master
  
  Each of the `masters` must be defined as: `origin`: `path`

  `origin` and `path` are converted to a regular expression by escaping all
  non-alphanumeric chars, then converting `*` into `.*` and finally wrapping it
  with `^` and `$`. `path` can also be a `RegExp` literal.
  
  Requests that do not match **both** the `origin` and the `path` regular
  expressions will be blocked.

  So you could use the following `proxy.html` to allow all subdomains of `example.com`:
  
  ```html
  <script src="/dist/0.6/xdomain.min.js" data-master="http://*.example.com/api/*.json"></script>
  ```
  
  Which is equivalent to:
  ```html
  <script src="/dist/0.6/xdomain.min.js"></script>
  <script>
    xdomain.masters({
      "http://*.example.com": "/api/*.json"
    });
  </script>
  ```

  Where `"/api/*.json"` becomes the RegExp `/^\/api\/.*\.json$/`
  
  Therefore, you could allow ALL domains with the following `proxy.html`:
  ```html
  <!-- BEWARE: VERY INSECURE -->
  <script src="/dist/0.6/xdomain.min.js" master="*"></script>
  ```

### `xdomain.debug` = `false`

  When `true`, XDomain will log actions to console

## Conceptual Overview

1. XDomain will create an iframe on the master to the slave's proxy.
2. Master will communicate to slave iframe using postMessage.
3. Slave will create XHRs on behalf of master then return the results.

XHR interception is done seemlessly via [XHook](https://github.com/jpillora/xhook#overview).

## FAQ

Q: But I love CORS

A: You shouldn't. You should use XDomain because:

* IE uses a different API (XDomainRequest) for CORS, XDomain normalizes this silliness. XDomainRequest also has many restrictions:
    * Requests must be `GET` or `POST`
    * Requests must must use the same protocol as the page `http` -> `http`
    * Requests only emit `progress`,`timeout` and `error`
    * Requests may only use the `Content-Type` header
* The [CORS spec](http://www.w3.org/TR/cors/) is not as simple as it seems, XDomain allows you to use plain XHR instead.
* On RESTful JSON API server, CORS will generating superfluous traffic by sending a
  preflight OPTIONS request on all requests, except for GET and HEAD.
* Not everyone is able to modify HTTP headers on the server, but most can upload a `proxy.html` file.
* Google also uses iframes as postMessage proxies instead of CORS in it's Google API JS SDK:

  ```html
  <iframe name="oauth2relay564752183" id="oauth2relay564752183"
  src="https://accounts.google.com/o/oauth2/postmessageRelay?..."> </iframe>
  ```

## Internet Explorer

Use the HTML5 document type `<!DOCTYPE HTML>` to prevent your page
from going into quirks mode. If you don't do this, XDomain will warn you about
the missing `JSON` and/or `postMessage` globals and will exit.

If you need CORS and you're here because of IE, give this XHook [CORS polyfill](http://jpillora.com/xhook/example/ie-8-9-cors-polyfill.html) a try, however, be mindful of the restrictions listed above.

## Troubleshooting

Q: In IE, I'm getting an `Access Denied` error

A: This is error occurs when IE attempts CORS request. Read on.

Q: The browser is still sending a CORS request.

A: Double check your slaves configuration against the examples.
If your slaves configuration is correct, double check that you're
including XDomain *before* `window.XMLHttpRequest` is referenced **anywhere**.
The safest way to fix it is to include XDomain **first**, it has no dependancies,
it only modifies `window.XMLHttpRequest`.

Q: It's still not working!

A: Enable `xdomain.debug = true;` and copy the `console.logs` to a new issue

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md) for instructions on how to build and run XDomain locally.

## Change Log

v0.6.9 - Update XHook to 1.1.10 to support case insensitive header access
         using `getResponseHeader`.

v0.6.8 - Implements FormData

v0.6.0 - Implements XHR2 functionality

v0.6.0 - Upgraded to XHook v1.

v0.4.0 - Now setting request body, duh.

v0.3.0 - Moved to vanilla, using XHook to hook XHR instead of `$.ajax`

v0.2.0 - Removed PortHole, using pure postMessage, IE6/7 NOT supported

v0.1.0 - Alpha

#### Donate

BTC 1AxEWoz121JSC3rV8e9MkaN9GAc5Jxvs4

#### MIT License

Copyright © 2014 Jaime Pillora &lt;dev@jpillora.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[![Analytics](https://ga-beacon.appspot.com/UA-38709761-8/xdomain/readme)](https://github.com/igrigorik/ga-beacon)

# XDomain

<a href="https://twitter.com/intent/tweet?hashtags=xdomain&original_referer=http%3A%2F%2Fgithub.com%2F&text=XDomain+-+A+pure+JavaScript+CORS+alternative&tw_p=tweetbutton&url=https%3A%2F%2Fgithub.com%2Fjpillora%2Fxdomain" target="_blank">
  <img src="http://jpillora.com/github-twitter-button/img/tweet.png"></img>
</a>

## Summary

A pure JavaScript CORS alternative. No server configuration required -
just add a `proxy.html` on the domain you wish to communicate with. This
library utilizes [XHook](http://jpillora.com/xhook) to hook all XHR, so XDomain
will work seamlessly with any library.

## Features

* Simple
* Library Agnostic
  * With [jQuery](http://jpillora.com/xdomain) `$.ajax` (and subsequently `$.get`, `$.post`)
  * With [Angular](http://jpillora.com/xdomain/example/angular) `$http` service
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
* Supports [RequiresJS](http://jpillora.com/xdomain/example/requirejs) and [Browserify](http://jpillora.com/xdomain/example/browserify)

## Download

* Development [xdomain.js](https://jpillora.com/xdomain/dist/xdomain.js) 27KB
* Production [xdomain.min.js](https://jpillora.com/xdomain/dist/xdomain.min.js) 12KB (5.16KB Gzip)
* CDN (Latest version is `0.8.2`, though you can change to any [release tag](https://github.com/jpillora/xdomain/releases))

  ```html
  <script src="//unpkg.com/xdomain@0.8.2/dist/xdomain.min.js"></script>
  ```

## Live Demos

* [Simple GET from S3](http://jpillora.com/xdomain)

* [Serverless S3 Client](http://jpillora.com/s3hook)

## Browser Support

All except IE6/7 as they don't have `postMessage`

## Quick Usage

_Note: It's_ **important** _to include XDomain before any other library. When XDomain loads, XHook replaces the current `window.XMLHttpRequest`. So if another library saves a reference to the original `window.XMLHttpRequest` and uses that, XHook won't be able to intercept those requests._

1.  On your slave domain (`http://xyz.example.com`), create a small `proxy.html` file:

    ```html
    <!DOCTYPE HTML>
    <script src="//unpkg.com/xdomain@0.8.2/dist/xdomain.min.js" master="http://abc.example.com"></script>
    ```

2.  Then, on your master domain (`http://abc.example.com`), point to your new `proxy.html`:

    ```html
    <script src="//unpkg.com/xdomain@0.8.2/dist/xdomain.min.js" slave="http://xyz.example.com/proxy.html"></script>
    ```

3.  **And that's it!** Now, on your master domain, any XHR to `http://xyz.example.com` will automagically work:

    ```js
    //do some vanilla XHR
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://xyz.example.com/secret/file.txt");
    xhr.onreadystatechange = function(e) {
      if (xhr.readyState === 4) console.log("got result: ", xhr.responseText);
    };
    xhr.send();

    //or if we are using jQuery...
    $.get("http://xyz.example.com/secret/file.txt").done(function(data) {
      console.log("got result: ", data);
    });
    ```

_Tip: If you enjoy being standards compliant, you can also use `data-master` and `data-slave` attributes._

### Using multiple masters and slaves

The following two snippets are equivalent:

```html
<script src="//unpkg.com/xdomain@0.8.2/dist/xdomain.min.js" master="http://abc.example.com/api/*"></script>
```

```html
<script src="//unpkg.com/xdomain@0.8.2/dist/xdomain.min.js"></script>
<script>
xdomain.masters({
  'http://abc.example.com': '/api/*'
});
</script>
```

So, we can then add more `masters` or (`slaves`) by simply including them in the `object`, see API below.

## API

### `xdomain.slaves`(`slaves`)

Will initialize as a master

Each of the `slaves` must be defined as: `origin`: `proxy file`

The `slaves` object is used as a _list_ slaves to force one proxy file per origin.

The **Quick Usage** step 2 above is equivalent to:

```html
<script src="//unpkg.com/xdomain@0.8.2/dist/xdomain.min.js"></script>
<script>
  xdomain.slaves({
    "http://xyz.example.com": "/proxy.html"
  });
</script>
```

### `xdomain.masters`(`masters`)

Will initialize as a slave

Each of the `masters` must be defined as: `origin`: `path`

`origin` and `path` are converted to a regular expression by escaping all non-alphanumeric chars, then converting `*` into `.*` and finally wrapping it with `^` and `$`. `path` can also be a `RegExp` literal.

Requests that do not match **both** the `origin` and the `path` regular
expressions will be blocked.

So you could use the following `proxy.html` to allow all subdomains of `example.com`:

```html
<script src="/dist/xdomain.min.js" data-master="http://*.example.com/api/*.json"></script>
```

Which is equivalent to:

```html
<script src="/dist/xdomain.min.js"></script>
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
<script src="/dist/xdomain.min.js" master="*"></script>
```

### `xdomain.debug` = `false`

When `true`, XDomain will log actions to console

### `xdomain.timeout` = `15e3`ms (15 seconds)

Number of milliseconds until XDomains gives up waiting for an iframe to respond

### `xdomain.on`(`event`, `handler`)

`event` may be `log`, `warn` or `timeout`. When listening for `log` and `warn` events, `handler` with contain the `message` as the first parameter. The `timeout` event fires when an iframe exeeds the `xdomain.timeout` time limit.

### `xdomain.cookies`

**WARNING** :warning: Chrome and possibly other browsers appear to be blocking access to the iframe's `document.cookie` property. This means `Slave-Cookie`s are no longer supported in some browsers.

When `withCredentials` is set to `true` for a given request, the cookies of the master and slave are sent to the server using these names. If one is set to `null`, it will not be sent.

```js
//defaults
xdomain.cookies = {
  master: "Master-Cookie"
  slave: "Slave-Cookie"
};
```

_Note, if you use `"Cookie"` as your cookie name, it will be removed by browsers with `Disable 3rd Party Cookies` switched on - this includes all Safari users and many others who purposefully enable it._

## Conceptual Overview

1.  XDomain will create an iframe on the master to the slave's proxy.
2.  Master will communicate to slave iframe using postMessage.
3.  Slave will create XHRs on behalf of master then return the results.

XHR interception is done seamlessly via [XHook](https://github.com/jpillora/xhook#overview).

## Internet Explorer

Use the HTML5 document type `<!DOCTYPE HTML>` to prevent your page
from going into quirks mode. If you don't do this, XDomain will warn you about
the missing `JSON` and/or `postMessage` globals and will exit.

If you need a **CORS Polyfill** and you're here because of IE, give this XHook [CORS polyfill](http://jpillora.com/xhook/example/ie-8-9-cors-polyfill.html) a try, however, be mindful of the restrictions listed below.

## FAQ / Troubleshooting

Q: But I love CORS

A: You shouldn't. You should use XDomain because:

* IE uses a different API (XDomainRequest) for CORS, XDomain normalizes this silliness. XDomainRequest also has many restrictions:
  * Requests must be `GET` or `POST`
  * Requests must use the same protocol as the page `http` -> `http`
  * Requests only emit `progress`,`timeout` and `error`
  * Requests may only use the `Content-Type` header
* The [CORS spec](http://www.w3.org/TR/cors/) is not as simple as it seems, XDomain allows you to use plain XHR instead.
* On a RESTful JSON API server, CORS will generate superfluous traffic by sending a
  preflight OPTIONS request preceding various types of requests.
* Not everyone is able to modify HTTP headers on the server, but most can upload a `proxy.html` file.
* Google also uses iframes as postMessage proxies instead of CORS in its Google API JS SDK:

  ```html
  <iframe name="oauth2relay564752183" id="oauth2relay564752183"
  src="https://accounts.google.com/o/oauth2/postmessageRelay?..."> </iframe>
  ```

Q: XDomain is interfering with another library!

A: XDomain attempts to perfectly implement [XMLHttpRequest2](http://www.w3.org/TR/XMLHttpRequest2/)
so there _should_ be no differences. If there is a difference, create an issue. Note however, one purposeful
difference affects some libraries under IE. Many use the presence of `'withCredentials' in new XMLHttpRequest()`
to determine if the browser supports CORS.

The most notable library that does this is jQuery, so [XHook](https://github.com/jpillora/xhook) purposefully defines `withCredentials` to trick jQuery into thinking the browser supports
CORS, thereby allowing XDomain to function seamlessly in IE. However, this fix is detrimental to
other libraries like: MixPanel, FB SDK, Intercom as they will incorrectly attempt CORS on domains
which don't have a `proxy.html`. So, if you are using any of these libraries which implement their own CORS workarounds, you can do the
following to manually disable defining `withCredentials` and manually reenable CORS on jQuery:

```js
//fix trackers
xhook.addWithCredentials = false;
//fix jquery cors
jQuery.support.cors = true;
```

Note: In newer browsers `xhook.addWithCredentials` has no effect as they already support `withCredentials`.

Q: XDomain works for a few requests and then it stops.

A: Most likely, the slave iframe was removed - this is often due to libraries like Turbolinks

Q: In IE, I'm getting an `Access Denied` error

A: This is error occurs when IE attempts a CORS request. Read on.

Q: The browser is still sending CORS requests.

A: Double check your slaves configuration against the examples.
If your slaves configuration is correct, double-check that you're
including XDomain _before_ `window.XMLHttpRequest` is referenced **anywhere**.
The safest way to fix it is to include XDomain **first**, it has no dependencies,
it only modifies `window.XMLHttpRequest`.

Q: The script is loads but the 'Quick Start' steps don't work

A: XDomain only searches the script tags for `master` and `slave` attributes if they have `xdomain` in the `src`. So, if you've renamed or embedded XDomain, you'll need to use the [API](#api) in order to insert your masters and slaves.

Q: It's still not working!

A: Enable `xdomain.debug = true;` (or add a `debug="true"` attribute to the script tag) on both the master and the slave
and copy the `console.logs` to a new issue. If possible, please provide a live example demonstrating your issue.

## Change log

* `0.8.2`

  * Removed CoffeeScript
  * Restructured with ES6 and Common.js
  * Use `parcel` as bundler

## Todo

* Saucelabs testing is broken, need to swap to BrowserStack.

## Contributing

* `npm install`
* Tab 1
  * `npm run dev`
* Tab 2
  * `npm i -g serve`
  * `serve -p 3000 .`
  * `open http://localhost:3000/example/local`
* `npm run build`
* See `dist/`

#### Donate

BTC 1AxEWoz121JSC3rV8e9MkaN9GAc5Jxvs4

#### MIT License

Copyright © 2016 Jaime Pillora &lt;dev@jpillora.com&gt;

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

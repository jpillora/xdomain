# XDomain

<a href="https://twitter.com/intent/tweet?hashtags=xdomain&original_referer=http%3A%2F%2Fgithub.com%2F&text=XDomain+-+A+cross-browser+CORS+alternative&tw_p=tweetbutton&url=https%3A%2F%2Fgithub.com%2Fjpillora%2Fxdomain" target="_blank">
  <img src="http://jpillora.com/github-twitter-button/img/tweet.png"></img>
</a>

## Summary

A pure JavaScript CORS alternative. No server configuration required - 
just add a `proxy.html` on the domain you wish to communicate with. This
library utilizes [XHook](http://jpillora.com/xhook) to hook all XHR, so XDomain should work in
conjunction with any library.

## Features

* Simple
* Cross domain `XMLHttpRequest` will work magically
  * Tested with jQuery `$.ajax` (and subsequently `$.get`, `$.post`)
  * Tested with Angular `$http` service
* White-list allowed domains
* White-list paths using regular expressions (e.g. only allow API calls: `/^\/api/`)

## Download

* Development [xdomain.js](http://xdomain.jpillora.com/dist/xdomain.js) X KB
* Production [xdomain.min.js](http://xdomain.jpillora.com/dist/xdomain..minjs) XKB (XKB Gzip)

* Note: It's **important** to include XDomain first as other libraries may
  store a reference to `XMLHttpRequest` before XHook can patch it*

## Browser Support

* All except IE6/7 as they don't have `postMessage`

## Usage

On your slave domain (`http://xyz.example.com`), create a `proxy.html` file which looks like:
  
``` html
<script src="http://xdomain.jpillora.com/dist/xdomain.js" masters="http://abc.example.com"></script>
```

Which is actually shorthand for:

``` html
<html>
<body>
  <!-- XDomain -->
  <script src="http://xdomain.jpillora.com/dist/xdomain.js"></script>
  <!-- XDomain Whitelist - { Domain: Allow Path RegExp } -->
  <script>
  $.xdomain({
    masters: {
      'http://abc.example.com': /.*/
    }
  });
  </script>
</body>
</html>
```

Then on your master domain (`http://abc.example.com`), define all slaves:

``` javascript
//add the slave and the path to its proxy
$.xdomain({
  slaves: {
    'http://xyz.example.com': '/proxy.html'
  }
});

//... then after, if we are using jQuery ...

//all requests to 'xyz.example.com' will magically work
$.get('http://xyz.example.com/secret/data.json').done(function(data) {
    console.log("got result: ", data);
});

//$.ajax(...)

//$.post(...)

```

Demo
---

### http://xdomain.jpillora.com/

API
---

## `xdomain`(`object`)

If object contains:

### `slaves`

Then `xdomain` will load as a master

Each slave must be defined as: `slave domain` -> `path to proxy file` 

### `masters`

Then `xdomain` will load as a slave

Each master must be defined as: `master domain` -> `regex matching allowed paths` 

You can allow all with: `'*': /.*/` though this is not recommended.

## Conceptual Overview

1. XDomain will create an iframe on the master to the slave's proxy.
2. Master will communicate to slave iframe using postMessage.
3. Slave will create XHRs on behalf of master then return the results.

## Contributing

Issues and Pull-requests welcome.

## Change Log

v0.3.0 - Moved to vanilla, using XHook to hook XHR instead of `$.ajax`

v0.2.0 - Removed PortHole, using pure postMessage, IE6/7 NOT supported

v0.1.0 - Alpha


#### MIT License

Copyright © 2013 Jaime Pillora &lt;dev@jpillora.com&gt;

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


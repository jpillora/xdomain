# XDomain

<a href="https://twitter.com/intent/tweet?hashtags=xdomain&original_referer=http%3A%2F%2Fgithub.com%2F&text=XDomain+-+A+pure+JavaScript+CORS+alternative&tw_p=tweetbutton&url=https%3A%2F%2Fgithub.com%2Fjpillora%2Fxdomain" target="_blank">
  <img src="http://jpillora.com/github-twitter-button/img/tweet.png"></img>
</a>

## Summary

A pure JavaScript CORS alternative. No server configuration required - 
just add a `proxy.html` on the domain you wish to communicate with. This
library utilizes [XHook](http://jpillora.com/xhook) to hook all XHR, so XDomain should work in
conjunction with any library.

## Features

* Simple
* Library Agnostic
  * Tested with jQuery `$.ajax` (and subsequently `$.get`, `$.post`)
  * Tested with Angular `$http` service
* Cross domain XHR just magically works
  * No need to modify the server code
  * No need to use IE's silly [XDomainRequest Object](http://msdn.microsoft.com/en-us/library/ie/cc288060.aspx)
* White-list allowed domains
* White-list paths using regular expressions (e.g. only allow API calls: `/^\/api/`)

## Download

* Development [xdomain.js](http://xdomain.jpillora.com/dist/xdomain.js) 15.4KB
* Production [xdomain.min.js](http://xdomain.jpillora.com/dist/xdomain..minjs) 7.2KB (1.7KB Gzip)

  *Note: It's **important** to include XDomain first as other libraries may
    store a reference to `XMLHttpRequest` before XHook can patch it*

## Live Demos

### http://xdomain.jpillora.com/

## Browser Support

All except IE6/7 as they don't have `postMessage`

## Quick Usage

1. On your slave domain (`http://xyz.example.com`), create a small `proxy.html` file:
  
    ``` html
    <script src="http://xdomain.jpillora.com/dist/xdomain.js" master="http://abc.example.com"></script>
    ```

2. Then on your master domain (`http://abc.example.com`), pointing to a `proxy.html`:

    ``` html
    <script src="http://xdomain.jpillora.com/dist/xdomain.js" slave="http://xyz.example.com/proxy.html"></script>
    ```

3. Now any XHR to `http://xyz.example.com` will automagically work: 

    ``` js
    //do some vanilla XHR
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://xyz.example.com/secret/file.txt');
    xhr.onreadystatechange = function(e) {
      if(xhr.readyState === 4)
        alert(xhr.responseText);
    }
    xhr.send();

    //or if we are using jQuery...
    $.get('http://xyz.example.com/secret/file.txt').done(function(data) {
        console.log("got result: ", data);
    });
    ```

## More Examples

### Using multiple masters and slaves

The following two snippets are equivalent:

``` html
<script src="http://xdomain.jpillora.com/dist/xdomain.js" master="http://abc.example.com"></script>
```
``` html
<script src="http://xdomain.jpillora.com/dist/xdomain.js"></script>
<script>
xdomain({
  masters: {
  	'http://abc.example.com': /.*/
  }
});
</script>
```

With this in mind, we can then add more `masters` or (`slaves`) by simply including them
in the `object`, see API below.

## API

### `xdomain`(`object`)

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

## Internet Explorer

If you've set your page to use quirks mode for some reason. You won't
have `JSON` on the page, and XDomain will warn you. Easiest solution is
just to use the HTML5 DOCTYPE `<!DOCTYPE HTML>`

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


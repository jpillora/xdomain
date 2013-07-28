XDomain
=====
v0.2.0

Summary
---

A JavaScript alternative to CORS. No server configuration required - just add a `proxy.html` on the domain you wish to communicate with.

Features
---

* Simple
* Cross domain `$.ajax` (and subsequently `$.get`, `$.post`) will work magically
* White-list allowed domains
* White-list paths using regular expressions (e.g. only allow API calls: `/^\/api/`)

Downloads
---

* [Development Version](http://xdomain.jpillora.com/dist/xdomain.js)
* [Production Version](http://xdomain.jpillora.com/dist/xdomain.min.js)

```
Uncompressed size: 6.140KB.
Compressed size: 0.760KB gzipped (3.196KB minified).
```

Browser Support
---

* All except IE6/7 as they don't have `postMessage`

Usage
---

On your slave domain (`http://xyz.example.com`), create a `proxy.html` file which looks like:x
  
``` html
<!DOCTYPE HTML>
<html>
<body>
  <!-- jQuery -->
  <script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
  <!-- XDomain -->
  <script src="http://xdomain.jpillora.com/dist/xdomain.js"></script>
  <!-- XDomain Whitelist - { Domain: Path matcher } -->
  <script type="text/javascript">
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

//... after ...

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

Known Issues
---
* Functions are removed from the ajax response

API
---

## `$.xdomain`(`object`)

If object contains:

### `slaves`

Then `xdomain` will load as a master

Each slave must be defined as: `slave domain` -> `path to proxy file` 

### `masters`

Then `xdomain` will load as a slave

Each master must be defined as: `master domain` -> `regex matching allowed paths` 

Conceptual Overview
---

1. XDomain will create an iframe on the master to the slave's proxy.
2. Master will communicate to slave iframe using postMessage.
3. Slave will calls `$.ajax` on behalf of master then return the results.

Contributing
---
Issues and Pull-requests welcome.

Change Log
---

v0.2.0 - Removed PortHole, using pure postMessage, IE6/7 NOT supported

v0.1.0 - Alpha

License
---
MIT

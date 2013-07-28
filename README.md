XDomain
=====
v0.2.0

Summary
---

A JavaScript alternative to CORS. No server configuration required - just add a `proxy.html` on the domain you wish to communicate with.

A JQuery plugin for cross-domain AJAX requests via postMessage.

Once setup, `$.ajax` (and subsequently `$.get`, `$.post`) will work seemlessly.

Downloads
---

* [Development Version](http://xdomain.jpillora.com/dist/xdomain.js)
* [Production Version](http://xdomain.jpillora.com/dist/xdomain.min.js)

Browser Support
---

* All except IE6/7 as they don't have `postMessage`

Usage
---

Say you wanted to communicate from:

`http://abc.example.com` to `http://xyz.example.com`

1. On your slave domain, create a `proxy.html` file which looks like:

### File: `http://xyz.example.com/proxy.html`
  
``` html
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

2. On your master domain index file, define all slaves 

### File: `http://abc.example.com/index.html`

``` html
<html>
...
<body>
  ...
  <!-- jQuery -->
  <script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
  <!-- XDomain -->
  <script src="http://xdomain.jpillora.com/dist/xdomain.js"></script>
  <!-- XDomain Slaves - { Domain: Proxy location } -->
  <script type="text/javascript">
  $.xdomain({
    slaves: {
      'http://xyz.example.com': '/proxy.html'
    }
  });
  </script>
  <!-- Other scripts -->
  <script src="app.js"></script>
</body>
</html>
```

3. Now, jQuery Ajax requests (`$.get` `$.post` `$.ajax`) from your master domain to your slave domain will work seemlessly

### File: `http://abc.example.com/app.js`

``` javascript
$.get('http://xyz.example.com/secret/data.json').done(function(data) {
    console.log("got result: ", data);
});
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

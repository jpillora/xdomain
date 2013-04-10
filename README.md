XDomain
=====
v0.0.1

Summary
---
A JQuery plugin to do cross-domain AJAX requests via postMessage

Downloads
---

* [Development Version](http://xdomain.jpillora.com/dist/xdomain.js)
* [Production Version](http://xdomain.jpillora.com/dist/xdomain.min.js)

Usage
---

Say you wanted to communicate from:

`http://abc.example.com` to `http://xyz.example.com`

1. On your slave domain (`http://xyz.example.com`), create a `proxy.html` file which looks like:

File: `http://xyz.example.com/proxy.html`

``` html
<!-- jQuery -->
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
<!-- XDomain -->
<script src="http://xdomain.jpillora.com/dist/xdomain.js"></script>
<!-- XDomain Whitelist -->
<script type="text/javascript">
$.xdomain({
  masters: {
    'http://abc.example.com': '*'
  }
});
</script>

```

2. On your master domain (`http://abc.example.com`), definte all slaves 

File: `http://abc.example.com/index.html`
``` html
<!-- jQuery -->
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
<!-- XDomain -->
<script src="http://xdomain.jpillora.com/dist/xdomain.js"></script>
<script type="text/javascript">
$.xdomain({
  slaves: {
    'http://xyz.example.com': '/proxy.html'
  }
});
</script>

```

3. Now on your on your master domain, requests to your slave will work seemlessly

``` js
$.get('http://xyz.example.com/secret/data.json').always(function() {
  console.log("got result from '",origin,"':", arguments);
});

```

Limitations
---
* IE6/7 Not supported yet
* Function objects are removed from the response
* 

Demos
---

http://xdomain.jpillora.com/

API
---

## `$.xdomain`(`object`)

Method to white list master and slave domains

Conceptual Overview
---
XDomain will act as both a proxy client and the proxy itself. However, only specified domains will be allowed.  

Contributing
---
Issues and Pull-requests welcome.

Change Log
---

v0.0.1

* Alpha Version

License
---
MIT

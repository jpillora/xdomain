## How to run XDomain locally

* Install Node http://nodejs.org

* `npm install -g grunt-source serve`

* `git clone https://github.com/jpillora/xdomain`

* `serve`

This will create an HTTP server on 3000 outside the `xdomain` folder

* New Tab `Command+T`

* `cd xdomain`

* `grunt-source`

This will start watching `src` for changes and will then compile and minify into `dist`

* New Tab `Command+T`

* `open http://localhost:3000/xdomain/example/local`

### Issues and Pull-requests welcome.
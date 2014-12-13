## How to run locally

* Install [Node](http://nodejs.org)

* Fork and clone `git clone https://github.com/USERNAME/xdomain`

* Enter project `cd xdomain`

* Install [`grunt-source`](https://github.com/jpillora/grunt-source) with `npm install -g grunt-source` (Grunt Source allows the use of external Grunt environments)

* `grunt-source --server=3000` with optional `--livereload=true` and `--report=true`

* Open Chrome `open http://localhost:3000/example/local`

* Grunt will now be watch *src* for changes, then compiling, concating and minifying into *dist*

  ### Issues and Pull-requests welcome!
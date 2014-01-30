//NOT IMPLEMENTED

//=================================
//PROTOTYPE API

//MASTER DOMAIN
xdomain.slaves({
  'slave.example.com': '/proxy.html'
});


xdomain.expose({
  foo: function(bar) {
    console.log("master says", bar);
  }
});

//SLAVE DOMAIN
xdomain.master.foo(42);



//=================================
//PROTOTYPE API

//MASTER DOMAIN
xdomain.slaves({
  'slave.example.com': '/proxy.html'
});

xdomain.slave('slave.example.com', function(slave){
  slave.foo(42);
});

//SLAVE DOMAIN
xdomain.masters({
  'master.example.com': '.*'
});

xdomain.expose({
  foo: function(bar) {
    console.log("slave says", bar);
  }
});


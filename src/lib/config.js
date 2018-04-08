const config = o => {
  if (o) {
    if (o.masters) {
      config.masters(o.masters);
    }
    if (o.slaves) {
      config.slaves(o.slaves);
    }
  }
};

//default config
config.debug = false;
config.timeout = 15e3;
config.cookies = {
  master: "Master-Cookie",
  slave: "Slave-Cookie"
};
//extras are also attached to config

module.exports = config;

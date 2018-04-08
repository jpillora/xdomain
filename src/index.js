"use strict";

//feature detect
const { warn } = require("./lib/util");
["postMessage", "JSON"].forEach(feature => {
  if (!window[feature]) {
    warn(`requires '${feature}' and this browser does not support it`);
  }
});

//init socket (post message mini-library)
const socket = require("./lib/socket");
socket.initialise();

//initialise script (load config from script tag)
const script = require("./lib/script");
script.initialise();

//public api
const initialise = require("./lib/config");
//config is also the primary intialise function
module.exports = initialise;

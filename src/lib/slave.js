const xhook = require("../vendor/xhook");
const config = require("./config");
const {
  log,
  warn,
  toRegExp,
  strip,
  parseUrl,
  COMPAT_VERSION
} = require("./util");

//when you add masters, this node
//enables slave listeners

let enabled = false;
let masters = {};

exports.addMasters = config => {
  //validate iframe
  if (window === window.parent) {
    warn("slaves must be in an iframe");
    return;
  }
  //enable slave handler
  if (!enabled) {
    enabled = true;
    log("now handling incoming sockets...");
    window.parent.postMessage(`XDPING_${COMPAT_VERSION}`, "*");
  }
  //white-list the provided set of masters
  for (let origin in config) {
    let path = config[origin];
    if (origin === "file://" && path !== "*") {
      warn(`file protocol only supports the * path`);
      path = "*";
    }
    log(`adding master: ${origin}`);
    masters[origin] = path;
  }
};

config.masters = exports.addMasters;

exports.handleSocket = (origin, socket) => {
  if (!enabled) {
    return;
  }
  //null means no origin can be determined,
  //this is true for file:// and data:// URIs.
  //html data:// URI are now blocked, they can
  //only be copy-and-pasted into the URL bar.
  if (origin === "null" || origin === "file:") {
    origin = "file://";
  }
  log(`handle socket for "${origin}"`);
  let pathRegex = null;
  for (let master in masters) {
    const regex = masters[master];
    try {
      const masterRegex = toRegExp(master);
      if (masterRegex.test(origin)) {
        pathRegex = toRegExp(regex);
        break;
      }
    } catch (error) {}
  }
  if (!pathRegex) {
    warn(`blocked request from: '${origin}'`);
    return;
  }
  socket.once("request", function(req) {
    log(`request: ${req.method} ${req.url}`);
    const p = parseUrl(req.url);
    if (!p || !pathRegex.test(p.path)) {
      warn(`blocked request to path: '${p.path}' by regex: ${pathRegex}`);
      socket.close();
      return;
    }
    //perform real XHR here!
    //pass results to the socket
    const xhr = new XMLHttpRequest();
    xhr.open(req.method, req.url);
    xhr.addEventListener("*", e => socket.emit("xhr-event", e.type, strip(e)));
    if (xhr.upload) {
      xhr.upload.addEventListener("*", e =>
        socket.emit("xhr-upload-event", e.type, strip(e))
      );
    }
    xhr.onreadystatechange = function() {
      if (xhr.readyState !== 4) {
        return;
      }
      //extract properties
      const resp = {
        status: xhr.status,
        statusText: xhr.statusText,
        data: xhr.response,
        headers: xhook.headers(xhr.getAllResponseHeaders())
      };
      try {
        resp.text = xhr.responseText;
      } catch (error1) {}
      // XML over postMessage not supported
      // try resp.xml = xhr.responseXML
      return socket.emit("response", resp);
    };
    //allow aborts from the facade
    socket.once("abort", () => xhr.abort());
    // document.cookie (Cookie header) can't be set inside an iframe
    // as many browsers have 3rd party cookies disabled. slaveCookie
    // contains the 'xdomain.cookie.slave' string set on the master.
    if (req.withCredentials) {
      xhr.withCredentials = true;
      if (req.slaveCookie) {
        req.headers[req.slaveCookie] = document.cookie;
      }
    }
    if (req.timeout) {
      xhr.timeout = req.timeout;
    }
    if (req.type) {
      xhr.responseType = req.type;
    }
    for (let k in req.headers) {
      const v = req.headers[k];
      xhr.setRequestHeader(k, v);
    }
    //deserialize FormData
    if (req.body instanceof Array && req.body[0] === "XD_FD") {
      const fd = new xhook.FormData();
      const entries = req.body[1];
      Array.from(entries).forEach(args => {
        //deserialize blobs from arraybuffs
        //[0:marker, 1:real-args, 2:arraybuffer, 3:type]
        if (args[0] === "XD_BLOB" && args.length === 4) {
          const blob = new Blob([args[2]], { type: args[3] });
          args = args[1];
          args[1] = blob;
        }
        fd.append.apply(fd, args);
      });
      req.body = fd;
    }
    //fire off request
    xhr.send(req.body || null);
  });
  log(`slave listening for requests on socket: ${socket.id}`);
};

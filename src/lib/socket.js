const xhook = require("../vendor/xhook");

const config = require("./config");
const { globalEmitter, log, warn, COMPAT_VERSION } = require("./util");
const { handleSocket } = require("./slave");

//constants
const CHECK_STRING = "XD_CHECK";
const CHECK_INTERVAL = 100;
//state
const sockets = {};
let jsonEncode = true;

//a 'sock' is a two-way event-emitter,
//each side listens for messages with on()
//and the other side sends messages with emit()
exports.createSocket = (id, frame) => {
  let ready = false;
  const socket = xhook.EventEmitter(true);
  sockets[id] = socket;
  socket.id = id;
  socket.once("close", function() {
    socket.destroy();
    socket.close();
  });
  const pendingEmits = [];
  socket.emit = function(...args) {
    const extra = typeof args[1] === "string" ? ` -> ${args[1]}` : "";
    log(`send socket: ${id}: ${args[0]}${extra}`);
    args.unshift(id);
    if (ready) {
      emit(args);
    } else {
      pendingEmits.push(args);
    }
  };
  var emit = function(args) {
    //convert to string when necessary
    if (jsonEncode) {
      args = JSON.stringify(args);
    }
    //send!
    frame.postMessage(args, "*");
  };

  socket.close = function() {
    socket.emit("close");
    log(`close socket: ${id}`);
    sockets[id] = null;
  };

  socket.once(CHECK_STRING, function(obj) {
    jsonEncode = typeof obj === "string";
    ready = socket.ready = true;
    socket.emit("ready");
    log(`ready socket: ${id} (emit #${pendingEmits.length} pending)`);
    while (pendingEmits.length) {
      emit(pendingEmits.shift());
    }
  });

  //start checking connectivitiy
  let checks = 0;
  var check = () => {
    // send test message NO ENCODING
    frame.postMessage([id, CHECK_STRING, {}], "*");
    if (ready) {
      return;
    }
    if (checks++ >= config.timeout / CHECK_INTERVAL) {
      warn("Timeout waiting on iframe socket");
      globalEmitter.fire("timeout");
      socket.fire("abort"); //self-emit "abort"
    } else {
      log(`check again in ${CHECK_INTERVAL}ms...`);
      setTimeout(check, CHECK_INTERVAL);
    }
  };
  setTimeout(check);

  log(`new socket: ${id}`);
  return socket;
};

//ONE WINDOW LISTENER!
//double purpose:
//  creates new sockets by passing incoming events to the 'handler'
//  passes events to existing sockets (created by connect or by the server)
exports.initialise = () => {
  const handle = e => {
    let d = e.data;
    //return if not a json string
    if (typeof d === "string") {
      //only old versions of xdomain send XPINGs...
      if (/^XDPING(_(V\d+))?$/.test(d) && RegExp.$2 !== COMPAT_VERSION) {
        return warn(
          "your master is not compatible with your slave, check your xdomain.js version"
        );
        //IE will "toString()" the array, this reverses that action
      } else if (/^xdomain-/.test(d)) {
        d = d.split(",");
        //this browser must json encode postmessages
      } else if (jsonEncode) {
        try {
          d = JSON.parse(d);
        } catch (error) {
          return;
        }
      }
    }
    //return if not an array
    if (!(d instanceof Array)) {
      return;
    }
    //return unless lead by an xdomain id
    const id = d.shift();
    if (!/^xdomain-/.test(id)) {
      return;
    }
    //finally, create/get socket
    let socket = sockets[id];
    //closed
    if (socket === null) {
      return;
    }
    //needs creation
    if (socket === undefined) {
      //send unsolicited requests to the listening server
      if (!handleSocket) {
        return;
      }
      socket = exports.createSocket(id, e.source);
      handleSocket(e.origin, socket);
    }
    const extra = typeof d[1] === "string" ? ` -> ${d[1]}` : "";
    log(`receive socket: ${id}: ${d[0]}${extra}`);
    //emit data
    socket.fire.apply(socket, d);
  };
  if (document.addEventListener) {
    return window.addEventListener("message", handle);
  } else {
    return window.attachEvent("onmessage", handle);
  }
};

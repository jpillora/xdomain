const xhook = require("../vendor/xhook");
const config = require("./config");
const {
  currentOrigin,
  log,
  warn,
  parseUrl,
  guid,
  strip,
  instOf
} = require("./util");
const socketlib = require("./socket");
const createSocket = socketlib.createSocket;

//when you add slaves, this node
//enables master listeners

let enabled = false;
let slaves = {};

exports.addSlaves = newSlaves => {
  //register master xhook handler
  if (!enabled) {
    enabled = true;
    //unless already set, add withCredentials to xhrs to trick jquery
    //in older browsers into thinking cors is allowed
    if (!("addWithCredentials" in xhook)) {
      xhook.addWithCredentials = true;
    }
    //hook XHR calls
    xhook.before(beforeXHR);
  }
  //include the provided set of slave
  for (let origin in newSlaves) {
    const path = newSlaves[origin];
    log(`adding slave: ${origin}`);
    slaves[origin] = path;
  }
};

config.slaves = exports.addSlaves;

const beforeXHR = function(request, callback) {
  //allow unless we have a slave domain
  const p = parseUrl(request.url);
  if (!p || p.origin === currentOrigin) {
    callback();
    return;
  }
  if (!slaves[p.origin]) {
    if (p) {
      log(`no slave matching: '${p.origin}'`);
    }
    callback();
    return;
  }
  log(`proxying request to slave: '${p.origin}'`);
  if (request.async === false) {
    warn("sync not supported because postmessage is async");
    callback();
    return;
  }
  //get or insert frame
  const frame = getFrame(p.origin, slaves[p.origin]);
  //connect to slave
  const socket = createSocket(guid(), frame);
  //queue callback
  socket.on("response", function(resp) {
    callback(resp);
    socket.close();
  });
  //user wants to abort
  request.xhr.addEventListener("abort", () => socket.emit("abort"));
  //kick off
  if (socket.ready) {
    handleRequest(request, socket);
  } else {
    socket.once("ready", () => handleRequest(request, socket));
  }
};

const frames = {};
const getFrame = function(origin, proxyPath) {
  //cache origin
  if (frames[origin]) {
    return frames[origin];
  }
  const frame = document.createElement("iframe");
  frame.id = frame.name = guid();
  log(`creating iframe ${frame.id}`);
  frame.src = `${origin}${proxyPath}`;
  frame.setAttribute("style", "display:none;");
  document.body.appendChild(frame);
  return (frames[origin] = frame.contentWindow);
};

const convertToArrayBuffer = function(args, done) {
  const [name, obj] = Array.from(args);
  const isBlob = instOf(obj, "Blob");
  const isFile = instOf(obj, "File");
  if (!isBlob && !isFile) {
    return 0;
  }
  const reader = new FileReader();
  reader.onload = function() {
    // clear value
    args[1] = null;
    // formdata.append(name, value, **filename**)
    if (isFile) {
      args[2] = obj.name;
    }
    return done(["XD_BLOB", args, this.result, obj.type]);
  };
  reader.readAsArrayBuffer(obj);
  return 1;
};

//this FormData is actually XHooks custom FormData `fd`,
//which exposes all `entries` added, where each entry
//is the arguments object
const convertFormData = function(entries, send) {
  //expand FileList -> [File, File, File]
  entries.forEach(function(args, i) {
    const [name, value] = Array.from(args);
    if (instOf(value, "FileList")) {
      entries.splice(i, 1);
      Array.from(value).forEach(file => {
        entries.splice(i, 0, [name, file]);
      });
    }
  });
  //basically: async.parallel([filter:files], send)
  let c = 0;
  entries.forEach(function(args, i) {
    c += convertToArrayBuffer(args, function(newargs) {
      entries[i] = newargs;
      if (--c === 0) {
        send();
      }
    });
  });
  if (c === 0) {
    send();
  }
};

const handleRequest = function(request, socket) {
  socket.on("xhr-event", function() {
    return request.xhr.dispatchEvent.apply(null, arguments);
  });
  socket.on("xhr-upload-event", function() {
    return request.xhr.upload.dispatchEvent.apply(null, arguments);
  });

  const obj = strip(request);
  obj.headers = request.headers;
  //add master cookie
  if (request.withCredentials) {
    if (config.cookies.master) {
      obj.headers[config.cookies.master] = document.cookie;
    }
    obj.slaveCookie = config.cookies.slave;
  }

  const send = () => socket.emit("request", obj);

  if (request.body) {
    obj.body = request.body;
    //async serialize formdata
    if (instOf(obj.body, "FormData")) {
      const { entries } = obj.body;
      obj.body = ["XD_FD", entries];
      convertFormData(entries, send);
      return;
    }
  }
  send();
};

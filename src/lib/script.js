const config = require("./config");
const { parseUrl } = require("./util");
const { addSlaves } = require("./master");
const { addMasters } = require("./slave");
const { document } = window;
//auto init using attributes
exports.initialise = function() {
  //attribute handlers
  const attrs = {
    debug(value) {
      if (typeof value !== "string") {
        return;
      }
      config.debug = value !== "false";
    },
    slave(value) {
      if (!value) {
        return;
      }
      const p = parseUrl(value);
      if (!p) {
        return;
      }
      const s = {};
      s[p.origin] = p.path;
      addSlaves(s);
    },
    master(value) {
      let p;
      if (!value) {
        return;
      }
      if (value === "*") {
        p = { origin: "*", path: "*" };
      } else if (value === "file://*") {
        p = { origin: "file://", path: "*" };
      } else {
        p = parseUrl(value);
      }
      if (!p) {
        return;
      }
      const m = {};
      m[p.origin] = p.path.replace(/^\//, "") ? p.path : "*";
      addMasters(m);
    }
  };
  //find all script tags referencing 'xdomain' and then
  //find all attributes with handlers registered
  for (let script of Array.from(document.getElementsByTagName("script"))) {
    if (/xdomain/.test(script.src)) {
      for (let prefix of ["", "data-"]) {
        for (let k in attrs) {
          const fn = attrs[k];
          fn(script.getAttribute(prefix + k));
        }
      }
    }
  }
};

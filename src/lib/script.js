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
      config.debug = value !== "false";
    },
    slave(value) {
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
  Array.from(document.getElementsByTagName("script")).forEach(script => {
    if (!/xdomain/.test(script.src)) {
      return;
    }
    ["", "data-"].forEach(prefix => {
      for (let k in attrs) {
        const value = script.getAttribute(prefix + k);
        if (value) {
          const fn = attrs[k];
          fn(value);
        }
      }
    });
  });
};

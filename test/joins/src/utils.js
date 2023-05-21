

const to = (prom) => {
  return new Promise((res, rej) => {
    prom
      .then((data) => res([data, undefined]))
      .catch((err) => {
        console.log(err);
        res([undefined, err]);
      });
  });
};

function atob(base64) {
  if (typeof base64 === "number") return `type:${base64}`;
  if (typeof base64 !== "string") throw new TypeError("Expected String");
  const buffer = Buffer.from(base64, "base64");
  return buffer.toString("binary");
};

function btoa(binary) {
  if (typeof binary === "number") return `type:${binary}`;
  if (typeof binary !== "string") throw new TypeError("Expected String");
  const buffer = Buffer.from(binary, "binary");
  return buffer.toString("base64");
};

// http route with out express
function route(verb, path, callback) {
  return function (req, res, next) {
    if (req.method.toLowerCase() !== verb.toLowerCase()) return next();
    if (path instanceof RegExp) {
      var captures = path.exec(req.path);
      if (!captures) return next();
      req.params = [];
      for (var i = 1; i < captures.length; i++) {
        req.params.push(captures[i]);
      }
      return callback(req, res, next);
    }
    if (path !== req.path) return next();
    callback(req, res, next);
  };
}

// exports.to = to;
// exports.atob = atob;
// exports.firebaseAuthSync = firebaseAuthSync;
// exports.route = route;

module.exports = {
  to,
  atob,
  btoa,
  route,
};

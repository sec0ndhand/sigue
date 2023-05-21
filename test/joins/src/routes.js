// http route with out express
function route(verb, path, callback) {
  return function (req, res, setHeaders, next) {
    if (req.method.toLowerCase() !== verb.toLowerCase()) return null;
    if (path !== req.url) return null;
    setHeaders(res);
    const cback = callback(req, res, next);
    res.end();
    return true;
  };
}

const tempFunction = (req, res) => {
  console.log(req.url);
};

const signup = route("POST", "/signup", tempFunction);
const login = route("POST", "/login", tempFunction);
const logout = route("POST", "/logout", tempFunction);
const resetPassword = route("POST", "/reset-password", tempFunction);

module.exports = {
  signup,
  login,
  logout,
  resetPassword,
};

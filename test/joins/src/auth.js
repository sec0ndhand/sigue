// use 'strict';
const jwt = require('jsonwebtoken');
const utils = require('./utils.js');
const { to } = utils;

const json_salt = process.env.JSON_SALT || "this_should_be_a_cryptographically_secure_string";

const auth = async (token) =>  {
  return new Promise( (resolve, reject) => {
    let errorObj = {
      status: 401,
      message: ""
    }
    if (!json_salt) reject( {...errorObj, message: 'No json_salt provided.  Contact your administrator.'} )

    if (!token) reject( {...errorObj, status: 401, message: 'No token provided.'} );

    jwt.verify(token, json_salt, function(err, decoded) {
      if (err) reject( {...errorObj, status: 401, message: 'Failed to authenticate token.'});
      resolve(decoded);
    });
  })
};

const sendMessage = (res, errorObj) => {
  res.status(errorObj.status).send({ auth: false, message: errorObj.message });
}

const reqAuth = async (req, res, cb) =>  {
  var bearerToken = req.headers['Authorization'] || req.headers['authorization'];
  const [bearer, token] = bearerToken.split(' ');
  if (bearer !== 'Bearer') return sendMessage(res, {status: 401, message: 'No token provided.'});

  const [ userData, err ] = await to(auth(token));
  if (err) return sendMessage(res, err);
  if (userData.message) return sendMessage(res, userData);
  cb(userData);
  return userData;
};

module.exports = {
  reqAuth,
  auth
}

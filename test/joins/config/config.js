const path = require('path');
module.exports = {
  "development": {
    username: 'root',
    password: 'root',
    storage: path.join(__dirname, 'dev.db'),
    host: 'localhost',
    dialect: 'sqlite',
    logging: console.log
},
  "test": {
    username: 'root',
    password: 'root',
    storage: path.join(__dirname, 'test.db'),
    host: 'localhost',
    dialect: 'sqlite',
    logging: console.log
},
  "production": {
    "use_env_variable": "DATABASE_URL"
  }
}

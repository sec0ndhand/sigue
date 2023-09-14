"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");


function getModels({ config = null, db_url = null, modelsDirectory = null }) {
  const models = modelsDirectory;
  const db = {};
  let sequelize;
  if (db_url) {
    sequelize = new Sequelize(db_url, config);
  } else {
    sequelize = new Sequelize(
      config.database,
      config.username,
      config.password,
      config
    );
  }

  fs.readdirSync(models)
    .filter((file) => {
      return (
        file.indexOf(".") !== 0 &&
        file !== "index.js" &&
        file.slice(-3) === ".js" &&
        file.indexOf(".test.js") === -1
      );
    })
    .forEach((file) => {
      const model = require(path.join(models, file))(
        sequelize,
        Sequelize.DataTypes
      );
      db[model.name] = model;
    });

  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  // db.Sequelize = Sequelize;
  return db;
}

module.exports = {
  getModels,
};

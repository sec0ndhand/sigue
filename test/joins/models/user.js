'use strict';
const { firebaseAuthSync } = require('../src/firebase.js')

const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Add association to Preferences model
      this.hasMany(models.Preference, {
        foreignKey: 'user_id',
        as: 'preference'
      });
    }
  }
  const date = new Date();
  date.setFullYear(date.getFullYear() - 13)
  const thirteenYearsAgo = date.toISOString()
  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    firebase_id: DataTypes.STRING,
    name: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: { msg: "Must be a valid email address" },
      },
      trim: true,
    },
    phone: DataTypes.STRING,
    birth: {
      type: DataTypes.DATE,
      validate: {
        isDate: { msg: "Must be a valid email address" },
        // isBefore: { args: thirteenYearsAgo, msg: "Must be older than 13." },
      },
      trim: true,
    },
    auth_level: DataTypes.INTEGER,
    active: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      beforeSave: firebaseAuthSync
    }
  });
  return User;
};

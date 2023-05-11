'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Preference extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Add association to User model
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
      // define association here
    }
  }
  Preference.init({
    type: DataTypes.STRING,
    value: DataTypes.JSONB,
    user_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Preference',
  });
  return Preference;
};

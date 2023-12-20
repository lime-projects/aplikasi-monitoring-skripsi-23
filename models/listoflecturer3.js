'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ListOfLecturer3 extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ListOfLecturer3.init({
    dosenPembahas: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'ListOfLecturer3',
  });
  return ListOfLecturer3;
};
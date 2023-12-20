'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ListOfLecturer2 extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ListOfLecturer2.init({
    dosenPembimbing2: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'ListOfLecturer2',
  });
  return ListOfLecturer2;
};
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LecturerUser extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      LecturerUser.hasMany(models.Proposal, {
        foreignKey: 'LecturerUserId',
        as: 'proposals', 
      });
      LecturerUser.hasMany(models.Proposal, {
        foreignKey: 'LecturerUserId2',
        as: 'proposals2', 
      });
      LecturerUser.hasMany(models.Komprehensif, {
        foreignKey: 'LecturerUserId',
        as: 'komprehensifs', 
      });
      LecturerUser.hasMany(models.Komprehensif, {
        foreignKey: 'LecturerUserId2',
        as: 'komprehensifs2', 
      });
      LecturerUser.hasMany(models.StudentUser, { 
        foreignKey: 'LecturerUserId' 
      });
      LecturerUser.hasMany(models.StudentUser, { 
        foreignKey: 'LecturerUserId2' 
      });
      LecturerUser.hasMany(models.StudentUser, { 
        foreignKey: 'LecturerUserId3' 
      });
    }
  }
  LecturerUser.init({
    nip: DataTypes.INTEGER,
    nama: DataTypes.STRING,
    gender: DataTypes.STRING,
    foto: DataTypes.STRING,
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'LecturerUser',
  });
  return LecturerUser;
};
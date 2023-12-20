'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StudentUser extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      StudentUser.hasOne(models.ThesisRegistration)
      StudentUser.hasOne(models.DevisionOfLecturer)
      StudentUser.hasMany(models.TitleSubmission)
      StudentUser.hasMany(models.TitleSubmission2)
      StudentUser.hasMany(models.Proposal, { 
        foreignKey: 'StudentUserId', 
        as: 'proposals' 
      });
      StudentUser.belongsTo(models.LecturerUser, { 
        foreignKey: 'LecturerUserId', 
        as: 'Lecturer1' 
      });
      StudentUser.belongsTo(models.LecturerUser, { 
        foreignKey: 'LecturerUserId2', 
        as: 'Lecturer2' 
      });
      StudentUser.belongsTo(models.LecturerUser, { 
        foreignKey: 'LecturerUserId3', 
        as: 'Lecturer3' 
      });
    }
  }
  StudentUser.init({
    npm: DataTypes.INTEGER,
    nama: DataTypes.STRING,
    gender: DataTypes.STRING,
    angkatan: DataTypes.STRING,
    foto: DataTypes.STRING,
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    resetPasswordToken: DataTypes.STRING,
    resetPasswordExpires: DataTypes.DATE, 
    role: DataTypes.STRING,
    LecturerUserId: DataTypes.INTEGER,
    LecturerUserId2: DataTypes.INTEGER,
    LecturerUserId3: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'StudentUser',
  });
  return StudentUser;
};
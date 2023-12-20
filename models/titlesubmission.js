'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TitleSubmission extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      TitleSubmission.belongsTo(models.StudentUser)
      TitleSubmission.belongsTo(models.DevisionOfLecturer, {
        foreignKey: 'npm',
        targetKey: 'npm', 
      });
      TitleSubmission.hasOne(models.TitleSubmission2, {
        foreignKey: 'npm', 
        as: 'judul2', 
      });
    }
  }
  TitleSubmission.init({
    npm: DataTypes.INTEGER,
    nama: DataTypes.STRING,
    dosenPembimbing1: DataTypes.STRING,
    dosenPembimbing2: DataTypes.STRING,
    judul1: DataTypes.STRING,
    latarBelakang: DataTypes.TEXT,
    metode: DataTypes.TEXT,
    gambaran: DataTypes.TEXT,
    referensiJurnal1: DataTypes.STRING,
    referensiJurnal2: DataTypes.STRING,
    referensiJurnal3: DataTypes.STRING,
    tanggalPengajuan: DataTypes.DATE,
    statusPersetujuan: DataTypes.STRING,
    StudentUserId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'TitleSubmission',
  });
  return TitleSubmission;
};
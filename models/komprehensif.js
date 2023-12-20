'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Komprehensif extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Komprehensif.belongsTo(models.DevisionOfLecturer, {
        foreignKey: 'npm',
        targetKey: 'npm', 
      });
      Komprehensif.belongsTo(models.TitleSubmission, {
        foreignKey: 'npm',
        targetKey: 'npm', 
      });
      Komprehensif.belongsTo(models.TitleSubmission2, {
        foreignKey: 'npm',
        targetKey: 'npm', 
      });
      Komprehensif.belongsTo(models.LecturerUser, {
        foreignKey: 'LecturerUserId',
        as: 'pembimbing1', 
      });
      Komprehensif.belongsTo(models.LecturerUser, {
        foreignKey: 'LecturerUserId2',
        as: 'pembimbing2',
      });
      Komprehensif.belongsTo(models.LecturerUser, {
        foreignKey: 'LecturerUserId3',
        as: 'pembahas',
      });
    }
  }
  Komprehensif.init({
    npm: DataTypes.INTEGER,
    nama: DataTypes.STRING,
    dosenPembimbing1: DataTypes.STRING,
    dosenPembimbing2: DataTypes.STRING,
    dosenPembahas: DataTypes.STRING,
    tanggalPengajuan: DataTypes.DATE,
    komprehensif: DataTypes.STRING,
    revisi1Komprehensif: DataTypes.STRING,
    revisi2Komprehensif: DataTypes.STRING,
    komprehensifRevisi1: DataTypes.STRING,
    komprehensifRevisi2: DataTypes.STRING,
    tanggalRevisiMahasiswa1Komprehensif: DataTypes.DATE,
    tanggalRevisiMahasiswa2Komprehensif: DataTypes.DATE,
    komprehensifRevisiDosen1: DataTypes.STRING,
    komprehensifRevisiDosen2: DataTypes.STRING,
    tanggalRevisiDosen1Komprehensif: DataTypes.DATE,
    tanggalRevisiDosen2Komprehensif: DataTypes.DATE,
    statusKomprehensif: DataTypes.STRING,
    jadwalUjianKomprehensif: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Komprehensif',
  });
  return Komprehensif;
};
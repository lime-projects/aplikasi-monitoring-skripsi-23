'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class HasilSkripsi extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      HasilSkripsi.belongsTo(models.DevisionOfLecturer, {
        foreignKey: 'npm',
        targetKey: 'npm', 
      });
      HasilSkripsi.belongsTo(models.TitleSubmission, {
        foreignKey: 'npm',
        targetKey: 'npm', 
      });
      HasilSkripsi.belongsTo(models.TitleSubmission2, {
        foreignKey: 'npm',
        targetKey: 'npm', 
      });
    }
  }
  HasilSkripsi.init({
    npm: DataTypes.INTEGER,
    nama: DataTypes.STRING,
    dosenPembimbing1: DataTypes.STRING,
    dosenPembimbing2: DataTypes.STRING,
    dosenPembahas: DataTypes.STRING,
    tanggalPengajuan: DataTypes.DATE,
    hasilSkripsi: DataTypes.STRING,
    revisi1: DataTypes.STRING,
    revisi2: DataTypes.STRING,
    hasilSkripsiRevisi1: DataTypes.STRING,
    hasilSkripsiRevisi2: DataTypes.STRING,
    tanggalRevisiMahasiswa1: DataTypes.DATE,
    tanggalRevisiMahasiswa2: DataTypes.DATE,
    hasilSkripsiRevisiDosen1: DataTypes.STRING,
    hasilSkripsiRevisiDosen2: DataTypes.STRING,
    tanggalRevisiDosen1: DataTypes.DATE,
    tanggalRevisiDosen2: DataTypes.DATE,
    statusHasilSkripsi: DataTypes.STRING,
    jadwalSeminarHasil: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'HasilSkripsi',
  });
  return HasilSkripsi;
};
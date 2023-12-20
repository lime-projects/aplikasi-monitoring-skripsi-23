'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DevisionOfLecturer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      DevisionOfLecturer.belongsTo(models.StudentUser)
      DevisionOfLecturer.belongsTo(models.LecturerUser, { as: 'Pembimbing1', foreignKey: 'dosenPembimbing1Id' });
      DevisionOfLecturer.belongsTo(models.LecturerUser, { as: 'Pembimbing2', foreignKey: 'dosenPembimbing2Id' });
      DevisionOfLecturer.belongsTo(models.LecturerUser, { as: 'Pembahas', foreignKey: 'dosenPembahasId' });
    }
  }
  DevisionOfLecturer.init({
    npm: DataTypes.INTEGER,
    nama: DataTypes.STRING,
    dosenPembimbing1: DataTypes.STRING,
    dosenPembimbing2: DataTypes.STRING,
    dosenPembahas: DataTypes.STRING,
    tanggalPengajuan: DataTypes.DATE,
    statusPembimbing1: DataTypes.STRING,
    statusPembimbing2: DataTypes.STRING,
    statusPembahas: DataTypes.STRING,
    keterangan: DataTypes.STRING,
    statusPermintaanBimbingan: DataTypes.STRING,
    StudentUserId: DataTypes.INTEGER,
    dosenPembimbing1Id: DataTypes.INTEGER,
    dosenPembimbing2Id: DataTypes.INTEGER,
    dosenPembahasId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'DevisionOfLecturer',
  });
  return DevisionOfLecturer;
};
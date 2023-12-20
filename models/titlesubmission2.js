'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TitleSubmission2 extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      TitleSubmission2.belongsTo(models.StudentUser)
    }
  }
  TitleSubmission2.init({
    npm: DataTypes.INTEGER,
    nama: DataTypes.STRING,
    dosenPembimbing1: DataTypes.STRING,
    dosenPembimbing2: DataTypes.STRING, 
    judul2: DataTypes.STRING,
    latarBelakang: DataTypes.STRING,
    metode: DataTypes.STRING,
    gambaran: DataTypes.STRING,
    tanggalPengajuan: DataTypes.STRING,
    referensiJurnal1: DataTypes.STRING,
    referensiJurnal2: DataTypes.STRING,
    referensiJurnal3: DataTypes.STRING,
    statusPersetujuan: DataTypes.STRING,
    StudentUserId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'TitleSubmission2',
  });
  return TitleSubmission2;
};
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ThesisRegistration extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ThesisRegistration.belongsTo(models.StudentUser)
    }
  }
  ThesisRegistration.init({
    tahunAkademik: DataTypes.STRING,
    semester: DataTypes.STRING,
    angkatan: DataTypes.STRING,
    tanggalMulai: DataTypes.DATE,
    tanggalAkhir: DataTypes.DATE,
    status: DataTypes.BOOLEAN,
    StudentUserId: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'ThesisRegistration',
  });
  return ThesisRegistration;
};
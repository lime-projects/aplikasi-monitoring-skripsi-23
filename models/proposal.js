'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Proposal extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Proposal.belongsTo(models.StudentUser, { 
        foreignKey: 'StudentUserId', 
        as: 'student' 
      });
      Proposal.belongsTo(models.DevisionOfLecturer, {
        foreignKey: 'npm',
        targetKey: 'npm', 
      });
      Proposal.belongsTo(models.TitleSubmission, {
        foreignKey: 'npm',
        targetKey: 'npm', 
      });
      Proposal.belongsTo(models.TitleSubmission2, {
        foreignKey: 'npm',
        targetKey: 'npm', 
      });
      Proposal.belongsTo(models.LecturerUser, {
        foreignKey: 'LecturerUserId',
        as: 'pembimbing1', 
      });
      Proposal.belongsTo(models.LecturerUser, {
        foreignKey: 'LecturerUserId2',
        as: 'pembimbing2',
      });
      Proposal.belongsTo(models.LecturerUser, {
        foreignKey: 'LecturerUserId3',
        as: 'pembahas',
      });
    }
  }
  Proposal.init({
    npm: DataTypes.INTEGER,
    nama: DataTypes.STRING,
    dosenPembimbing1: DataTypes.STRING,
    dosenPembimbing2: DataTypes.STRING,
    dosenPembahas: DataTypes.STRING,
    tanggalPengajuan: DataTypes.DATE,
    proposal: DataTypes.STRING,
    revisi1: DataTypes.STRING,
    revisi2: DataTypes.STRING,
    proposalRevisi1: DataTypes.STRING,
    proposalRevisi2: DataTypes.STRING,
    tanggalRevisiMahasiswa1: DataTypes.DATE,
    tanggalRevisiMahasiswa2: DataTypes.DATE,
    proposalRevisiDosen1: DataTypes.STRING,
    proposalRevisiDosen2: DataTypes.STRING,
    tanggalRevisiDosen1: DataTypes.DATE,
    tanggalRevisiDosen2: DataTypes.DATE,
    statusProposal: DataTypes.STRING,
    jadwalSeminarProposal: DataTypes.DATE,
    StudentUserId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Proposal',
  });
  return Proposal;
};
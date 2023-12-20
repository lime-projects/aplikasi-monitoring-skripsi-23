'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Proposals', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      npm: {
        type: Sequelize.INTEGER
      },
      nama: {
        type: Sequelize.STRING
      },
      dosenPembimbing1: {
        type: Sequelize.STRING
      },
      dosenPembimbing2: {
        type: Sequelize.STRING
      },
      dosenPembahas: {
        type: Sequelize.STRING
      },
      tanggalPengajuan: {
        type: Sequelize.DATE
      },
      proposal: {
        type: Sequelize.STRING
      },
      revisi1: {
        type: Sequelize.STRING
      },
      revisi2: {
        type: Sequelize.STRING
      },
      proposalRevisi1: {
        type: Sequelize.STRING
      },
      proposalRevisi2: {
        type: Sequelize.STRING
      },
      tanggalRevisiMahasiswa1: {
        type: Sequelize.DATE
      },
      tanggalRevisiMahasiswa2: {
        type: Sequelize.DATE
      },
      proposalRevisiDosen1: {
        type: Sequelize.STRING
      },
      proposalRevisiDosen2: {
        type: Sequelize.STRING
      },
      tanggalRevisiDosen1: {
        type: Sequelize.DATE
      },
      tanggalRevisiDosen2: {
        type: Sequelize.DATE
      },
      statusProposal: {
        type: Sequelize.STRING
      },
      jadwalSeminarProposal: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Proposals');
  }
};
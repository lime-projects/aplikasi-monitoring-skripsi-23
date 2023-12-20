'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Komprehensifs', {
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
      komprehensif: {
        type: Sequelize.STRING
      },
      revisi1Komprehensif: {
        type: Sequelize.STRING
      },
      revisi2Komprehensif: {
        type: Sequelize.STRING
      },
      komprehensifRevisi1: {
        type: Sequelize.STRING
      },
      komprehensifRevisi2: {
        type: Sequelize.STRING
      },
      tanggalRevisiMahasiswa1Komprehensif: {
        type: Sequelize.DATE
      },
      tanggalRevisiMahasiswa2Komprehensif: {
        type: Sequelize.DATE
      },
      komprehensifRevisiDosen1: {
        type: Sequelize.STRING
      },
      komprehensifRevisiDosen2: {
        type: Sequelize.STRING
      },
      tanggalRevisiDosen1Komprehensif: {
        type: Sequelize.DATE
      },
      tanggalRevisiDosen2Komprehensif: {
        type: Sequelize.DATE
      },
      statusKomprehensif: {
        type: Sequelize.STRING
      },
      jadwalUjianKomprehensif: {
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
    await queryInterface.dropTable('Komprehensifs');
  }
};
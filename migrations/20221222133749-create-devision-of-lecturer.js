'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DevisionOfLecturers', {
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
      statusPembimbing1: {
        type: Sequelize.STRING
      },
      statusPembimbing2: {
        type: Sequelize.STRING
      },
      statusPembahas: {
        type: Sequelize.STRING
      },
      keterangan: {
        type: Sequelize.STRING
      },
      statusPermintaanBimbingan: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('DevisionOfLecturers');
  }
};
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TitleSubmissions', {
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
      judul1: {
        type: Sequelize.STRING
      },
      latarBelakang: {
        type: Sequelize.TEXT
      },
      metode: {
        type: Sequelize.TEXT
      },
      gambaran: {
        type: Sequelize.TEXT
      },
      referensiJurnal1: {
        type: Sequelize.STRING
      },
      referensiJurnal2: {
        type: Sequelize.STRING
      },
      referensiJurnal3: {
        type: Sequelize.STRING
      },
      tanggalPengajuan: {
        type: Sequelize.DATE
      },
      statusPersetujuan: {
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
    await queryInterface.dropTable('TitleSubmissions');
  }
};
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TitleSubmission2s', {
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
      judul2: {
        type: Sequelize.STRING
      },
      latarBelakang: {
        type: Sequelize.STRING
      },
      metode: {
        type: Sequelize.STRING
      },
      gambaran: {
        type: Sequelize.STRING
      },
      tanggalPengajuan: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('TitleSubmission2s');
  }
};
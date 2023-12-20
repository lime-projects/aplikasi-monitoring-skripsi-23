'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('HasilSkripsis', {
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
      hasilSkripsi: {
        type: Sequelize.STRING
      },
      revisi1: {
        type: Sequelize.STRING
      },
      revisi2: {
        type: Sequelize.STRING
      },
      hasilSkripsiRevisi1: {
        type: Sequelize.STRING
      },
      hasilSkripsiRevisi2: {
        type: Sequelize.STRING
      },
      tanggalRevisiMahasiswa1: {
        type: Sequelize.DATE
      },
      tanggalRevisiMahasiswa2: {
        type: Sequelize.DATE
      },
      hasilSkripsiRevisiDosen1: {
        type: Sequelize.STRING
      },
      hasilSkripsiRevisiDosen2: {
        type: Sequelize.STRING
      },
      tanggalRevisiDosen1: {
        type: Sequelize.DATE
      },
      tanggalRevisiDosen2: {
        type: Sequelize.DATE
      },
      statusHasilSkripsi: {
        type: Sequelize.STRING
      },
      jadwalSeminarHasil: {
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
    await queryInterface.dropTable('HasilSkripsis');
  }
};
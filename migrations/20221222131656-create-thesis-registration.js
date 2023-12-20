'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ThesisRegistrations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tahunAkademik: {
        type: Sequelize.STRING
      },
      semester: {
        type: Sequelize.STRING
      },
      angkatan: {
        type: Sequelize.STRING
      },
      tanggalMulai: {
        type: Sequelize.DATE
      },
      tanggalAkhir: {
        type: Sequelize.DATE
      },
      status: {
        type: Sequelize.BOOLEAN
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
    await queryInterface.dropTable('ThesisRegistrations');
  }
};
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Komprehensifs', 'LecturerUserId2', {
      type: Sequelize.INTEGER,
      references: {
        model: 'LecturerUsers', 
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Komprehensifs', 'LecturerUserId2');
  },
};

'use strict';

module.exports = {
  up (queryInterface, Sequelize) {
    return queryInterface.addColumn('DevisionOfLecturers', 'dosenPembimbing2Id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'LecturerUsers',
        key: 'id'
      },
      onUpdate: 'cascade',
      onDelete: 'cascade'
    });
  },

   down (queryInterface, Sequelize) {
    return queryInterface.removeColumn('DevisionOfLecturers', 'dosenPembimbing2Id', {});
  }
};

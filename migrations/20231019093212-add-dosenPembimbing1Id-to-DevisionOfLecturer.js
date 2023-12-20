'use strict';

module.exports = {
  up (queryInterface, Sequelize) {
    return queryInterface.addColumn('DevisionOfLecturers', 'dosenPembimbing1Id', {
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
    return queryInterface.removeColumn('DevisionOfLecturers', 'dosenPembimbing1Id', {});
  }
};

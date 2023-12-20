'use strict';

module.exports = {
  up (queryInterface, Sequelize) {
    return queryInterface.addColumn('DevisionOfLecturers', 'StudentUserId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'StudentUsers',
        key: 'id'
      },
      onUpdate: 'cascade',
      onDelete: 'cascade'
    });
  },

   down (queryInterface, Sequelize) {
    return queryInterface.removeColumn('DevisionOfLecturers', 'StudentUserId', {});
  }
};

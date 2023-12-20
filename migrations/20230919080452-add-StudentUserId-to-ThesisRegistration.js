'use strict';

module.exports = {
  up (queryInterface, Sequelize) {
    return queryInterface.addColumn('ThesisRegistrations', 'StudentUserId', {
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
    return queryInterface.removeColumn('ThesisRegistrations', 'StudentUserId', {});
  }
};

'use strict';

module.exports = {
  up (queryInterface, Sequelize) {
    return queryInterface.addColumn('TitleSubmission2s', 'StudentUserId', {
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
    return queryInterface.removeColumn('TitleSubmission2s', 'StudentUserId', {});
  }
};

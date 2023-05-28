"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Sessions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      sessionDate: {
        type: Sequelize.DATE,
      },
      sessionVenue: {
        type: Sequelize.STRING,
      },
      sessionPlayers: {
        type: Sequelize.ARRAY(Sequelize.STRING),
      },
      sessionCount: {
        type: Sequelize.INTEGER,
      },
      isCancelled: {
        type: Sequelize.BOOLEAN,
      },
      reason: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Sessions");
  },
};

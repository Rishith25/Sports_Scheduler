"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class sessionPlayers extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async joinCreator({ userId, sessionId, userName }) {
      return this.create({
        userId,
        sessionId,
        userName,
      });
    }

    static async getPlayersList(sessionId) {
      return this.findAll({
        where: {
          sessionId: sessionId,
        },
      });
    }

    static async getUserPlayer(userId, sessionId) {
      return this.findAll({
        where: {
          userId,
          sessionId,
        },
      });
    }

    static async joinPlayers({ userId, sessionId, userName }) {
      return this.create({
        userId,
        sessionId,
        userName,
      });
    }
    static async leavePlayers({ userId, sessionId }) {
      return this.destroy({
        where: {
          userId,
          sessionId,
        },
      });
    }

    static async deleteSessionPlayer({ userId, sessionId }) {
      return this.destroy({
        where: {
          userId,
          sessionId,
        },
      });
    }

    static async getSessionsJoined(userId) {
      return this.findAll({
        where: {
          userId,
        },
      });
    }
  }
  sessionPlayers.init(
    {
      userId: DataTypes.INTEGER,
      sessionId: DataTypes.INTEGER,
      userName: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "sessionPlayers",
    }
  );
  return sessionPlayers;
};

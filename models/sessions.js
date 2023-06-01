"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sessions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sessions.belongsTo(models.Sports, {
        foreignKey: "sportsId",
      });
    }

    static createSession({
      sessionDate,
      sessionVenue,
      sessionPlayers,
      sessionCount,
      sportsId,
      creatorId,
    }) {
      return this.create({
        sessionDate: sessionDate,
        sessionVenue: sessionVenue,
        sessionPlayers: sessionPlayers,
        sessionCount: sessionCount,
        isCancelled: false,
        reason: null,
        sportsId: sportsId,
        creatorId: creatorId,
      });
    }

    static getSessions(sportsId) {
      return this.findAll({
        where: { sportsId },
      });
    }

    static async upComingSessions(sportsId) {
      return this.findAll({
        where: {
          sportsId,
          sessionDate: {
            [Op.gt]: new Date(),
          },
          isCancelled: false,
        },
      });
    }

    static async getSessionIds(sportsId) {
      return this.findAll({
        where: { sportsId },
      });
    }
    static async getSessionDetails(sessionId) {
      return this.findOne({
        where: {
          id: sessionId,
        },
      });
    }

    static async getSession(id) {
      return this.findOne({
        where: { id },
      });
    }

    static async updatePlayers(sessionCount, sessionId) {
      return this.update(
        {
          sessionCount,
        },
        {
          where: {
            id: sessionId,
          },
        }
      );
    }

    static async cancellationUpdate({ reason, sessionId }) {
      return this.update(
        {
          isCancelled: true,
          reason: reason,
        },
        {
          where: {
            id: sessionId,
          },
        }
      );
    }
    static async deleteSessionMember(sessionPlayers, sessionId) {
      return this.update(
        {
          sessionPlayers: sessionPlayers,
        },
        {
          where: {
            id: sessionId,
          },
        }
      );
    }

    static async editSession({
      sessionDate,
      sessionVenue,
      sessionPlayers,
      sessionCount,
      sessionId,
    }) {
      return this.update(
        {
          sessionDate: sessionDate,
          sessionVenue: sessionVenue,
          sessionPlayers: sessionPlayers,
          sessionCount: sessionCount,
        },
        {
          where: {
            id: sessionId,
          },
        }
      );
    }

    static async deleteSessions(sportsId) {
      return this.destroy({
        where: {
          sportsId,
        },
      });
    }
  }
  Sessions.init(
    {
      sessionDate: DataTypes.DATE,
      sessionVenue: DataTypes.STRING,
      sessionPlayers: DataTypes.ARRAY(DataTypes.STRING),
      sessionCount: DataTypes.INTEGER,
      isCancelled: DataTypes.BOOLEAN,
      reason: DataTypes.STRING,
      creatorId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Sessions",
    }
  );
  return Sessions;
};

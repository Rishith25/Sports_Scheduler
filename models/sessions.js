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
      const currentDateTime = new Date();
      currentDateTime.setHours(currentDateTime.getHours() + 5);
      currentDateTime.setMinutes(currentDateTime.getMinutes() + 30);
      return this.findAll({
        where: {
          sportsId,
          sessionDate: {
            [Op.gt]: currentDateTime,
          },
          isCancelled: false,
        },
      });
    }

    static async previousSessions(sportsId) {
      const currentDateTime = new Date();
      currentDateTime.setHours(currentDateTime.getHours() + 5);
      currentDateTime.setMinutes(currentDateTime.getMinutes() + 30);
      return this.findAll({
        where: {
          sportsId,
          sessionDate: {
            [Op.lt]: currentDateTime,
          },
          isCancelled: false,
        },
      });
    }

    static async cancelledSessions(sportsId) {
      return this.findAll({
        where: {
          sportsId,
          isCancelled: true,
        },
      });
    }

    static async SessionsByDate(sportsId, startDate, toDate) {
      return this.findAll({
        where: {
          sportsId,
          sessionDate: {
            [Op.and]: {
              [Op.gt]: startDate,
              [Op.lt]: toDate,
            },
          },
          isCancelled: false,
        },
      });
    }

    static async cancelledSessionsByDate(sportsId, startDate, toDate) {
      return this.findAll({
        where: {
          sportsId,
          sessionDate: {
            [Op.between]: [startDate, toDate],
          },
          isCancelled: true,
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

    static async getSessionsById(ids) {
      const currentDateTime = new Date();
      currentDateTime.setHours(currentDateTime.getHours() + 5);
      currentDateTime.setMinutes(currentDateTime.getMinutes() + 30);
      return this.findAll({
        where: {
          id: ids,
          sessionDate: {
            [Op.gt]: currentDateTime,
          },
        },
      });
    }

    static async getSessionByUserId(creatorId) {
      const currentDateTime = new Date();
      currentDateTime.setHours(currentDateTime.getHours() + 5);
      currentDateTime.setMinutes(currentDateTime.getMinutes() + 30);
      return this.findAll({
        where: {
          creatorId,
          sessionDate: {
            [Op.gt]: currentDateTime,
          },
        },
      });
    }

    static async countSessionsAll(sportsId) {
      return this.count({
        where: {
          sportsId,
        },
      });
    }

    static async countSessions(sportsId, startDate, toDate) {
      return this.count({
        where: {
          sportsId,
          sessionDate: {
            [Op.between]: [startDate, toDate],
          },
        },
      });
    }

    static async sessionByIdDate(id, sessionDate) {
      return this.findOne({
        where: {
          id,
          sessionDate,
          isCancelled: false,
        },
      });
    }

    static async getpreviousSessionsById(ids) {
      const currentDateTime = new Date();
      currentDateTime.setHours(currentDateTime.getHours() + 5);
      currentDateTime.setMinutes(currentDateTime.getMinutes() + 30);
      return this.findAll({
        where: {
          id: ids,
          sessionDate: {
            [Op.lt]: currentDateTime,
          },
        },
      });
    }

    static async getUserCreatedSessions(creatorId) {
      return this.findAll({
        where: {
          creatorId,
        },
      });
    }
  }
  Sessions.init(
    {
      sessionDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      sessionVenue: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      sessionPlayers: {
        type: DataTypes.ARRAY(DataTypes.STRING),
      },
      sessionCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      isCancelled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
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

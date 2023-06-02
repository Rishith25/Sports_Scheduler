"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sports extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sports.hasMany(models.Sessions, {
        foreignKey: "sportsId",
      });
    }

    static addSport({ sportsname }) {
      return this.create({ sportsname: sportsname });
    }

    static getSportsList() {
      return this.findAll();
    }

    static async getSportsTitle(sportsId) {
      const Sport = await this.findOne({ where: { id: sportsId } });
      return Sport.sportsname;
    }

    static async getSports(sportsId) {
      return this.findAll({
        where: {
          id: sportsId,
        },
      });
    }

    static async UpdateSport({ sportsname, sportsId }) {
      return this.update(
        {
          sportsname: sportsname,
        },
        {
          where: {
            id: sportsId,
          },
        }
      );
    }

    static async deleteSport(sportsId) {
      return this.destroy({
        where: {
          id: sportsId,
        },
      });
    }
  }
  Sports.init(
    {
      sportsname: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
        unique: true,
      },
    },
    {
      sequelize,
      modelName: "Sports",
    }
  );
  return Sports;
};

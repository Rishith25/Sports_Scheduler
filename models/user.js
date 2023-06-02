"use strict";
const { Model, where } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async getUser(id) {
      return this.findAll({
        where: {
          id: id,
        },
      });
    }

    static async getCreatorName(creatorId) {
      return this.findOne({
        where: {
          id: creatorId,
        },
      });
    }

    static async getCreatorNames({ creatorId }) {
      return this.findAll({
        where: {
          id: creatorId,
        },
      });
    }

    static async updatePassword(newHashedPassword, userId) {
      return this.update(
        {
          password: newHashedPassword,
        },
        {
          where: {
            id: userId,
          },
        }
      );
    }
  }

  User.init(
    {
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      role: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "User",
    }
  );
  return User;
};

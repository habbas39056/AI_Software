const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'adwiseaidb', 
  process.env.DB_USER || 'root', 
  process.env.DB_PASS || 'Bestfather@51', 
  {
    host: process.env.DB_HOST || 'localhost',
    port: 3306,
    dialect: 'mysql',
    logging: false,
  }
);

module.exports = sequelize;

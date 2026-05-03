const dotenv = require('dotenv');
dotenv.config();

const config = {
  openrouterKey: process.env.OPENROUTER_API_KEY,

  databases: {
    postgresql: {
      type: 'postgresql',
      connection: {host: process.env.PG_HOST, port: +process.env.PG_PORT, user: process.env.PG_USER, password: process.env.PG_PASSWORD}
    },
    mysql: {
      type: 'mysql',
      connection: {host: process.env.MYSQL_HOST, port: +process.env.MYSQL_PORT, user: process.env.MYSQL_USER, password: process.env.MYSQL_PASSWORD}
    },
    sqlserver: {
      type: 'sqlserver',
      connection: {
        server: process.env.SQLSERVER_HOST,
        port: parseInt(process.env.SQLSERVER_PORT, 10),
        user: process.env.SQLSERVER_USER,
        password: process.env.SQLSERVER_PASSWORD,
        options: {
          encrypt: true,              
          trustServerCertificate: true 
        }
      }
    }
  }
};

module.exports = config;
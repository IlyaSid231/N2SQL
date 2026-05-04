const pg = require('pg');
const mysql = require('mysql2/promise');
const sql = require('mssql');
const config = require('../config/config.js');

const { Pool } = pg;

const systemPools = new Map();

async function getSystemConnection(dbType) {
    const key = `${dbType}-system`;
    
    if (systemPools.has(key)) return systemPools.get(key);

    const baseConfig = Object.values(config.databases)
    .find(d => d.type === dbType);
    if (!baseConfig) throw new Error(`Не найдена конфигурация для ${dbType}`);

    let pool;
    const dbConfig = { ...baseConfig.connection };

    switch(dbType) {
        case 'postgresql':
            dbConfig.database = 'postgres';
            pool = new Pool(dbConfig);
            break;

        case 'mysql':
            dbConfig.database = null;
            pool = mysql.createPool(dbConfig);
            break;

        case 'sqlserver':
            pool = new sql.ConnectionPool({
                ...dbConfig,
                database: 'master',
                options: {
                    encrypt: true,
                    trustServerCertificate: true, 
                    enableArithAbort: true,
                },
            });
            await pool.connect();
            break;

        default:
            throw new Error(`Неизвестный тип СУБД: ${dbType}`);
    }

    systemPools.set(key, pool);
    return pool;
}

module.exports = getSystemConnection;
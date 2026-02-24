const pg = require('pg');
const mysql = require('mysql2/promise');
const sql = require('mssql');
const config = require('../config/config');
const getSystemConnection = require('./dbSystemConnections')
const getDatabasesFromType = require('./getDatabases')

const { Pool } = pg;

const pools = new Map();

async function databaseExists(dbType, dbName) {
    try {
        const databasesFromType = await getDatabasesFromType(dbType);
        
        return databasesFromType.some(db => db === dbName)
    } catch (error) {
        console.error(`Ошибка проверки существования БД ${dbName}:`, error);
        return false;
    }
}

async function getConnection(dbType, dbName) {

     if (dbName === 'none') {
        return getSystemConnection(dbType);
    }

    const baseConfig = Object.values(config.databases)
    .find(d => d.type === dbType)
    if (!baseConfig) throw new Error(`Не найдена конфигурация для ${dbType}`);

    const exists = await databaseExists(dbType, dbName);
    if (!exists) {
        throw new Error(`База данных "${dbName}" не существует в ${dbType}`);
    }

    const key = `${dbType}-${dbName}`;

    if (pools.has(key)) return pools.get(key);

    let pool;
    const dbConfig = {...baseConfig.connection}

    switch(dbType){

        case 'postgresql':
            dbConfig.database = dbName;
            pool = new Pool(dbConfig);
            break;

        case 'mysql':
            dbConfig.database = dbName;
            pool = mysql.createPool(dbConfig);
            break;

        case 'sqlserver':
            pool = new sql.ConnectionPool({
                ...dbConfig,
                database: dbName,
                options: {
                    encrypt: true,
                    trustedConnection: false, // true, если аутентификация Windows
                },
            })
            await pool.connect();
            break;

        default:
            throw new Error(`Неизвестный тип СУБД: ${dbType}`);
    }

    pools.set(key, pool);
    return pool;
}

module.exports = getConnection;
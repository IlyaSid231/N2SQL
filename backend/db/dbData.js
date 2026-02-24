const getConnection = require('./dbConnections');

async function getDbData (dbType, dbName){
    const conn = await getConnection(dbType, dbName);
    let tables = [];
    
    if (dbType === 'postgresql') {

        const tablesResult = await conn.query(`SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE';`);
        tables = tablesResult.rows;

        const dbData = {};
        for (const table of tables) {
        const tableName = table.table_name;

        const columnsResult = await conn.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '${tableName}'`);
        const columns = columnsResult.rows;

        const dataResult = await conn.query(`SELECT * FROM ${tableName}`);
        const data = dataResult.rows;

        dbData[tableName] = {
            columns: columns,
            data: data
        };
        }
        return dbData;

    } else if (dbType === 'mysql') {
        const [tables] = await conn.query(`SHOW TABLES`);
        
        const dbData = {};
        for (const table of tables) {
        const tableName = table[`Tables_in_${dbName}`];

        const [columns] = await conn.query(`SHOW COLUMNS FROM ${tableName}`);
        
        const [data] = await conn.query(`SELECT * FROM ${tableName}`);
        
        dbData[tableName] = {
            columns: columns,
            data: data
        };
        }
        return dbData;

    } else if (dbType === 'sqlserver') {
        const request = conn.request();
        const tablesResult = await request.query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`);
        tables = tablesResult.recordset;

        const dbData = {};
        for (const table of tables) {
        const tableName = table.TABLE_NAME;

        const columnsResult = await request.query(`SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableName}'`);
        const columns = columnsResult.recordset;

        const dataResult = await request.query(`SELECT * FROM ${tableName}`);
        const data = dataResult.recordset;

        dbData[tableName] = {
            columns: columns,
            data: data
        };
        }
        return dbData;
    };

  throw new Error('Неподдерживаемый тип базы данных');
};

module.exports = getDbData;
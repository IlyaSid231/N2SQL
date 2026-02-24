const getSystemConnection = require('./dbSystemConnections');

async function getDatabasesFromType (dbType){
    const systemConn = await getSystemConnection(dbType);
    let databases = [];
    try{
        if (dbType === 'postgresql') {
    
            const pgResult = await systemConn.query(`
            SELECT datname 
            FROM pg_database 
            WHERE datistemplate = false
            AND datname NOT IN ('postgres', 'template0', 'template1')
            AND datname NOT LIKE 'pg_%'
            AND datname NOT LIKE 'rds%'
            ORDER BY datname;
            `);
            databases = pgResult.rows.map(row => row.datname);
            return databases;
    
        } else if (dbType === 'mysql') {
            const [mysqlRows] = await systemConn.query(`
                SHOW DATABASES 
                WHERE \`Database\` NOT IN (
                'information_schema', 
                'mysql', 
                'performance_schema', 
                'sys',
                'phpmyadmin'
                )
                AND \`Database\` NOT LIKE 'innodb_%'
            `);
            databases = mysqlRows.map(row => row.Database);

            return databases;
    
        } else if (dbType === 'sqlserver') {
            const request = systemConn.request();
            const msResult = await request.query(`
                SELECT name 
                FROM sys.databases 
                WHERE database_id > 4 
                AND state_desc = 'ONLINE' 
                AND name NOT IN ('master', 'model', 'msdb', 'tempdb')
                AND name NOT LIKE 'ReportServer%'
                AND name NOT LIKE 'ReportServerTempDB%'
                ORDER BY name;
                `);
            databases = msResult.recordset.map(row => row.name);
    
            return databases;
        };

        throw new Error('Неподдерживаемый тип базы данных');
    } catch (error) {
        console.error(`Ошибка получения списка БД для ${dbType}:`, error);
        throw error;
    }

};

module.exports = getDatabasesFromType;



async function executeQuery(connection, dbType, sql){
    let result;
    if (dbType === 'sqlserver') {
      const request = connection.request();
      result = await request.query(sql);
      result = {
        rows: result.recordset,
        columns: result.recordset?.columns ? Object.keys(result.recordset.columns) : []
      };
    } else {
      // pg и mysql
      const [rows, fields] = await connection.query(sql);
      result = {
        rows,
        columns: fields?.map(f => f.name || f.column) || []
      };
    }
    return result;
};

module.exports = executeQuery;
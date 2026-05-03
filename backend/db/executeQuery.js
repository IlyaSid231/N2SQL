async function executeQuery(connection, dbType, sql) {
  if (dbType === 'sqlserver') {
    const request = connection.request();
    const result = await request.query(sql);
    // Для SELECT: result.recordset – массив строк
    // Для DDL/DML: result.rowsAffected – массив чисел
    if (result.recordset) {
      const columns = result.recordset.length > 0 ? Object.keys(result.recordset[0]) : [];
      return { rows: result.recordset, columns };
    } else {
      return {
        rows: [],
        columns: [],
        affectedRows: result.rowsAffected?.[0] ?? 0,
        message: 'Запрос выполнен успешно'
      };
    }
  }

  if (dbType === 'postgresql') {
    const res = await connection.query(sql);
    // Для PostgreSQL SELECT возвращает { rows, fields }
    if (res.rows) {
      return {
        rows: res.rows,
        columns: res.fields ? res.fields.map(f => f.name) : []
      };
    } else {
      return {
        rows: [],
        columns: [],
        affectedRows: res.rowCount || 0
      };
    }
  }

  if (dbType === 'mysql') {
    const [rows, fields] = await connection.query(sql);
    if (rows && Array.isArray(rows)) {
      return {
        rows: rows,
        columns: fields ? fields.map(f => f.name || f.column) : []
      };
    } else {
      return {
        rows: [],
        columns: [],
        affectedRows: rows.affectedRows || 0
      };
    }
  }

  throw new Error(`Unsupported dbType: ${dbType}`);
}

module.exports = executeQuery;
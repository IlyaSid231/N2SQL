const getConnection = require('./dbConnections');

async function getSchema(dbType, dbName) {
  const conn = await getConnection(dbType, dbName);
  let query;

  switch (dbType) {
    case 'postgresql':
      query = `
        SELECT table_schema, table_name, column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        ORDER BY table_schema, table_name, ordinal_position;
      `;
      break;

    case 'mysql':
      query = `
        SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME, ORDINAL_POSITION;
      `;
      break;

    case 'sqlserver':
      query = `
        SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION;
      `;
      break;

    default:
      throw new Error('Не поддерживается');
  }

  let rows;
  if (dbType === 'sqlserver') {
    const request = conn.request();
    const result = await request.query(query);
    rows = result.recordset; //результаты запроса
  } else {
    // pg и mysql2/promise
    [rows] = await conn.query(query);
  }

  // Структурирование данных
  const schema = {};
  for (const col of rows) {
    const table = `${col.table_schema || 'public'}.${col.table_name || col.TABLE_NAME}`;
    if (!schema[table]) schema[table] = [];
    schema[table].push({
      column: col.column_name || col.COLUMN_NAME,
      type: col.data_type || col.DATA_TYPE,
      nullable: col.is_nullable === 'YES' || col.IS_NULLABLE === 'YES'
    });
  }

  return schema;
}

module.exports = getSchema;
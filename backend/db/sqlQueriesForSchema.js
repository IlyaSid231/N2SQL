    async function executeQueryforSchema(dbType, query, conn){
        let rows;
        if (dbType === 'sqlserver') {
        const request = conn.request();
        const result = await request.query(query);
        rows = result.recordset;
        }  else if (dbType === 'postgresql') {
        const result = await conn.query(query);
        rows = result.rows;
        } else if (dbType === 'mysql') {
        [rows] = await conn.query(query);
        } else {
        throw new Error(`Неподдерживаемый тип СУБД: ${dbType}`);
        }
        return rows;
    }

  async function getColumns(dbType, conn){
    let query;
    switch (dbType) {
      case 'postgresql':
        query = `
          SELECT
            table_schema, table_name, column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        
          ORDER BY table_schema, table_name;
        `;
        break;

      case 'mysql':
        query = `
            SELECT
              TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
          ORDER BY TABLE_NAME;
        `;
        break;

      case 'sqlserver':
        query = `
            SELECT
              TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
          ORDER BY TABLE_SCHEMA, TABLE_NAME;
        `;
        break;

      default:
        throw new Error('Не поддерживается');
    }
    let rows = await executeQueryforSchema(dbType, query, conn);
    
    return rows;
  }

  async function getForeignKeys(dbType, dbName, conn) {
    let query;
    switch (dbType) {

      // information_schema — стандартная системная база данных
      // table_constraints — хранит информацию обо всех ограничениях в базе данных
      // key_column_usage — связывает ограничения с колонками, к которым они применяются
      // constraint_column_usage — показывает, на какие колонки ссылается ограничение (для FOREIGN KEY целевые таблицы (родительские))

      case 'postgresql':
        query = `
          SELECT
            tc.table_schema,
            tc.table_name,
            kcu.column_name,
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            tc.constraint_name
          FROM information_schema.table_constraints tc    
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema NOT IN ('pg_catalog', 'information_schema');
        `;
        break;
        
      case 'mysql':
        query = `
          SELECT 
            kcu.CONSTRAINT_NAME as constraint_name,
            kcu.TABLE_SCHEMA as table_schema,
            kcu.TABLE_NAME as table_name,
            kcu.COLUMN_NAME as column_name,
            kcu.REFERENCED_TABLE_SCHEMA as foreign_table_schema,
            kcu.REFERENCED_TABLE_NAME as foreign_table_name,
            kcu.REFERENCED_COLUMN_NAME as foreign_column_name
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
          WHERE kcu.REFERENCED_TABLE_NAME IS NOT NULL
            AND kcu.TABLE_SCHEMA = ?;
        `;
        const [rows] = await conn.query(query, [dbName]);
        return rows;
        
      case 'sqlserver':
        query = `
          SELECT 
            OBJECT_NAME(fk.parent_object_id) AS table_name,
            COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS column_name,
            OBJECT_NAME(fk.referenced_object_id) AS foreign_table_name,
            COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS foreign_column_name,
            fk.name AS constraint_name,
            SCHEMA_NAME(t.schema_id) AS table_schema,
            SCHEMA_NAME(ref_t.schema_id) AS foreign_table_schema
          FROM sys.foreign_keys fk
          JOIN sys.foreign_key_columns fkc 
            ON fk.object_id = fkc.constraint_object_id
          JOIN sys.tables t 
            ON fk.parent_object_id = t.object_id
          JOIN sys.tables ref_t 
            ON fk.referenced_object_id = ref_t.object_id;
        `;
        break;
        
        default:
          return [];
      }

        let rows = await executeQueryforSchema(dbType, query, conn);
        return rows;
  }

  async function getPrimaryKeys(dbType, conn, dbName) {
  let query;
  
  switch (dbType) {
      case 'postgresql':
        query = `
          SELECT
            tc.table_schema,
            tc.table_name,
            kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY'
            AND tc.table_schema NOT IN ('pg_catalog', 'information_schema');
        `;
        break;
        
      case 'mysql':
        query = `
          SELECT 
            kcu.TABLE_SCHEMA as table_schema,
            kcu.TABLE_NAME as table_name,
            kcu.COLUMN_NAME as column_name
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
          WHERE kcu.CONSTRAINT_NAME = 'PRIMARY'
            AND kcu.TABLE_SCHEMA = ?;
        `;
        const [mysqlRows] = await conn.query(query, [dbName]);
        return mysqlRows;
        
      case 'sqlserver':
        query = `
          SELECT 
            SCHEMA_NAME(t.schema_id) AS table_schema,
            t.name AS table_name,
            c.name AS column_name
          FROM sys.tables t
          JOIN sys.indexes i ON t.object_id = i.object_id
          JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
          JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
          WHERE i.is_primary_key = 1;
        `;
        break;
        
      default:
        return [];
    }
    
    const rows = await executeQueryforSchema(dbType, query, conn);
    return rows;
  }

module.exports = {
    getColumns,
    getForeignKeys,
    getPrimaryKeys,
};
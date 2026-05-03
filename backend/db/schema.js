const getConnection = require('./dbConnections');
const { getColumns, getForeignKeys, getPrimaryKeys } = require('./sqlQueriesForSchema');
const sql = require('mssql');

async function isColumnUnique(dbType, connection, tableName, columnName, schemaName = 'public') {
  switch (dbType) {
    case 'postgresql': {
      const query = `
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
        WHERE t.relname = $1
          AND a.attname = $2
          AND c.contype = 'u'
          AND ($3 = '' OR t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = $3))
        LIMIT 1
      `;
      const result = await connection.query(query, [tableName, columnName, schemaName]);
      return result.rows.length > 0;
    }
    case 'mysql': {
      const query = `
        SELECT 1 FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
          AND CONSTRAINT_NAME != 'PRIMARY'
          AND REFERENCED_TABLE_NAME IS NULL
        LIMIT 1
      `;
      const [rows] = await connection.query(query, [tableName, columnName]);
      return rows.length > 0;
    }
    case 'sqlserver': {
      const query = `
        SELECT TOP 1 1 FROM sys.indexes i
        JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
        JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE OBJECT_NAME(i.object_id) = @tableName
          AND c.name = @columnName
          AND i.is_unique = 1
          AND i.is_primary_key = 0
      `;
      const request = connection.request();
      request.input('tableName', sql.NVarChar, tableName);
      request.input('columnName', sql.NVarChar, columnName);
      const result = await request.query(query);
      return result.recordset.length > 0;
    }
    default:
      return false;
  }
}

function buildPrimaryKeySet(primaryKeys) {
  const primaryKeySet = new Set();
  for (const primaryKey of primaryKeys) {
    const tableSchema = primaryKey.table_schema || 'public';
    const tableName = primaryKey.table_name;
    const columnName = primaryKey.column_name;
    const lookupKey = `${tableSchema}.${tableName}.${columnName}`;
    primaryKeySet.add(lookupKey);
  }
  return primaryKeySet;
}

function getTableIdentifier(tableSchema, tableName) {
  if (tableSchema && tableSchema !== 'public') {
    return `${tableSchema}.${tableName}`;
  } else {
    return tableName;
  }
}

function initializeSchemaTable(schema, tableIdentifier, tableName, tableSchema) {
  if (!schema[tableIdentifier]) {
    schema[tableIdentifier] = {
      table_name: tableName,
      table_schema: tableSchema || 'public',
      columns: [],
      foreign_keys: [],
      relationships: []
    };
  }
}

function addColumnToTable(schema, tableIdentifier, columnName, dataType, isNullable, isPrimary) {
  schema[tableIdentifier].columns.push({
    column: columnName,
    type: dataType,
    nullable: isNullable,
    is_primary: isPrimary
  });
}

function buildForeignKeysMap(foreignKeys) {
  const foreignKeysMap = new Map();
  for (const foreignKey of foreignKeys) {
    const tableIdentifier = getTableIdentifier(foreignKey.table_schema, foreignKey.table_name);
    if (!foreignKeysMap.has(tableIdentifier)) {
      foreignKeysMap.set(tableIdentifier, []);
    }
    foreignKeysMap.get(tableIdentifier).push(foreignKey);
  }
  return foreignKeysMap;
}

function isManyToManyTable(tableInfo, foreignKeysForTable) {
  const columnNames = tableInfo.columns.map(column => column.column);
  const foreignKeyColumnNames = foreignKeysForTable.map(fk => fk.column_name);
  const allColumnsAreForeignKeys = columnNames.every(columnName => foreignKeyColumnNames.includes(columnName));
  
  const primaryKeyColumns = tableInfo.columns
    .filter(column => column.is_primary)
    .map(column => column.column);
  const primaryKeyExactlyMatchesForeignKeys = 
    primaryKeyColumns.length === foreignKeyColumnNames.length &&
    primaryKeyColumns.every(primaryKey => foreignKeyColumnNames.includes(primaryKey));
  
  return allColumnsAreForeignKeys && primaryKeyExactlyMatchesForeignKeys && foreignKeyColumnNames.length >= 2;
}

function determineRelationshipType(foreignKey, sourceTable, targetTable, isSourceColumnUnique, isTargetColumnUnique) {
  const isForeignKeyPartOfPrimaryKey = sourceTable.columns.some(column =>
    column.column === foreignKey.column_name && column.is_primary
  );
  
  if (isForeignKeyPartOfPrimaryKey) {
    return 'N:N';
  }
  
  if (isSourceColumnUnique && isTargetColumnUnique) {
    return '1:1';
  }
  
  return 'N:1';
}

function invertRelationship(relationshipType) {
  switch (relationshipType) {
    case '1:1':
      return '1:1';
    case 'N:1':
      return '1:N';
    case '1:N':
      return 'N:1';
    case 'N:N':
      return 'N:N';
    default:
      return 'unknown';
  }
}

async function addForeignKeyToSchema(foreignKey, schema, foreignKeysMap, connection, dbType) {
  const sourceTableIdentifier = getTableIdentifier(foreignKey.table_schema, foreignKey.table_name);
  const targetTableIdentifier = getTableIdentifier(foreignKey.foreign_table_schema, foreignKey.foreign_table_name);
  
  if (!schema[sourceTableIdentifier] || !schema[targetTableIdentifier]) {
    return;
  }
  
  if (sourceTableIdentifier === targetTableIdentifier) {
    return;
  }
  
  schema[sourceTableIdentifier].foreign_keys.push({
    column: foreignKey.column_name,
    references_table: targetTableIdentifier,
    references_column: foreignKey.foreign_column_name,
    constraint_name: foreignKey.constraint_name
  });
  
  const foreignKeysForSource = foreignKeysMap.get(sourceTableIdentifier) || [];
  const isManyToMany = isManyToManyTable(schema[sourceTableIdentifier], foreignKeysForSource);
  
  let relationshipType;
  if (isManyToMany) {
    relationshipType = 'N:N';
  } else {
    const sourceTableName = schema[sourceTableIdentifier].table_name;
    const sourceTableSchema = schema[sourceTableIdentifier].table_schema;
    const isSourceColumnUnique = await isColumnUnique(
      dbType, connection, sourceTableName, foreignKey.column_name, sourceTableSchema
    );
    const isTargetColumnUnique = schema[targetTableIdentifier].columns.some(column =>
      column.column === foreignKey.foreign_column_name && column.is_primary
    );
    relationshipType = determineRelationshipType(
      foreignKey, schema[sourceTableIdentifier], schema[targetTableIdentifier],
      isSourceColumnUnique, isTargetColumnUnique
    );
  }
  
  schema[sourceTableIdentifier].relationships.push({
    type: relationshipType,
    target_table: targetTableIdentifier,
    via_column: foreignKey.column_name,
    target_column: foreignKey.foreign_column_name
  });
  
  if (schema[targetTableIdentifier]) {
    let inverseType;
    if (relationshipType === 'N:N') {
      inverseType = 'N:N';
    } else {
      inverseType = invertRelationship(relationshipType);
    }
    schema[targetTableIdentifier].relationships.push({
      type: inverseType,
      target_table: sourceTableIdentifier,
      via_column: foreignKey.foreign_column_name,
      target_column: foreignKey.column_name,
      inverse: true
    });
  }
}

async function getSchema(dbType, dbName) {
  const connection = await getConnection(dbType, dbName);
  
  const columns = await getColumns(dbType, connection);
  const foreignKeys = await getForeignKeys(dbType, dbName, connection);
  const primaryKeys = await getPrimaryKeys(dbType, connection, dbName);
  
  const schema = {};
  const primaryKeySet = buildPrimaryKeySet(primaryKeys);

  for (const column of columns) {
    const tableName = column.table_name || column.TABLE_NAME;
    const tableSchema = column.table_schema || column.TABLE_SCHEMA;
    const columnName = column.column_name || column.COLUMN_NAME;
    const dataType = column.data_type || column.DATA_TYPE;
    const isNullable = (column.is_nullable || column.IS_NULLABLE) === 'YES';
    
    const tableIdentifier = getTableIdentifier(tableSchema, tableName);
    const primaryKeyLookupKey = `${tableSchema || 'public'}.${tableName}.${columnName}`;
    const isPrimary = primaryKeySet.has(primaryKeyLookupKey);
    
    initializeSchemaTable(schema, tableIdentifier, tableName, tableSchema);
    addColumnToTable(schema, tableIdentifier, columnName, dataType, isNullable, isPrimary);
  }
  
  const foreignKeysMap = buildForeignKeysMap(foreignKeys);
  for (const foreignKey of foreignKeys) {
    await addForeignKeyToSchema(foreignKey, schema, foreignKeysMap, connection, dbType);
  }
  
  return schema;
}

module.exports = getSchema;
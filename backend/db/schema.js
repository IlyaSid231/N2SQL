const getConnection = require('./dbConnections');
const { getColumns, getForeignKeys, getPrimaryKeys } = require('./sqlQueriesForSchema');

  async function getSchema(dbType, dbName) {
    const conn = await getConnection(dbType, dbName);

    const columns = await getColumns(dbType, conn);
    const foreignKeys = await getForeignKeys(dbType, dbName, conn);
    const primaryKeys = await getPrimaryKeys(dbType, conn, dbName);
    const schema = {};

    const primaryKeySet = new Set();
    
    for (const pk of primaryKeys) {
      const pkTableSchema = pk.table_schema || 'public';
      const pkTableName = pk.table_name;
      const pkColumnName = pk.column_name;
      
      const key = `${pkTableSchema}.${pkTableName}.${pkColumnName}`;
      primaryKeySet.add(key);
    }

    for (const col of columns) {

        const col_table_name = col.table_name || col.TABLE_NAME;
        const col_table_schema = col.table_schema || col.TABLE_SCHEMA;
        const col_column_name = col.column_name || col.COLUMN_NAME;
        const col_data_type = col.data_type || col.DATA_TYPE;
        const col_is_nullable = col.is_nullable || col.IS_NULLABLE;

        const tableKey = col_table_schema && col_table_schema !== 'public' 
            ? `${col_table_schema}.${col_table_name}` 
            : col_table_name;

        // Проверка на primary key
        const pkCheckKey = `${col_table_schema || 'public'}.${col_table_name}.${col_column_name}`;
        const isPrimary = primaryKeySet.has(pkCheckKey);
        // ---

        if (!schema[tableKey]) {
            schema[tableKey] = {
                table_name: col_table_name,           
                table_schema: col_table_schema || 'public',
                columns: [],
                foreign_keys: [],
                relationships: []
            };
        }
        
        schema[tableKey].columns.push({
            column: col_column_name,
            type: col_data_type,
            nullable: col_is_nullable === 'YES',
            is_primary: isPrimary
        });
    }

    for (const fk of foreignKeys) {
      const tableKey = fk.table_schema && fk.table_schema !== 'public'
        ? `${fk.table_schema}.${fk.table_name}`
        : fk.table_name;
        
      const targetTableKey = fk.foreign_table_schema && fk.foreign_table_schema !== 'public'
        ? `${fk.foreign_table_schema}.${fk.foreign_table_name}`
        : fk.foreign_table_name;
      
      if (schema[tableKey]) {
        schema[tableKey].foreign_keys.push({
          column: fk.column_name,
          references_table: targetTableKey,
          references_column: fk.foreign_column_name,
          constraint_name: fk.constraint_name
        });
        
        // Определяем тип связи
        const relationshipType = determineRelationshipType(
          fk, 
          schema[tableKey], 
          schema[targetTableKey],
          foreignKeys
        );
        
        // Добавляем информацию о связи (в обе стороны)
        schema[tableKey].relationships.push({
          type: relationshipType,
          target_table: targetTableKey,
          via_column: fk.column_name,
          target_column: fk.foreign_column_name
        });
        
        // Добавляем обратную связь в целевую таблицу
        if (schema[targetTableKey]) {
          schema[targetTableKey].relationships = schema[targetTableKey].relationships || [];
          schema[targetTableKey].relationships.push({
            type: invertRelationship(relationshipType),
            target_table: tableKey,
            via_column: fk.foreign_column_name,
            target_column: fk.column_name,
            inverse: true
          });
        }
      }
    }

    return schema;
  }


  function determineRelationshipType(fk, sourceTable, targetTable, allForeignKeys) {
      // Проверяем, является ли колонка частью первичного ключа
      const isFkPartOfPk = sourceTable.columns.some(col => 
        col.column === fk.column_name && col.is_primary
      );
      
      // Проверяем уникальность (если в целевой таблице колонка уникальна)
      // В реальности нужно проверять constraints, но для простоты:
      const isTargetUnique = targetTable?.columns.some(col => 
        col.column === fk.foreign_column_name && col.is_primary
      );
      
      // Определяем тип
      if (isFkPartOfPk) {
        return '1:1'; // Если FK является частью PK — скорее всего 1:1
      } else if (isTargetUnique) {
        return '1:1'; // Если ссылается на уникальное поле — 1:1
      } else {
        return 'N:1'; // Иначе — многие-к-одному
      }
  }

// Инвертирование типа связи
function invertRelationship(type) {
  switch(type) {
    case '1:1': return '1:1';
    case 'N:1': return '1:N';
    case '1:N': return 'N:1';
    case 'N:N': return 'N:N';
    default: return 'unknown';
  }
}

module.exports = getSchema;

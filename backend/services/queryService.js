const sql = require('mssql');
const { Parser } = require('node-sql-parser');
const ExcelJS = require('exceljs');
const { Parser: CsvParser } = require('json2csv');

// Список запрещённых ключевых слов кроме
// 'UPDATE', 'INSERT', 'ALTER', 'CREATE'
// 

const DANGEROUS_KEYWORDS = [
  'DROP', 'DELETE', 'TRUNCATE',
  'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'SP_EXECUTESQL', 'SHUTDOWN',
  'MERGE', 'REPLACE', 'LOAD', 'INTO OUTFILE'
];

function isSafeQuery(sqlQuery) {
  if (!sqlQuery || typeof sqlQuery !== 'string') return false;

  const upperQuery = sqlQuery.toUpperCase().trim();

  // Проверка на опасные ключевые слова
  if (DANGEROUS_KEYWORDS.some(keyword => upperQuery.includes(keyword))) {
    return false;
  }

  return true;
}

async function executeQuery(connection, dbType, sqlQuery){

    if (!isSafeQuery(sqlQuery)) {
    throw new Error('Недопустимый SQL-запрос');
  }
    let result;
    if (dbType === 'sqlserver') {               // { recordset: [...] }
        const request = connection.request();
        const queryResult = await request.query(sqlQuery);
        result = {
            rows: queryResult.recordset,
            columns: queryResult.recordset?.length ? Object.keys(queryResult.recordset[0]) : []
        };
    } else if (dbType === 'postgresql') {       // { rows: [...], rowCount: n }
        const queryResult = await connection.query(sqlQuery);
        result = {
            rows: queryResult.rows,
            columns: queryResult.fields?.map(f => f.name) || []
        };
    } else if (dbType === 'mysql') {            // [rows, fields]
        const [rows, fields] = await connection.query(sqlQuery);
        result = {
            rows,
            columns: fields?.map(f => f.name) || []
        };
    }
    return result;
}

function exportToCSV(rows, columns) {
  if (!rows || rows.length === 0) return '';

  const json2csvParser = new CsvParser({ fields: columns });
  return json2csvParser.parse(rows);
}

async function exportToExcel(rows, columns, fileName = 'export') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Данные');

  // Заголовки
  worksheet.columns = columns.map(col => ({
    header: col,
    key: col,
    width: 20
  }));

  // Данные
  worksheet.addRows(rows);

  // Стилизация заголовков
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = {
  executeQuery,
  exportToCSV,
  exportToExcel,
};
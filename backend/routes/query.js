const express = require('express');
const router = express.Router();
const getConnection = require('../db/connections');
const { executeQuery, exportToCSV, exportToExcel } = require('../services/queryService');  

router.post('/query', async (req, res) => {
  const { dbType, dbName, sql } = req.body;

  if (!dbType || !dbName || !sql) {
    return res.status(400).json({ error: 'Нужны dbType, dbName, sql' });
  }

  const queries = sql.split(';').map(query => query.trim()).filter(query => query);

  try {
    const conn = await getConnection(dbType, dbName);
    const results = [];

    for (const query of queries) {
      const result = await executeQuery(conn, dbType, query);
      results.push({
        data: result.rows,
        columns: result.columns
      });
    }

    res.json({
      results
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
      sql: err.sql || '(не удалось выполнить запрос)'
    });
  }
});

// Экспорт в CSV
router.post('/export/csv', async (req, res) => {
  const { dbType, dbName, sql } = req.body;
  try {
    const conn = await getConnection(dbType, dbName);
    const result = await executeQuery(conn, dbType, sql);
    const csv = exportToCSV(result.rows, result.columns);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="export_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Экспорт в Excel
router.post('/export/excel', async (req, res) => {
  const { dbType, dbName, sql } = req.body;
  try {
    const conn = await getConnection(dbType, dbName);
    const result = await executeQuery(conn, dbType, sql);
    const buffer = await exportToExcel(result.rows, result.columns);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="export_${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
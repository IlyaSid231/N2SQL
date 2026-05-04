const express = require('express');
const router = express.Router();
const getSchema = require('../services/schemaService');

router.post('/schema', async (req, res) => {
  const { dbType, dbName } = req.body;

  if (!dbType || !dbName) {
    return res.status(400).json({ error: 'Нужны dbType, dbName' });
  }

  try {
    let schema = "none";
    if (dbName !== "none"){
      schema = await getSchema(dbType, dbName);
    }
    res.json(schema);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      sql: err.sql || '(не удалось сгенерировать)'
    });
  }
});

module.exports = router;
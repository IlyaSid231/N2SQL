const express = require('express');
const router = express.Router();
const getSchema = require('../services/schemaService');
const naturalLanguageToSQL = require('../llm/translator');

router.post('/translate', async (req, res) => {
  const { dbType, dbName, question } = req.body;

  if (!dbType || !dbName || !question) {
    return res.status(400).json({ error: 'Нужны dbType, dbName, question' });
  }

  try {
    let schema = "none";
    if (dbName !== "none"){
      schema = await getSchema(dbType, dbName);
    }
    console.log(schema);
    const sql = await naturalLanguageToSQL(question, schema, dbType);

    res.json(sql);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      sql: err.sql || '(не удалось сгенерировать)'
    });
  }
});

module.exports = router;
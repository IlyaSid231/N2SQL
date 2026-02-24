const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const getSchema = require('./db/schema.js');
const getDbData = require('./db/dbData.js');
const config = require('./config/config.js');
const getDatabasesFromType = require ('./db/getDatabases');
const executeQuery = require ('./db/executeQuery.js');
const naturalLanguageToSQL = require('./llm/translator.js');
const getConnection = require('./db/dbConnections.js')


const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Для обработки данных форм

// Маршруты
app.get('/databases', async (req, res) => {
  const result = [];

  for (const [key, val] of Object.entries(config.databases)) {
    const databases = await getDatabasesFromType(val.type);
    result.push({
      type: val.type,
      databases
    });
  }
  res.json(result);
});


app.get('/:dbType/:dbName', async (req, res) => {
  const { dbType, dbName } = req.params;
  try {
    const dbData = await getDbData(dbType, dbName)
    res.json(dbData);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/translate', async (req, res) => {
  const { dbType, dbName, question } = req.body;

  if (!dbType || !dbName || !question) {
    return res.status(400).json({ error: 'Нужны dbType, dbName, question' });
  }

  try {
    let schema = "none";
    if (dbName !== "none"){
      schema = await getSchema(dbType, dbName);
    }
    const sql = await naturalLanguageToSQL(question, schema, dbType);

    res.json(sql);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      sql: err.sql || '(не удалось сгенерировать)'
    });
  }
});

app.post('/query', async (req, res) => {
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
        columns: result.columns,
        rowCount: result.rows.length
      });
    }

    res.json({
      results
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
      sql: err.sql || '(не удалось сгенерировать)'
    });
  }
});


app.use((req, res, next) => {
  const error = new Error('Не найдено');
  error.status = 404;
  next(error);
});

module.exports = app;
const express = require('express');
const router = express.Router();
const getDatabasesFromType = require ('../db/getDatabases');
const getDbData = require('../db/dbData');
const config = require('../config/config');

router.get('/databases', async (req, res) => {
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

router.get('/:dbType/:dbName', async (req, res) => {
  const { dbType, dbName } = req.params;
  try {
    const dbData = await getDbData(dbType, dbName)
    res.json(dbData);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
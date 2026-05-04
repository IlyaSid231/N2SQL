const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const databaseRoutes = require('./routes/databases');
const queryRoutes = require('./routes/query');
const translateRoutes = require('./routes/translate');
const schemaRoutes = require('./routes/schema');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Для обработки данных форм

app.use('/', databaseRoutes);
app.use('/', queryRoutes);
app.use('/', translateRoutes);
app.use('/', schemaRoutes); 

app.use((req, res, next) => {
  const error = new Error('Не найдено');
  error.status = 404;
  next(error);
});

module.exports = app;
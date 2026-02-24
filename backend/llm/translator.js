const OpenAI = require('openai');
const config = require('../config/config.js');

const openai = new OpenAI({ 
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: config.openrouterKey, 
});

async function naturalLanguageToSQL(nlQuery, schema, dbType) {
  const dialect = {
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    sqlserver: 'Microsoft SQL Server (T-SQL)'
  }[dbType] || 'SQL';

  const prompt = `Ты эксперт по SQL. Преобразуй запрос на естественном языке в SQL-запрос.

Схема базы данных (таблицы и их поля), при этом схема может быть пустая ("none"), если обращение к самой СУБД):
${JSON.stringify(schema, null, 2)}

СУБД: ${dialect}

Запрос пользователя: "${nlQuery}"

Правила:
- Верни ТОЛЬКО чистый SQL-запрос
- Никаких пояснений, комментариев, markdown, слова "sql"
- Используй правильный диалект для указанной СУБД
- Добавляй LIMIT 1000 если это SELECT без ограничения
- Если схема "none" то запрос напрямую в СУБД

SQL:`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",           // или gpt-4o, grok, claude-3.5-sonnet и т.д.
    messages: [{ role: "user", content: prompt }],
    temperature: 0.0,
    max_tokens: 800,
  });

  let sql = response.choices[0].message.content.trim();

  // минимальная очистка (на случай если модель всё-таки добавила что-то)
  sql = sql.replace(/^```sql\s*/i, '').replace(/```$/,'').trim();

  return sql;
}

module.exports = naturalLanguageToSQL;
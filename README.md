в backend выполнить команды:
1) npm init -y
2) npm install dotenv cors express morgan mssql mysql2 openai pg

В файле package-json в разделе "scripts" прописать "start": "nodemon server.js"
Например: 
"scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "nodemon server.js"
  },

  Запустить сервер с помощью команды npm start

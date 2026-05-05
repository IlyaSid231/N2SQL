Запуск проекта:
1 cd ../backend
docker-compose up -d

2 docker ps Проверка, что все три контейнера работают

3 docker-compose down Остановка контейнеров с сохранением данных

4 создание тестовых бд:
PostgreSQL
docker exec -it text2sql-postgres psql -U postgres -c "CREATE DATABASE testdb;"
docker exec -it text2sql-postgres psql -U postgres -d testdb -c "CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100), age INT);"
docker exec -it text2sql-postgres psql -U postgres -d testdb -c "INSERT INTO users (name, age) VALUES ('Alice', 30), ('Bob', 25);"

MySQL
docker exec -it text2sql-mysql mysql -uroot -proot -e "CREATE DATABASE testdb;"
docker exec -it text2sql-mysql mysql -uroot -proot -e "USE testdb; CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), age INT);"
docker exec -it text2sql-mysql mysql -uroot -proot -e "USE testdb; INSERT INTO users (name, age) VALUES ('Alice', 30), ('Bob', 25);"

SQL Server
docker exec -it text2sql-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'YourStrong!Password' -Q "CREATE DATABASE testdb;" -C
docker exec -it text2sql-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'YourStrong!Password' -d testdb -Q "CREATE TABLE users (id INT IDENTITY(1,1) PRIMARY KEY, name NVARCHAR(100), age INT);" -C
docker exec -it text2sql-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'YourStrong!Password' -d testdb -Q "INSERT INTO users (name, age) VALUES ('Alice', 30), ('Bob', 25);" -C


import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Container from '@mui/material/Container';
import AppBar from '../components/AppBar';
import DbSelector from '../components/DbSelector'; 
import SchemaViewer from '../components/SchemaViewer';
import QueryInput from '../components/QueryInput';
import SqlDisplay from '../components/SqlDisplay';
import ResultsTable from '../components/ResultsTable';
import Loader from '../components/Loader';
import ErrorAlert from '../components/ErrorAlert';
import { fetchDatabases, fetchSchema, setDbType, setSelectedDb } from '../store/slices/dbSlice';
import {
  generateSql,
  executeSql,
  setQuestion,
  setGeneratedSql,
  clearResult,
} from '../store/slices/querySlice';

function HomePage() {
  const dispatch = useDispatch();

  const { dbType, dbList, selectedDb, schema, loading: dbLoading, error: dbError } = useSelector(
    (state) => state.db
  );
  const {
    question,
    generatedSql,
    resultData,
    loadingGenerate,
    loadingExecute,
    errorGenerate,
    errorExecute,
  } = useSelector((state) => state.query);

  // Загружаем список БД при смене типа СУБД
  useEffect(() => {
    if (dbType) {
      dispatch(fetchDatabases(dbType));
    }
  }, [dbType, dispatch]);

  // Загружаем схему только если выбрана реальная БД (не пустая строка)
  useEffect(() => {
    if (selectedDb) {
      dispatch(fetchSchema({ dbType, dbName: selectedDb }));
    }
  }, [selectedDb, dbType, dispatch]);

  const handleDbTypeChange = (newType) => {
    dispatch(setDbType(newType));
    dispatch(setSelectedDb(''));
    dispatch(clearResult());
  };

  const handleDbChange = (dbName) => {
    dispatch(setSelectedDb(dbName));
    dispatch(clearResult());
  };

  const handleQueryChange = (text) => {
    dispatch(setQuestion(text));
  };

  const handleGenerateSql = () => {
    if (!dbType) return; // если тип не выбран, ничего не делаем

    const dbNameToSend = selectedDb || 'none'; // если БД не выбрана, отправляем 'none'
    dispatch(generateSql({ dbType, dbName: dbNameToSend, question }));
  };

  const handleExecuteSql = (sql) => {
    if (!dbType) return;
    const dbNameToSend = selectedDb || 'none';
    dispatch(executeSql({ dbType, dbName: dbNameToSend, sql }))
      .unwrap()
      .then(() => {
        const upperSql = sql.toUpperCase();
        if (upperSql.includes('CREATE DATABASE') ||
            upperSql.includes('DROP DATABASE')) {
          dispatch(fetchDatabases(dbType)); // обновляем список БД
          // Если создали новую БД, сбрасываем выбор, чтобы пользователь выбрал её вручную
          dispatch(setSelectedDb(''));
        }
      })
      .catch(() => {});
  };

  const handleSqlEdit = (newSql) => {
    dispatch(setGeneratedSql(newSql));
  };

  const canGenerate = Boolean(dbType); // true, если тип СУБД выбран

  return (
    <>
      <AppBar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <ErrorAlert message={dbError} onClose={() => {}} />
        <ErrorAlert message={errorGenerate || errorExecute} onClose={() => {}} />

        <DbSelector
          dbType={dbType}
          onDbTypeChange={handleDbTypeChange}
          dbList={dbList}
          selectedDb={selectedDb}
          onDbChange={handleDbChange}
          loading={dbLoading}
          error={dbError}
        />

        {schema && <SchemaViewer schema={schema} />}

        <QueryInput
          value={question}
          onChange={handleQueryChange}
          onSubmit={handleGenerateSql}
          disabled={!canGenerate} 
          loading={loadingGenerate}
        />

        {generatedSql && (
          <SqlDisplay
            sql={generatedSql}
            onExecute={handleExecuteSql}
            loading={loadingExecute}
            error={errorExecute}
            onChange={handleSqlEdit}
          />
        )}

        {loadingExecute && !generatedSql && <Loader />}
        {resultData && <ResultsTable data={resultData} />}
      </Container>
    </>
  );
}

export default HomePage;
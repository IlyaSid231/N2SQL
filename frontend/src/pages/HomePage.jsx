import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Container from '@mui/material/Container';
import AppBar from '../components/AppBar';
import DbSelector from '../components/DbSelector'; 
import SchemaViewer from '../components/SchemaViewer';
import QueryInput from '../components/QueryInput';
import SqlDisplay from '../components/SqlDisplay';
import ResultsTable from '../components/ResultsTable';
import TablesDataViewer from '../components/TablesDataViewer';
import ErrorAlert from '../components/ErrorAlert';
import { fetchDatabases, fetchSchema, setDbType, setSelectedDb, clearDbError } from '../store/slices/dbSlice';
import {
  generateSql,
  executeSql,
  setQuestion,
  setGeneratedSql,
  clearResult,
  clearQueryError,
} from '../store/slices/querySlice';

function HomePage() {
  const dispatch = useDispatch();

  const { dbType, dbList, selectedDb, schema, tablesData, loading: dbLoading, error: dbError } = useSelector(
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
    dispatch(clearQueryError()); 
    dispatch(clearDbError()); 
  };

  const handleDbChange = (dbName) => {
    dispatch(setSelectedDb(dbName));
    dispatch(clearResult());
    dispatch(clearQueryError());
    dispatch(clearDbError());  
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
          dispatch(fetchDatabases(dbType)); 
          // Если создали новую БД, сбрасываем выбор, чтобы пользователь выбрал её вручную
          dispatch(setSelectedDb(''));
        }
      })
      .catch(() => {});
  };

  const handleSqlEdit = (newSql) => {
    dispatch(setGeneratedSql(newSql));
    dispatch(clearQueryError());
  };

  const handleCloseQueryError = () => {
    dispatch(clearQueryError());
  };

  const handleCloseDbError = () => {
    dispatch(clearDbError());
  };

  const canGenerate = Boolean(dbType); 

  return (
    <>
      <AppBar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <ErrorAlert message={dbError} onClose={handleCloseDbError} />
        <ErrorAlert message={errorGenerate || errorExecute} onClose={handleCloseQueryError} />

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

        {tablesData && <TablesDataViewer data={tablesData} />}

        <QueryInput
          value={question}
          onChange={handleQueryChange}
          onSubmit={handleGenerateSql}
          disabled={!canGenerate} 
          loading={loadingGenerate}
        />

        
        <SqlDisplay
          sql={generatedSql}
          onExecute={handleExecuteSql}
          loading={loadingExecute}
          error={errorExecute}
          onChange={handleSqlEdit}
        />
        


        {resultData && <ResultsTable data={resultData} />}
      </Container>
    </>
  );
}

export default HomePage;
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import AppBar from '../components/AppBar';
import DbSelector from '../components/DbSelector';
import SchemaViewer from '../components/SchemaViewer';
import QueryInput from '../components/QueryInput';
import SqlDisplay from '../components/SqlDisplay';
import ResultsTable from '../components/ResultsTable';
import TablesDataViewer from '../components/TablesDataViewer';
import ErrorAlert from '../components/ErrorAlert';
import { 
  fetchDatabases,
  fetchSchema,
  fetchFullSchema, 
  setDbType, 
  setSelectedDb, 
  clearDbError 
} from '../store/slices/dbSlice';
import {
  generateSql,
  executeSql,
  setQuestion,
  setGeneratedSql,
  clearResult,
  clearQueryError,
} from '../store/slices/querySlice';

function isCreateDatabase(question, sql) {
  const text = (question || '').toUpperCase();
  const sqlUpper = (sql || '').toUpperCase();
  return text.includes('СОЗДАЙ БД') || text.includes('CREATE DATABASE') || sqlUpper.includes('CREATE DATABASE');
}

function requiresDatabase(question, sql) {
  if (isCreateDatabase(question, sql)) return false;
  return true;
}

function isDDL(sql) {
  const upperSql = sql.toUpperCase();
  return /CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|CREATE\s+INDEX|DROP\s+INDEX|TRUNCATE\s+TABLE|RENAME\s+TABLE/i.test(upperSql);
}

function HomePage() {
  const dispatch = useDispatch();
  const [validationError, setValidationError] = useState('');

  const { dbType, dbList, selectedDb, schema, tablesData, fullSchema, loading: dbLoading, error: dbError } = useSelector(
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

  useEffect(() => {
    if (dbType) {
      dispatch(fetchDatabases(dbType));
    }
  }, [dbType, dispatch]);

  useEffect(() => {
    if (selectedDb) {
      dispatch(fetchSchema({ dbType, dbName: selectedDb }));
      dispatch(fetchFullSchema({ dbType, dbName: selectedDb }));
    }
  }, [selectedDb, dbType, dispatch]);

  const handleDbTypeChange = (newType) => {
    dispatch(setDbType(newType));
    dispatch(setSelectedDb(''));
    dispatch(clearResult());
    dispatch(clearQueryError());
    dispatch(clearDbError());
    setValidationError('');
  };

  const handleDbChange = (dbName) => {
    const normalizedName = dbName.trim();
    dispatch(setSelectedDb(normalizedName));
    dispatch(clearResult());
    dispatch(clearQueryError());
    dispatch(clearDbError());
    setValidationError('');
  };

  const handleQueryChange = (text) => {
    dispatch(setQuestion(text));
  };

  const handleGenerateSql = () => {
    if (!dbType) return;
    if (requiresDatabase(question, null) && !selectedDb) {
      setValidationError('Для выполнения этого запроса необходимо выбрать базу данных.');
      return;
    }
    setValidationError('');
    const dbNameToSend = selectedDb || 'none';
    dispatch(generateSql({ dbType, dbName: dbNameToSend, question }));
  };

  const handleExecuteSql = (sql) => {
    if (!dbType) return;
    if (requiresDatabase(null, sql) && !selectedDb) {
      setValidationError('Для выполнения этого запроса необходимо выбрать базу данных.');
      return;
    }
    setValidationError('');
    const dbNameToSend = selectedDb || 'none';
    dispatch(executeSql({ dbType, dbName: dbNameToSend, sql }))
      .unwrap()
      .then(() => {
        const upperSql = sql.toUpperCase();
        if (upperSql.includes('CREATE DATABASE') || upperSql.includes('DROP DATABASE')) {
          dispatch(fetchDatabases(dbType));
          dispatch(setSelectedDb(''));
        }
        if (selectedDb && isDDL(sql)) {
          dispatch(fetchSchema({ dbType, dbName: selectedDb }));
          dispatch(fetchFullSchema({ dbType, dbName: selectedDb })); 
        }
      })
      .catch(() => {
        if (selectedDb && isDDL(sql)) {
          dispatch(fetchSchema({ dbType, dbName: selectedDb }));
          dispatch(fetchFullSchema({ dbType, dbName: selectedDb }));
        }
      });
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
        {validationError && (
          <Alert severity="warning" onClose={() => setValidationError('')} sx={{ mb: 2 }}>
            {validationError}
          </Alert>
        )}

        <DbSelector
          dbType={dbType}
          onDbTypeChange={handleDbTypeChange}
          dbList={dbList}
          selectedDb={selectedDb}
          onDbChange={handleDbChange}
          loading={dbLoading}
          error={dbError}
        />

        <Box sx={{ mt: 2, mb: 4 }}>
          <SchemaViewer fullSchema={fullSchema} />
        </Box>
        

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
          resultData={resultData}     
          dbName={selectedDb}  
        />

        {resultData && <ResultsTable data={resultData} />}
      </Container>
    </>
  );
}

export default HomePage;
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { generateSql as apiGenerateSql, executeSql as apiExecuteSql } from '../../services/api';

export const generateSql = createAsyncThunk(
  'query/generateSql',
  async ({ dbType, dbName, question }, { rejectWithValue }) => {
    try {
      const response = await apiGenerateSql({ dbType, dbName, question });

      return response.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.error || 'Ошибка генерации SQL');
    }
  }
);

export const executeSql = createAsyncThunk(
  'query/executeSql',
  async ({ dbType, dbName, sql }, { rejectWithValue }) => {
    try {
      const response = await apiExecuteSql({ dbType, dbName, sql });

      return response.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.error || 'Ошибка выполнения SQL');
    }
  }
);

const querySlice = createSlice({
  name: 'query',
  initialState: {
    question: '',
    generatedSql: '',
    resultData: null,        
    loadingGenerate: false,
    loadingExecute: false,
    errorGenerate: null,
    errorExecute: null,
  },
  reducers: {
    setQuestion: (state, action) => {
      state.question = action.payload;
    },
    setGeneratedSql: (state, action) => {
      state.generatedSql = action.payload;
    },
    clearResult: (state) => {
      state.generatedSql = '';
      state.resultData = null;
      state.errorGenerate = null;
      state.errorExecute = null;
    },
    clearQueryError: (state) => {
      state.errorGenerate = null;
      state.errorExecute = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateSql.pending, (state) => {
        state.loadingGenerate = true;
        state.errorGenerate = null;
        state.generatedSql = '';
      })
      .addCase(generateSql.fulfilled, (state, action) => {
        state.loadingGenerate = false;
        state.generatedSql = action.payload; 
      })
      .addCase(generateSql.rejected, (state, action) => {
        state.loadingGenerate = false;
        state.errorGenerate = action.payload;
      })
      .addCase(executeSql.pending, (state) => {
        state.loadingExecute = true;
        state.errorExecute = null;
        state.resultData = null;
      })
      .addCase(executeSql.fulfilled, (state, action) => {
        state.loadingExecute = false;
        const { results } = action.payload;
        if (results && results.length > 0) {
          const first = results[0];
          // Ищем поле, которое является массивом строк
          let dataArray = null;
          if (Array.isArray(first.data)) {
            dataArray = first.data;
          } else if (Array.isArray(first.rows)) {
            dataArray = first.rows;
          } else if (Array.isArray(first.results)) {
            dataArray = first.results;
          }
          
          if (dataArray && dataArray.length > 0) {
            state.resultData = dataArray;
          } else if (dataArray && dataArray.length === 0) {
            state.resultData = { message: 'Запрос выполнен успешно' };
          } else {
            // Если данные не массив, пытаемся извлечь сообщение
            state.resultData = { message: first.message || 'Запрос выполнен, но данные не получены' };
          }
        } else {
          state.resultData = { message: 'Нет результатов' };
        }
      })
      .addCase(executeSql.rejected, (state, action) => {
        state.loadingExecute = false;
        state.errorExecute = action.payload;
      });
  },
});

export const { setQuestion, setGeneratedSql, clearResult, clearQueryError } = querySlice.actions;
export default querySlice.reducer;
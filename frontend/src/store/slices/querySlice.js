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
          if (first.data && first.data.length > 0) {
            state.resultData = first.data;
          } else {
            state.resultData = { message: 'Запрос выполнен успешно' };
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
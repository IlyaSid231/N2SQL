import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDatabases, getDbData } from '../../services/api';

export const fetchDatabases = createAsyncThunk(
  'db/fetchDatabases',
  async (dbType, { rejectWithValue }) => {
    try {
      const response = await getDatabases();
      const found = response.data.find(item => item.type === dbType);
      
      return found ? found.databases : [];
    } catch (err) {
        return rejectWithValue(err.response?.data?.error || 'Ошибка загрузки списка БД');
    }
  }
);

export const fetchSchema = createAsyncThunk(
  'db/fetchSchema',
  async ({ dbType, dbName }, { rejectWithValue }) => {
    try {
      const response = await getDbData(dbType, dbName);
      const schema = {};
      Object.entries(response.data).forEach(([tableName, { columns }]) => {
        schema[tableName] = columns.map(col => ({
          name: col.column_name || col.COLUMN_NAME || col.Field || col.name,
          type: col.data_type || col.DATA_TYPE || col.Type,
          nullable: col.is_nullable === 'YES' || col.IS_NULLABLE === 'YES' || col.Null === 'YES'
        }));
      });
      return schema;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Ошибка загрузки схемы');
    }
  }
);

const dbSlice = createSlice({
  name: 'db',
  initialState: {
    dbType: null,
    dbList: [],
    selectedDb: '',
    schema: null,
    loading: false,
    error: null,
  },
  reducers: {
    setDbType: (state, action) => {
      state.dbType = action.payload;
      state.dbList = [];
      state.selectedDb = '';
      state.schema = null;
      state.error = null;
    },
    setSelectedDb: (state, action) => {
      state.selectedDb = action.payload;
      state.schema = null; 
    },
    clearDbError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDatabases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDatabases.fulfilled, (state, action) => {
        state.loading = false;
        state.dbList = action.payload;
      })
      .addCase(fetchDatabases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSchema.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchema.fulfilled, (state, action) => {
        state.loading = false;
        state.schema = action.payload;
      })
      .addCase(fetchSchema.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setDbType, setSelectedDb, clearDbError } = dbSlice.actions;
export default dbSlice.reducer;
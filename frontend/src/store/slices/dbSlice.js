import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDatabases, getDbData, getFullSchema } from '../../services/api';

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
      const tablesData = {};

      Object.entries(response.data).forEach(([tableName, { columns, data }]) => {
        schema[tableName] = columns.map(col => ({
          name: col.column_name || col.COLUMN_NAME || col.Field || col.name,
          type: col.data_type || col.DATA_TYPE || col.Type,
          nullable: col.is_nullable === 'YES' || col.IS_NULLABLE === 'YES' || col.Null === 'YES'
        }));
        tablesData[tableName] = data;
      });
      return { schema, tablesData };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Ошибка загрузки схемы');
    }
  }
);

export const fetchFullSchema = createAsyncThunk(
  'db/fetchFullSchema',
  async ({ dbType, dbName }, { rejectWithValue }) => {
    try {
      const response = await getFullSchema(dbType, dbName);
      return response.data; 
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Ошибка загрузки детальной схемы');
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
    tablesData: null,
    fullSchema: null,    
    loading: false,
    error: null,
  },
  reducers: {
    setDbType: (state, action) => {
      state.dbType = action.payload;
      state.dbList = [];
      state.selectedDb = '';
      state.schema = null;
      state.tablesData = null;
      state.fullSchema = null;
      state.error = null;
    },
    setSelectedDb: (state, action) => {
      state.selectedDb = action.payload;
      state.schema = null;
      state.tablesData = null;
      state.fullSchema = null; 
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
        state.schema = action.payload.schema;
        state.tablesData = action.payload.tablesData;
      })
      .addCase(fetchSchema.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.schema = null;
        state.tablesData = null;
      })
      .addCase(fetchFullSchema.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFullSchema.fulfilled, (state, action) => {
        state.loading = false;
        state.fullSchema = action.payload;
      })
      .addCase(fetchFullSchema.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.fullSchema = null;
      });
  },
});

export const { setDbType, setSelectedDb, clearDbError } = dbSlice.actions;
export default dbSlice.reducer;
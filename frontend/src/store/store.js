import { configureStore } from '@reduxjs/toolkit';
import dbReducer from './slices/dbSlice';
import queryReducer from './slices/querySlice';

export const store = configureStore({
  reducer: {
    db: dbReducer,
    query: queryReducer,
  },
});
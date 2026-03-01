import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
});


export const getDatabases = () => api.get('/databases');
export const getDbData = (dbType, dbName) => api.get(`/${dbType}/${dbName}`);

export const generateSql = (data) => api.post('/translate', data);
export const executeSql = (data) => api.post('/query', data);
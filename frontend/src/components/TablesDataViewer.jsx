import React, { useState, useEffect } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import ResultsTable from './ResultsTable';

function TablesDataViewer({ data }) {
  const [selectedTable, setSelectedTable] = useState('');

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setSelectedTable(Object.keys(data)[0]);
    } else {
      setSelectedTable('');
    }
  }, [data]);

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  const handleChange = (event, newValue) => {
    setSelectedTable(newValue);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Tabs
        value={selectedTable}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
      >
        {Object.keys(data).map((tableName) => (
          <Tab key={tableName} label={tableName} value={tableName} />
        ))}
      </Tabs>

      {Object.entries(data).map(([tableName, rows]) => (
        <Box
          key={tableName}
          role="tabpanel"
          hidden={selectedTable !== tableName}
          sx={{ pt: 2 }}
        >
          {selectedTable === tableName && <ResultsTable data={rows} />}
        </Box>
      ))}
    </Box>
  );
}

export default TablesDataViewer;
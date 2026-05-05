import React from 'react';
import { Handle } from 'reactflow';
import { Box, Typography, Paper, Chip } from '@mui/material';

const TableNode = ({ data }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        minWidth: 200,
        backgroundColor: '#fff',
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid #ccc',
        position: 'relative',
      }}
    >
      <Handle type="target" position="left" style={{ background: '#888', width: 8, height: 8 }} />
      <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1, textAlign: 'center' }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {data.tableName}
        </Typography>
      </Box>
      <Box sx={{ p: 1 }}>
        {data.columns?.map((col, idx) => (
          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
            <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{col.column}</Box>
            {col.is_primary && <Chip label="PK" size="small" color="primary" sx={{ height: 18, fontSize: '0.6rem' }} />}
            {col.foreign_key && (
              <Chip
                label={`FK → ${col.foreign_key.table}.${col.foreign_key.column}`}
                size="small"
                color="secondary"
                sx={{ height: 18, fontSize: '0.6rem' }}
              />
            )}
            <Box component="span" color="textSecondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
              ({col.type})
            </Box>
          </Box>
        ))}
      </Box>
      <Handle type="source" position="right" style={{ background: '#888', width: 8, height: 8 }} />
    </Paper>
  );
};

export default TableNode;
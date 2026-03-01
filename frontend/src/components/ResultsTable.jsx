import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';

function ResultsTable({ data }) {
  if (!data) {
    return null;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <Box sx={{ mt: 2 }}>
          <Alert severity="info">Данные не найдены</Alert>
        </Box>
      );
    }

    const columns = Object.keys(data[0]);
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Результат запроса
        </Typography>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} size="small" aria-label="result table">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  {columns.map((col) => (
                    <TableCell key={col}>{row[col]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  if (typeof data === 'object' && data.message) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="success">{data.message}</Alert>
        {data.affectedRows !== undefined && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Затронуто строк: {data.affectedRows}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Alert severity="info">{JSON.stringify(data)}</Alert>
    </Box>
  );
}

export default ResultsTable;
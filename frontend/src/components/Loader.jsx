import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

function Loader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
      <CircularProgress />
    </Box>
  );
}

export default Loader;
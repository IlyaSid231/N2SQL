import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

function ErrorAlert({ message, onClose }) {
  if (!message) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Alert severity="error" onClose={onClose}>
        {message}
      </Alert>
    </Box>
  );
}

export default ErrorAlert;
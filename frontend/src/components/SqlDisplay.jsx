import { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

const SqlTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    backgroundColor: theme.palette.background.default,
  },
}));

function SqlDisplay({ sql, onExecute, loading, error, onChange }) {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Сгенерированный SQL код
      </Typography>
      <SqlTextField
        fullWidth
        multiline
        rows={5}
        value={sql}
        onChange={(e) => onChange(e.target.value)}
        variant="outlined"
        placeholder="SQL появится здесь после генерации..."
        disabled={loading}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
        <Tooltip title={copySuccess ? 'Скопировано!' : 'Копировать'}>
          <IconButton onClick={handleCopy} disabled={!sql || loading} color="primary">
            <ContentCopyIcon />
          </IconButton>
        </Tooltip>
        <Button
          variant="contained"
          color="success"
          endIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
          onClick={() => onExecute(sql)}
          disabled={!sql || loading}
        >
          Выполнить SQL
        </Button>
      </Box>
      {error && (
        <Typography color="error" variant="caption" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}

export default SqlDisplay;
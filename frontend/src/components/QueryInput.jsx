import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import CircularProgress from '@mui/material/CircularProgress';

function QueryInput({ value, onChange, onSubmit, disabled, loading }) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !loading && value.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <TextField
        fullWidth
        multiline
        rows={3}
        label="Введите запрос на естественном языке"
        placeholder="Например: показать всех пользователей старше 30"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled || loading}
        variant="outlined"
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
        <Button
          variant="contained"
          endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          onClick={onSubmit}
          disabled={disabled || loading || !value.trim()}
        >
          {loading ? 'Отправка...' : 'Отправить'}
        </Button>
      </Box>
    </Box>
  );
}

export default QueryInput;
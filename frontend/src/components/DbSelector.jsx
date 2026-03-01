import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import ListSubheader from '@mui/material/ListSubheader';

export const NEW_DB_VALUE = 'none'; 

function DbSelector({
  dbType,
  onDbTypeChange,
  dbList,
  selectedDb,
  onDbChange,
  loading,
  error,
  allowCreateNew = true,
}) {
  const handleDbTypeChange = (event, newDbType) => {
    if (newDbType !== null) {
      onDbTypeChange(newDbType);
    }
  };

  const handleDbChange = (event) => {
    onDbChange(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 300, mb: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Выберите СУБД и базу данных
      </Typography>

      <ToggleButtonGroup
        color="primary"
        value={dbType}
        exclusive
        onChange={handleDbTypeChange}
        aria-label="db type"
        sx={{ mb: 2 }}
      >
        <ToggleButton value="postgresql">PostgreSQL</ToggleButton>
        <ToggleButton value="mysql">MySQL</ToggleButton>
        <ToggleButton value="sqlserver">SQL Server</ToggleButton>
      </ToggleButtonGroup>

      <Box>
        <FormControl sx={{ minWidth: 250, maxWidth: 300 }} disabled={!dbType || loading}>
          <InputLabel id="db-select-label">База данных</InputLabel>
          <Select
            labelId="db-select-label"
            id="db-select"
            value={selectedDb}
            label="База данных"
            onChange={handleDbChange}
          >
            {loading ? (
              <MenuItem disabled>
                <CircularProgress size={20} sx={{ mr: 1 }} /> Загрузка...
              </MenuItem>
            ) : (
              dbList.map((dbName) => (
                <MenuItem key={dbName} value={dbName}>
                  {dbName}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Typography color="error" variant="caption" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}

export default DbSelector;
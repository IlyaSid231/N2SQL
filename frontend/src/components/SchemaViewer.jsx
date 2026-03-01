import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';

function SchemaViewer({ schema }) {
  if (!schema || Object.keys(schema).length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Нет схемы для отображения
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Схема базы данных
      </Typography>
      {Object.entries(schema).map(([tableName, columns]) => (
        <Accordion key={tableName} disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography component="span" sx={{ fontWeight: 'medium' }}>
              {tableName}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {columns.map((col) => (
              <Typography key={col.name} variant="body2" sx={{ ml: 2 }}>
                • {col.name} ({col.type})
              </Typography>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

export default SchemaViewer;
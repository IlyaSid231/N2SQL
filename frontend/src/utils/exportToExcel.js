import * as XLSX from 'xlsx';

export const exportToExcel = (data, dbName, sheetName = 'Result') => {
  if (!data || data.length === 0) {
    console.warn('Нет данных для экспорта');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');

  const newRows = [
    [`Экспорт базы данных: ${dbName}`],
    [`Дата: ${new Date().toLocaleString()}`],
    [], 
  ];
  
  const existingData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  const combined = [...newRows, ...existingData];
  
  const newWorksheet = XLSX.utils.aoa_to_sheet(combined);
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, newWorksheet, sheetName);
  
  const fileName = `export_${dbName}_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.xlsx`;
  
  XLSX.writeFile(workbook, fileName);
};


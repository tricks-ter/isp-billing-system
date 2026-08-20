// frontend/src/utils/export.js

/**
 * Export an array of objects to CSV and download
 * @param {Array} data - Array of objects
 * @param {Array} columns - Array of { key: string, label: string }
 * @param {string} filename - Filename without extension
 */
export function exportCSV(data, columns, filename = 'export') {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }

  // Build header row
  const headers = columns.map(col => col.label).join(',');
  // Build data rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key];
      if (value === null || value === undefined) return '';
      // Escape commas and quotes
      if (typeof value === 'string') {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
      }
      // Format numbers or dates if needed
      if (col.key === 'amount' || col.key === 'total' || col.key === 'price') {
        value = `"${parseFloat(value).toFixed(2)}"`;
      }
      return value;
    }).join(',');
  });

  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
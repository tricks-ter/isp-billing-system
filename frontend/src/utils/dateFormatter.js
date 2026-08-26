// frontend/src/utils/dateFormatter.js

/**
 * Format a month string (YYYY-MM) or date string into friendly Month Year (e.g. "August 2026")
 */
export function formatMonthName(monthStr) {
  if (!monthStr) return 'N/A';
  try {
    if (/^\d{4}-\d{2}$/.test(monthStr)) {
      const [year, month] = monthStr.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    }
    const date = new Date(monthStr);
    if (isNaN(date.getTime())) return monthStr;
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  } catch (_) {
    return monthStr;
  }
}

/**
 * Format a date into friendly Month-based format or Generic format based on toggle
 * @param {string|Date} dateVal - The date value
 * @param {'month'|'exact'} mode - 'month' (default: "August 2026" or "10 August 2026") or 'exact' ("10/08/2026 07:30 PM")
 * @param {boolean} includeDay - whether to include day in month view (e.g. "10 August 2026")
 */
export function formatDisplayDate(dateVal, mode = 'month', includeDay = true) {
  if (!dateVal) return 'N/A';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);

    if (mode === 'month') {
      if (includeDay) {
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    // Exact generic mode: "10-08-2026" or "10/08/2026"
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (_) {
    return String(dateVal);
  }
}

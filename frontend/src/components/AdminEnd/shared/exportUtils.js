/**
 * exportUtils.js
 * Utility to convert JSON tabular data into CSV format and trigger download.
 */

export const exportToCSV = (data, filename = 'export.csv') => {
    if (!data || !data.length) {
        alert('No data to export.');
        return;
    }

    // Extract headers
    const headers = Object.keys(data[0]);

    // Format rows
    const rows = data.map((row) =>
        headers.map((header) => {
                const val = row[header];
                if (val === null || val === undefined) return '""';
                const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
                // Escape double quotes
                const escaped = str.replace(/"/g, '""');
                return `"${escaped}"`;
            })
            .join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

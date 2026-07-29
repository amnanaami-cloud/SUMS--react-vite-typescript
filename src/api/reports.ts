import { apiRequest, downloadApi } from './client';
import type { ReportData, ReportDefinition } from './types';
export const reportsApi = {
  catalog: () => apiRequest<ReportDefinition[]>('/reports'),
  view: (key: string) => apiRequest<ReportData>(`/reports/${key}`),
  export: async (key: string, format: 'PDF' | 'XLSX') => {
    const blob = await downloadApi(`/reports/${key}/export?format=${format}`);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `sums-${key}.${format.toLowerCase()}`;
    anchor.click();
    URL.revokeObjectURL(url);
  },
};

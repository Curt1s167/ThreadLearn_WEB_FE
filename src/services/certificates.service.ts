import type { ApiResponse, Certificate } from '../types';
import { apiClient } from './apiClient';

const filenameFromDisposition = (header: string | undefined, fallback: string) => {
  if (!header) return fallback;

  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return fallback;
    }
  }

  const basicMatch = header.match(/filename="?([^";]+)"?/i);
  return basicMatch?.[1]?.trim() || fallback;
};

export const certificatesService = {
  listMine: async () => {
    const { data } = await apiClient.get<ApiResponse<Certificate[]>>('/certificates/me');
    return data.data;
  },

  verify: async (code: string) => {
    const { data } = await apiClient.get<ApiResponse<Certificate>>(
      `/certificates/verify/${encodeURIComponent(code)}`,
    );
    return data.data;
  },

  downloadPdf: async (code: string) => {
    const response = await apiClient.get<Blob>(
      `/certificates/${encodeURIComponent(code)}/pdf`,
      { responseType: 'blob' },
    );
    const fallback = `threadlearn-certificate-${code}.pdf`;

    return {
      blob: response.data,
      filename: filenameFromDisposition(response.headers['content-disposition'], fallback),
    };
  },

  savePdf: async (code: string) => {
    const { blob, filename } = await certificatesService.downloadPdf(code);
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  },
};

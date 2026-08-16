import api from './api';

const downloadReport = async (endpoint, filename, params = {}) => {
  let response;
  try {
    response = await api.get(endpoint, {
      params,
      responseType: 'blob',
    });
  } catch (err) {
    // Axios throws on non-2xx; response.data is a Blob because of responseType
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const parsed = JSON.parse(text);
        err.parsedError = parsed;
      } catch {
        err.parsedError = { error: 'Unable to generate report. Please try again.' };
      }
    }
    throw err;
  }

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const reportService = {
  downloadReport,
};

export default reportService;
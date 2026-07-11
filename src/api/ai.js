import apiClient from './client';

export const scanReceipt = async (fileOrUrl) => {
  if (typeof fileOrUrl === 'string') {
    const response = await apiClient.post('ai/scan-receipt', { receiptUrl: fileOrUrl });
    return response.data;
  } else {
    const formData = new FormData();
    formData.append('image', fileOrUrl);

    // Using Axios but ensuring the default application/json Content-Type is stripped
    // so Axios can automatically generate the multipart/form-data header with the correct boundary.
    const response = await apiClient.post('ai/scan-receipt', formData, {
      transformRequest: (data, headers) => {
        delete headers['Content-Type'];
        return data;
      },
    });

    return response.data;
  }
};

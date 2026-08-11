export const unwrapApiResponse = (response) => {
  if (!response) return response;
  if (response.data !== undefined) {
    return response.data?.data ?? response.data;
  }
  return response;
};

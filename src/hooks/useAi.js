import { useMutation } from '@tanstack/react-query';
import { scanReceipt } from '../api/ai';

export const useScanReceipt = () => {
  return useMutation({
    mutationFn: async (fileOrUrl) => {
      return await scanReceipt(fileOrUrl);
    },
  });
};

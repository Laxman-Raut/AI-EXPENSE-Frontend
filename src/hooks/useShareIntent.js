import { useEffect, useState } from "react";
import ReceiveSharingIntent from "react-native-receive-sharing-intent";

export default function useShareIntent() {
  const [sharedFiles, setSharedFiles] = useState([]);

  useEffect(() => {
    ReceiveSharingIntent.getReceivedFiles(
      (files) => {
        console.log("Received Files:", files);
        const mapped = files.map(file => ({
          uri: file.filePath || file.contentUri,
          fileName: file.fileName || (file.filePath ? file.filePath.split('/').pop() : 'document.pdf'),
          mimeType: file.mimeType || (file.extension ? `application/${file.extension}` : 'application/pdf'),
          size: file.fileSize || 0,
        }));
        setSharedFiles(mapped);
      },
      (error) => {
        console.log("Share Error:", error);
      },
      "aiexpensetracker"
    );

    return () => {
      ReceiveSharingIntent.clearReceivedFiles();
    };
  }, []);

  const clearIntent = () => {
    ReceiveSharingIntent.clearReceivedFiles();
    setSharedFiles([]);
  };

  return { sharedFiles, clearIntent };
}
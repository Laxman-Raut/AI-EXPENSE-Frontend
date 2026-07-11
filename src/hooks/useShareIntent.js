import { useEffect, useState } from "react";
import ReceiveSharingIntent from "react-native-receive-sharing-intent";

export default function useShareIntent() {
  const [sharedFiles, setSharedFiles] = useState([]);

  useEffect(() => {
    ReceiveSharingIntent.getReceivedFiles(
      (files) => {
        console.log("Received Files:", files);
        setSharedFiles(files);
      },
      (error) => {
        console.log("Share Error:", error);
      },
      "AIExpenseTracker"
    );

    return () => {
      ReceiveSharingIntent.clearReceivedFiles();
    };
  }, []);

  return sharedFiles;
}
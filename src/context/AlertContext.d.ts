import React from 'react';

export interface AlertButton {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertContextType {
  showAlert: (
    title: string,
    message: string,
    buttons?: AlertButton[],
    type?: 'info' | 'warning' | 'destructive' | 'premium'
  ) => void;
  hideAlert: () => void;
}

export declare const AlertProvider: React.FC<{ children: React.ReactNode }>;
export declare const useAlert: () => AlertContextType;
export default AlertContextType;

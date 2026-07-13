import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomAlert from '../components/molecules/CustomAlert';

const AlertContext = createContext(undefined);

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    type: 'info', // 'info' | 'warning' | 'destructive'
  });

  const showAlert = useCallback((title, message, buttons = [], type = 'info') => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons: buttons.length > 0 ? buttons : [{ text: 'OK' }],
      type,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleButtonPress = async (btn) => {
    hideAlert();
    if (btn.onPress) {
      await btn.onPress();
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        buttons={alertState.buttons}
        onButtonPress={handleButtonPress}
        onCancel={hideAlert}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export default AlertContext;

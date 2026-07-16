import { useSelector, useDispatch } from 'react-redux';
import {
  initStore as initStoreThunk,
  setTheme as setThemeThunk,
  setCurrency as setCurrencyThunk,
  setMonthlyBudget as setMonthlyBudgetThunk,
  setNotificationsEnabled as setNotificationsEnabledThunk,
} from './appSlice';

// A wrapper hook to mimic Zustand's selector pattern
const useAppStore = (selector) => {
  const state = useSelector((reduxState) => reduxState.app);
  const dispatch = useDispatch();

  const actions = {
    initStore: () => dispatch(initStoreThunk()),
    setTheme: (theme) => dispatch(setThemeThunk(theme)),
    setCurrency: (currency) => dispatch(setCurrencyThunk(currency)),
    setMonthlyBudget: (budget) => dispatch(setMonthlyBudgetThunk(budget)),
    setNotificationsEnabled: (enabled) => dispatch(setNotificationsEnabledThunk(enabled)),
  };

  const combinedState = {
    ...state,
    ...actions,
  };

  if (selector) {
    return selector(combinedState);
  }

  return combinedState;
};

export default useAppStore;

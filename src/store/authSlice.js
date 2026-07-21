import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';

export const checkStoredAuth = createAsyncThunk(
  'auth/checkStoredAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userStr = await AsyncStorage.getItem('user');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        // Validate token by fetching profile
        try {
          const response = await authApi.getProfile();
          if (response.success && response.data) {
            await AsyncStorage.setItem('user', JSON.stringify(response.data));
            return { token, user: response.data };
          }
        } catch {
          // Token invalid — clear auth storage
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user');
          return rejectWithValue('Token invalid');
        }
        return { token, user };
      }
      return rejectWithValue('No credentials stored');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authApi.loginUser(email, password);
      if (response.success && response.data) {
        const { user, token } = response.data;
        await AsyncStorage.setItem('auth_token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        return { token, user };
      }
      return rejectWithValue(response.message || 'Login failed');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Login failed';
      return rejectWithValue(msg);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ fullName, email, password }, { dispatch, rejectWithValue }) => {
    try {
      const response = await authApi.registerUser(fullName, email, password);
      if (response.success) {
        // Auto-login after registration
        const loginResult = await dispatch(login({ email, password })).unwrap();
        return loginResult;
      }
      return rejectWithValue(response.message || 'Registration failed');
    } catch (error) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user');
    return null;
  }
);

export const refreshProfile = createAsyncThunk(
  'auth/refreshProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.getProfile();
      if (response.success && response.data) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      }
      return rejectWithValue('Failed to refresh profile');
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'auth/updateUser',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authApi.updateProfile(data);
      if (response.success && response.data) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      }
      return rejectWithValue(response.message || 'Profile update failed');
    } catch (error) {
      return rejectWithValue(error.message || 'Profile update failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // checkStoredAuth
      .addCase(checkStoredAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkStoredAuth.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(checkStoredAuth.rejected, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      // login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(login.rejected, (state) => {
        state.isLoading = false;
      })
      // register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(register.rejected, (state) => {
        state.isLoading = false;
      })
      // logout
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      // refreshProfile
      .addCase(refreshProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      // updateUser
      .addCase(updateUser.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export default authSlice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import subscriptionService from '../services/subscriptionService';

// Async Thunks
export const fetchSubscription = createAsyncThunk(
  'subscription/fetchSubscription',
  async (_, { rejectWithValue }) => {
    try {
      const data = await subscriptionService.fetchSubscriptionDetails();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch subscription');
    }
  }
);

export const upgradeUserSubscription = createAsyncThunk(
  'subscription/upgradeUserSubscription',
  async (_, { rejectWithValue }) => {
    try {
      const data = await subscriptionService.upgradeUserSubscription();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to upgrade subscription');
    }
  }
);

export const cancelUserSubscription = createAsyncThunk(
  'subscription/cancelUserSubscription',
  async (_, { rejectWithValue }) => {
    try {
      const data = await subscriptionService.cancelUserSubscription();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to cancel subscription');
    }
  }
);

export const createPaymentOrder = createAsyncThunk(
  'subscription/createPaymentOrder',
  async (plan, { rejectWithValue }) => {
    try {
      const data = await subscriptionService.createPaymentOrder(plan);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create payment order');
    }
  }
);

export const verifyPayment = createAsyncThunk(
  'subscription/verifyPayment',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await subscriptionService.verifyPayment(payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Payment verification failed');
    }
  }
);

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState: {
    plan: 'free',
    status: 'inactive',
    provider: 'none',
    startDate: null,
    endDate: null,
    autoRenew: false,
    loading: false,
    error: null,
    upgradeSuccess: false,
  },
  reducers: {
    clearSubscriptionError: (state) => {
      state.error = null;
    },
    resetUpgradeSuccess: (state) => {
      state.upgradeSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchSubscription
      .addCase(fetchSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.plan = action.payload.plan || 'free';
        state.status = action.payload.status || 'inactive';
        state.provider = action.payload.provider || 'none';
        state.startDate = action.payload.startDate || null;
        state.endDate = action.payload.endDate || null;
        state.autoRenew = action.payload.autoRenew || false;
      })
      .addCase(fetchSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch subscription';
      })
      // upgradeUserSubscription
      .addCase(upgradeUserSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.upgradeSuccess = false;
      })
      .addCase(upgradeUserSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.plan = action.payload.plan || 'pro';
        state.status = action.payload.status || 'active';
        state.provider = action.payload.provider || 'manual';
        state.startDate = action.payload.startDate || null;
        state.endDate = action.payload.endDate || null;
        state.autoRenew = action.payload.autoRenew || false;
        state.upgradeSuccess = true;
      })
      .addCase(upgradeUserSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to upgrade subscription';
        state.upgradeSuccess = false;
      })
      // createPaymentOrder
      .addCase(createPaymentOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPaymentOrder.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createPaymentOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create order';
      })
      // verifyPayment
      .addCase(verifyPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.upgradeSuccess = false;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.plan = action.payload.subscription?.plan || 'pro';
        state.status = action.payload.subscription?.status || 'active';
        state.provider = action.payload.subscription?.provider || 'razorpay';
        state.startDate = action.payload.subscription?.startDate || null;
        state.endDate = action.payload.subscription?.endDate || null;
        state.autoRenew = action.payload.subscription?.autoRenew || false;
        state.upgradeSuccess = true;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to verify payment';
        state.upgradeSuccess = false;
      })
      // cancelUserSubscription
      .addCase(cancelUserSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelUserSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.plan = action.payload.plan || 'free';
        state.status = action.payload.status || 'inactive';
        state.provider = action.payload.provider || 'none';
        state.startDate = action.payload.startDate || null;
        state.endDate = action.payload.endDate || null;
        state.autoRenew = action.payload.autoRenew || false;
      })
      .addCase(cancelUserSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to cancel subscription';
      });
  },
});

export const { clearSubscriptionError, resetUpgradeSuccess } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;

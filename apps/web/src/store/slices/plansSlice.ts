import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

export type PlanStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Task {
  id: string;
  title: string;
  description?: string;
  content?: Record<string, unknown>;
  planId: string;
  status: PlanStatus;
  order: number;
  xpValue: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  title: string;
  description?: string;
  content?: Record<string, unknown>;
  userId: string;
  status: PlanStatus;
  xpEarned: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

interface PlansState {
  plans: Plan[];
  currentPlan: Plan | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: PlansState = {
  plans: [],
  currentPlan: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

export const fetchPlans = createAsyncThunk(
  'plans/fetchPlans',
  async (params: { page?: number; limit?: number; status?: PlanStatus }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());
      if (params.status) queryParams.set('status', params.status);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/plans?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const generatePlan = createAsyncThunk(
  'plans/generatePlan',
  async (prompt: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/plans/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate plan');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchPlanById = createAsyncThunk(
  'plans/fetchPlanById',
  async (id: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/plans/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch plan');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const plansSlice = createSlice({
  name: 'plans',
  initialState,
  reducers: {
    setPlans: (state, action: PayloadAction<Plan[]>) => {
      state.plans = action.payload;
    },
    setCurrentPlan: (state, action: PayloadAction<Plan | null>) => {
      state.currentPlan = action.payload;
    },
    addPlan: (state, action: PayloadAction<Plan>) => {
      state.plans.unshift(action.payload);
    },
    updatePlan: (state, action: PayloadAction<Plan>) => {
      const index = state.plans.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.plans[index] = action.payload;
      }
      if (state.currentPlan?.id === action.payload.id) {
        state.currentPlan = action.payload;
      }
    },
    deletePlan: (state, action: PayloadAction<string>) => {
      state.plans = state.plans.filter(p => p.id !== action.payload);
      if (state.currentPlan?.id === action.payload) {
        state.currentPlan = null;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlans.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.isLoading = false;
        state.plans = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(generatePlan.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(generatePlan.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(generatePlan.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPlanById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlanById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPlan = action.payload.data;
      })
      .addCase(fetchPlanById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setPlans, setCurrentPlan, addPlan, updatePlan, deletePlan, clearError } = plansSlice.actions;
export default plansSlice.reducer;

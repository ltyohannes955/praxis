import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/slices/authSlice';
import plansReducer from '@/store/slices/plansSlice';
import uiReducer from '@/store/slices/uiSlice';

function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      plans: plansReducer,
      ui: uiReducer,
    },
  });
}

export function renderWithProviders(ui: React.ReactElement, store = createTestStore()) {
  return {
    ...render(<Provider store={store}>{ui}</Provider>),
    store,
  };
}

describe('Auth Slice', () => {
  const store = createTestStore();

  it('should have initial state', () => {
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
  });
});

describe('Plans Slice', () => {
  const store = createTestStore();

  it('should have initial state', () => {
    const state = store.getState().plans;
    expect(state.plans).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });
});

describe('UI Slice', () => {
  const store = createTestStore();

  it('should have initial state', () => {
    const state = store.getState().ui;
    expect(state.sidebarOpen).toBe(true);
    expect(state.modalOpen).toBeNull();
    expect(state.notifications).toEqual([]);
  });

  it('should toggle sidebar', () => {
    const { toggleSidebar } = require('@/store/slices/uiSlice');
    store.dispatch(toggleSidebar());
    expect(store.getState().ui.sidebarOpen).toBe(false);
  });
});

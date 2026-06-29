import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';
import orgReducer from './orgSlice';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    org: orgReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface OrgState {
  selectedOrgId: number | null;
}

const initialState: OrgState = {
  selectedOrgId: null,
};

const orgSlice = createSlice({
  name: 'org',
  initialState,
  reducers: {
    setSelectedOrg: (state, action: PayloadAction<number>) => {
      state.selectedOrgId = action.payload;
    },
  },
});

export const { setSelectedOrg } = orgSlice.actions;
export default orgSlice.reducer;

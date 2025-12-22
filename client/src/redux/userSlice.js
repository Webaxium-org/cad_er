import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.loggedIn = true;
    },
    logOut: (state) => {
      state.user = null;
      state.loggedIn = false;
    },
  },
});

export const { setUser, logOut } = userSlice.actions;

export default userSlice.reducer;

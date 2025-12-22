import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

import loadingReducer from "./loadingSlice";
import alertReducer from "./alertSlice";
import userReducer from "./userSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["user"],
  // blacklist: ['loading', 'alert'],
};

const reducer = combineReducers({
  loading: loadingReducer,
  alert: alertReducer,
  user: userReducer,
});

const persistedReducer = persistReducer(persistConfig, reducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/PURGE",
        ], // ✅ Ignore redux-persist actions
      },
    }),
});

export const persistor = persistStore(store);

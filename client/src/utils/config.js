import axios from 'axios';
import { store } from '../redux/store';
import { setUser, logOut } from '../redux/userSlice';
import { tokenService } from '../services/tokenService'; // memory storage

const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // always send refresh cookie
});

// ---------------- REQUEST ----------------
axiosInstance.interceptors.request.use((config) => {
  const token = tokenService.get(); // memory token only

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

// ---------------- RESPONSE ----------------
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Important: always use raw axios for refresh
        const { data } = await axios.post(
          `${API_URL}/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = data.accessToken;
        const newUser = data.user;

        // save token in memory only
        tokenService.set(newAccessToken);

        // save user in redux
        store.dispatch(setUser(newUser));

        // retry request
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        tokenService.clear();
        store.dispatch(logOut());
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

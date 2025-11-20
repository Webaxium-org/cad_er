import axiosInstance from '../utils/config';

export const loginUser = (formData) => {
  return axiosInstance.post('login', formData);
};

export const googleLogin = (formData) => {
  return axiosInstance.post('google', formData);
};

export const logoutUser = () => {
  return axiosInstance.post('logout');
};

export const getDashboard = () => {
  return axiosInstance.get('/');
};

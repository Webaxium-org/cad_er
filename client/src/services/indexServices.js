import { axiosInstance } from "../utils/config";

export const loginUser = (formData) => {
  return axiosInstance.post("login", formData);
};

export const registerUser = (formData) => {
  return axiosInstance.post("register", formData);
};

export const googleLogin = (formData) => {
  return axiosInstance.post("google", formData);
};

export const logoutUser = () => {
  return axiosInstance.get("logout");
};

export const getDashboard = () => {
  return axiosInstance.get("/");
};

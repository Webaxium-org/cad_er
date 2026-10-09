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

export const registerAccountType = (formData) => {
  return axiosInstance.post("register-account-type", formData);
};

export const logoutUser = () => {
  return axiosInstance.get("logout");
};

export const getDashboard = () => {
  return axiosInstance.get("/");
};

export const contactForm = (formData) => {
  return axiosInstance.post("contact", formData);
};

export const scheduleDemoForm = (formData) => {
  return axiosInstance.post("schedule-demo", formData);
};

export const submitCareerApplication = (formData) => {
  return axiosInstance.post("careers/apply", formData);
};

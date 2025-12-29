import { axiosInstance } from "../utils/config";

export const getAllUsers = () => {
  return axiosInstance.get("users");
};

export const submitQuiz = (payload) => {
  return axiosInstance.patch(`users/quiz`, payload);
};

export const updateUserStatus = (id, status) => {
  return axiosInstance.patch(`users/${id}/status`, { status });
};

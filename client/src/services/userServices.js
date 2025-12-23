import { axiosInstance } from "../utils/config";

export const submitQuiz = (payload) => {
  return axiosInstance.patch(`users/quiz`, payload);
};

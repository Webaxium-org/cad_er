import { axiosInstance } from "../utils/config";

export const getSettings = () => axiosInstance.get("settings");
export const saveSettings = (settings) => axiosInstance.put("settings", { settings });

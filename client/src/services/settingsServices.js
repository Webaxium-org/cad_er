import { axiosInstance } from "../utils/config";

export const getSettings = () => axiosInstance.get("settings");
export const saveSettings = (settings) => axiosInstance.put("settings", { settings });
export const updateInstrument = (previousSerial, instrument) =>
  axiosInstance.patch("settings/instruments", { previousSerial, instrument });
export const updateSettingsFields = (section, group, values) =>
  axiosInstance.patch("settings/fields", { section, group, values });

import { axiosInstance } from "../utils/config";

export const getAllOrganizations = () => axiosInstance.get("organizations");

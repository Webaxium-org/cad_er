import { axiosInstance } from "../utils/config";

export const getAllTickets = () => {
  return axiosInstance.get("tickets");
};

export const getTicketById = (id) => {
  return axiosInstance.get(`tickets/${id}`);
};

export const createTicket = (ticketData) => {
  return axiosInstance.post("tickets", ticketData);
};

export const updateTicketStatus = (id, payload) => {
  return axiosInstance.patch(`tickets/${id}/status`, payload);
};

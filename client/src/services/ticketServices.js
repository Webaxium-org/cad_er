import { axiosInstance } from "../utils/config";

export const getAllTickets = () => {
  return axiosInstance.get("tickets");
};

export const getTicketById = (id) => {
  return axiosInstance.get(`tickets/${id}`);
};

export const createTicket = (ticketData, images = []) => {
  const form = new FormData();
  form.append("feedbackType", ticketData.feedbackType);
  form.append("description", ticketData.description);
  images.forEach((image) => form.append("images", image));
  return axiosInstance.post("tickets", form);
};

export const getTicketImageUrl = (ticketId, imageId) =>
  axiosInstance.get(`tickets/${ticketId}/images/${imageId}`);

export const updateTicketStatus = (id, payload) => {
  return axiosInstance.patch(`tickets/${id}/status`, payload);
};

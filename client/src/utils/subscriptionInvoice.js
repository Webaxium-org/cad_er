import { axiosInstance } from "./config";
import logoUrl from "../assets/logo/cader_logo_2.png";
import { renderSubscriptionInvoice } from "./subscriptionInvoiceDocument";

const loadLogo = () => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error("Invoice logo could not be loaded. Please try again."));
  image.src = logoUrl;
});

export const downloadSubscriptionInvoice = async id => {
  const [{ data }, { jsPDF }, { default: autoTable }, logo] = await Promise.all([
    axiosInstance.get(`subscriptions/me/invoices/${id}`), import("jspdf"), import("jspdf-autotable"), loadLogo(),
  ]);
  const pdf = renderSubscriptionInvoice(new jsPDF(), autoTable, data, logo);
  pdf.save(`${data.number.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`);
};

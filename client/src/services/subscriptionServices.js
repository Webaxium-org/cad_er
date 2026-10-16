import { axiosInstance } from "../utils/config";

export const getSubscription = () => axiosInstance.get("/subscriptions/me");
export const getSubscriptionPlans = () => axiosInstance.get("/subscriptions/plans");
export const createSubscriptionCheckout = (planCode, quoteKey) => axiosInstance.post("/subscriptions/checkout", { planCode, quoteKey });
export const verifySubscriptionCheckout = (response) => axiosInstance.post("/subscriptions/verify", response);
export const setupSubscriptionAutopay = (subscriptionRecordId) => axiosInstance.post("/subscriptions/autopay", { subscriptionRecordId });
export const cancelSubscription = () => axiosInstance.post("/subscriptions/cancel");

export const loadRazorpayCheckout = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve(window.Razorpay);
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.async = true;
  script.onload = () => window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Checkout could not be loaded"));
  script.onerror = () => reject(new Error("Checkout could not be loaded"));
  document.head.appendChild(script);
});

export const getAdminPlans = () => axiosInstance.get("/subscriptions/admin/plans");
export const getPlanHistory = (code) => axiosInstance.get(`/subscriptions/admin/plans/${code}/history`);
export const publishPlan = (code, data) => axiosInstance.post(`/subscriptions/admin/plans/${code}/versions`, data);

import { axiosInstance } from "../utils/config";

export const getSubscription = () => axiosInstance.get("/subscriptions/me");
export const getSubscriptionPlans = () => axiosInstance.get("/subscriptions/plans");
export const createSubscriptionCheckout = (planCode) => axiosInstance.post("/subscriptions/checkout", { planCode });
export const verifySubscriptionCheckout = (response) => axiosInstance.post("/subscriptions/verify", response);
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

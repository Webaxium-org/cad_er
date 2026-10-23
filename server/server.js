import "./config/env.js";
import app from "./app.js";
import connectDB from "./config/db.js";
import Subscription from "./models/subscription.js";
import CheckoutLock from "./models/checkoutLock.js";
import RazorpayEvent from "./models/razorpayEvent.js";
import Payment from "./models/payments.js";
import RazorpayPlan from "./models/razorpayPlan.js";
import User from "./models/user.js";
import OnboardingVerification from "./models/onboardingVerification.js";
import InvoiceCounter from "./models/invoiceCounter.js";
import { seedPlans } from "./services/subscriptionPlans.js";

const startServer = async () => {
  try {
    // 1. Connect to Database first
    await connectDB();
    await Promise.all([User.init(), Subscription.init(), CheckoutLock.init(), RazorpayEvent.init(), Payment.init(), RazorpayPlan.init(), OnboardingVerification.init()]);
    await seedPlans();
    await InvoiceCounter.updateOne({ _id: "payments" }, { $setOnInsert: { value: 0 } }, { upsert: true });

    const PORT = process.env.PORT || 5000;

    // 2. Start the listener
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Startup Error:", error);
    process.exit(1);
  }
};

startServer();

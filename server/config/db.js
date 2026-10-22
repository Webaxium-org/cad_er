import mongoose from "mongoose";
import { setServers } from "node:dns/promises";

const connectDB = async () => {
  try {
    // Optional override for environments whose default DNS cannot resolve Atlas SRV records.
    const dnsServers = process.env.DNS_SERVERS?.split(",")
      .map((server) => server.trim())
      .filter(Boolean);
    if (dnsServers?.length) setServers(dnsServers);

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1); // Stop the server on failure
  }
};

export default connectDB;

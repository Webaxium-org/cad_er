import mongoose from "mongoose";
export const pdfBucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "pdfExports" });
export const deletePdfFile = async (id) => {
  if (!id) return;
  // Remove partial uploads too, including chunks left by an interrupted process.
  await mongoose.connection.db.collection("pdfExports.chunks").deleteMany({ files_id: id });
  await mongoose.connection.db.collection("pdfExports.files").deleteOne({ _id: id });
};

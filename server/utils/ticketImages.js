import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({ region: process.env.AWS_REGION });
const bucket = () => {
  if (!process.env.TICKET_IMAGES_BUCKET || !process.env.AWS_REGION) {
    throw new Error("Ticket image storage is not configured");
  }
  return process.env.TICKET_IMAGES_BUCKET;
};

const actualType = (bytes) => {
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6))) return "image/gif";
  return null;
};

export const uploadTicketImages = async (files, userId) => {
  const uploaded = [];
  try {
    for (const file of files) {
      const contentType = actualType(file.buffer);
      if (!contentType || contentType !== file.mimetype) {
        const error = new Error("Only valid JPEG, PNG, WebP or GIF images are allowed");
        error.status = 400;
        throw error;
      }
      const key = `tickets/${userId}/${randomUUID()}`;
      await client.send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: file.buffer, ContentType: contentType }));
      uploaded.push({ key, name: file.originalname, contentType });
    }
    return uploaded;
  } catch (error) {
    await deleteTicketImages(uploaded);
    throw error;
  }
};

export const deleteTicketImages = async (images) => {
  await Promise.allSettled(images.map(({ key }) => client.send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }))));
};

export const getTicketImageUrl = (key) => getSignedUrl(
  client,
  new GetObjectCommand({ Bucket: bucket(), Key: key }),
  { expiresIn: 300 },
);

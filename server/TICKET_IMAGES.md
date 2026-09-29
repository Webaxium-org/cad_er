# Ticket image storage

Create a private S3 bucket and set these server environment variables:

```text
AWS_REGION=ap-south-1
TICKET_IMAGES_BUCKET=your-private-bucket-name
```

Provide AWS credentials through the default AWS credential chain (for example, an IAM role in production or `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` locally). The server identity needs `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` for `arn:aws:s3:::YOUR_BUCKET/tickets/*`. Keep S3 Block Public Access enabled. No browser CORS policy or public bucket access is needed: the API issues short-lived signed view URLs only after checking ticket access.

Install server dependencies with `npm install` after pulling these changes. Image uploads are optional; each ticket accepts up to five JPEG, PNG, WebP, or GIF files, each at most 5 MB.

import cors from 'cors';

const allowedOrigins = [process.env.CLIENT_URL, process.env.CLIENT_URL_2];

const configureCors = () =>
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

export default configureCors;

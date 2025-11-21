import jwt from 'jsonwebtoken';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: Number(process.env.TOKEN_EXPIRY_DAYS) * 24 * 60 * 60 * 1000,
  });

export default generateToken;

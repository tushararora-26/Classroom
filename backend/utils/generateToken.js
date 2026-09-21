import jwt from 'jsonwebtoken';

export const generateToken = (id, role, school) =>
  jwt.sign(
    { id: id.toString(), role, school: school.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

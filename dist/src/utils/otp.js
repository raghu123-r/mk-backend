import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';

const SALT_ROUNDS = 10;

export const generateOTP = (len = 6) => {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < len; i++) code += digits[Math.floor(Math.random() * 10)];
  return code;
};

/**
 * Hash OTP using bcrypt
 * @param {string} code - The OTP code to hash
 * @returns {Promise<string>} Hashed OTP
 */
export const hashOTP = async (code) => {
  return await bcrypt.hash(code, SALT_ROUNDS);
};

/**
 * Compare OTP with stored hash
 * @param {string} code - Plain text OTP
 * @param {string} hash - Stored hash
 * @returns {Promise<boolean>}
 */
export const compareOTP = async (code, hash) => {
  return await bcrypt.compare(code, hash);
};

export const expiresAt = (minutes = Number(process.env.OTP_TTL_MIN || process.env.OTP_EXP_MIN || 5)) =>
  dayjs().add(minutes, 'minute').toDate();

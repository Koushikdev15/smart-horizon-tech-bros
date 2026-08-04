import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRepository } from '../repositories/UserRepository';
import { RefreshToken } from '../models/RefreshToken';

export class AuthService {
  private userRepository = new UserRepository();

  async register(data: any) {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw { status: 400, message: 'User already exists', isOperational: true };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await this.userRepository.create({
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      role: data.role,
      passwordHash
    });

    return { user: { id: user._id, name: user.name, email: user.email, role: user.role } };
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.isActive) {
      throw { status: 401, message: 'Invalid credentials', isOperational: true };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw { status: 401, message: 'Invalid credentials', isOperational: true };
    }

    const payload = { id: user._id, role: user.role, iat: Math.floor(Date.now() / 1000) };
    const token = jwt.sign(payload, process.env.JWT_SECRET!);

    const refreshTokenString = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await RefreshToken.create({
      token: refreshTokenString,
      userId: user._id,
      expiresAt
    });

    return {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
      refreshToken: refreshTokenString
    };
  }
}

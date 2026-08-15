import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRepository } from '../repositories/UserRepository';
import { RefreshToken } from '../models/RefreshToken';
import { IUser } from '../models/User';

function toPublicUser(user: IUser) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    role: user.role,
    language: user.language,
    dateOfBirth: user.dateOfBirth,
    aadhaarLast4: user.aadhaarLast4,
    panLast4: user.panLast4,
    occupation: user.occupation,
    religion: user.religion,
    region: user.region,
    address: user.address,
    coordinates: user.coordinates,
    profilePhoto: user.profilePhoto,
    profileCompletion: user.profileCompletion,
  };
}

export class AuthService {
  private userRepository = new UserRepository();

  /** Signs a fresh access token + rotates a refresh token for the given user. */
  private async issueTokens(user: IUser) {
    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any,
    });

    const refreshTokenString = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await RefreshToken.create({
      token: refreshTokenString,
      userId: user._id,
      expiresAt,
    });

    return { token, refreshToken: refreshTokenString };
  }

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
      passwordHash,
      language: data.language,
      dateOfBirth: data.dateOfBirth,
      aadhaarLast4: data.aadhaarLast4,
      panLast4: data.panLast4,
      occupation: data.occupation,
      religion: data.religion,
      region: data.region,
      address: data.address,
      coordinates: data.coordinates,
      profileCompletion: data.profileCompletion,
    });

    const tokens = await this.issueTokens(user);
    return { user: toPublicUser(user), ...tokens };
  }

  async login(identifier: string, password: string) {
    const user = await this.userRepository.findByEmailOrMobile(identifier);
    if (!user || !user.isActive) {
      throw { status: 401, message: 'Invalid credentials', isOperational: true };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw { status: 401, message: 'Invalid credentials', isOperational: true };
    }

    const tokens = await this.issueTokens(user);
    return { user: toPublicUser(user), ...tokens };
  }

  /** Exchanges a valid, unexpired refresh token for a new access token, rotating it. */
  async refresh(refreshTokenString: string) {
    const stored = await RefreshToken.findOne({ token: refreshTokenString });
    if (!stored || stored.expiresAt < new Date()) {
      throw { status: 401, message: 'Invalid or expired refresh token', isOperational: true };
    }

    const user = await this.userRepository.findById(stored.userId.toString());
    if (!user || !user.isActive) {
      throw { status: 401, message: 'Invalid or expired refresh token', isOperational: true };
    }

    await stored.deleteOne();
    const tokens = await this.issueTokens(user);
    return { user: toPublicUser(user), ...tokens };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw { status: 404, message: 'User not found', isOperational: true };
    }
    return toPublicUser(user);
  }
}

import { User, IUser } from '../models/User';

export class UserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() });
  }

  /** Login accepts either the account email or mobile number as the identifier. */
  async findByEmailOrMobile(identifier: string): Promise<IUser | null> {
    return User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { mobile: identifier }],
    });
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return user.save();
  }

  async updateById(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  }
}

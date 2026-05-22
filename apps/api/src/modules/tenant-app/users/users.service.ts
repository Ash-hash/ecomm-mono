/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, NotFoundException } from '@nestjs/common';
import { getModel } from 'src/common/utils/get-model.util';
import { UserSchema } from './user.schema';
import { getTenantModel } from 'src/common/utils/tenant-model.util';
import { paginate } from 'src/common/helpers/paginate.helper';

@Injectable()
export class UsersService {
  // ─────────────────────────────────────────────
  // GET ALL USERS (TENANT ISOLATED)
  // ─────────────────────────────────────────────
  async findAll(ctx: any, query: any) {
    const User = getTenantModel(ctx.db, 'User', UserSchema);
    const filter: any = {};
    if (query.role) filter.role = query.role;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
      ];
    }
    return paginate(User, filter, {
      page: query.page,
      limit: query.limit,
      sort: { createdAt: -1 },
    });
  }

  // ─────────────────────────────────────────────
  // GET SINGLE USER
  // ─────────────────────────────────────────────
  async findOne(ctx: any, id: string) {
    const User = getTenantModel(ctx.db, 'User', UserSchema);

    const user = await User.findById(id).select('-passwordHash');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ─────────────────────────────────────────────
  // CREATE USER (ADMIN USE)
  // ─────────────────────────────────────────────
  async create(ctx: any, dto: any) {
    const User = getModel(ctx, 'User', UserSchema);

    const user = await User.create({
      ...dto,
      role: dto.role || 'customer',
    });

    return user;
  }

  // ─────────────────────────────────────────────
  // UPDATE USER
  // ─────────────────────────────────────────────
  async update(ctx: any, id: string, dto: any) {
    const User = getModel(ctx, 'User', UserSchema);

    const user = await User.findByIdAndUpdate(id, dto, {
      new: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ─────────────────────────────────────────────
  // DELETE USER
  // ─────────────────────────────────────────────
  async remove(ctx: any, id: string) {
    const User = getModel(ctx, 'User', UserSchema);

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return { message: 'User deleted' };
  }
}

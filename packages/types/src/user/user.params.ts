import { PaginationParams } from '../common';
import { UserStatus, UserPlan } from './user.types';

export interface UsersParams extends PaginationParams {
  status?: UserStatus;
  plan?: UserPlan;
}
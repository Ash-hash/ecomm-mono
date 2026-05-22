import { PaginationParams } from '../common';
import { UserPlan } from '../user';
import { SubStatus} from './subscription.types';

export interface SubsParams extends PaginationParams {
  status?: SubStatus;
  plan?: UserPlan;
}
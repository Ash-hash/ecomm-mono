import { Injectable } from '@nestjs/common';
import { getModel } from 'src/common/utils/get-model.util';
import { StoreConfigSchema } from './store-config.schema';

const NESTED_KEYS = [
  'gateways',
  'smtp',
  'brandConfig',
  'storeHeaderConfig',
  'storeFooterConfig',
  'seo',
] as const;

@Injectable()
export class StoreService {
  async getConfig(req: any) {
    const Store = getModel(req, 'StoreConfig', StoreConfigSchema);

    let config = await Store.findOne().lean();

    if (!config) {
      config = await Store.create({});
    }

    return { data: config };
  }

  async updateConfig(req: any, dto: any) {
    const Store = getModel(req, 'StoreConfig', StoreConfigSchema);

    let config = await Store.findOne();

    if (!config) {
      const created = await Store.create(dto);
      return { message: 'Created', data: created };
    }

    for (const key of NESTED_KEYS) {
      if (dto[key] !== undefined) {
        config[key] = { ...config[key], ...dto[key] };
        delete dto[key];
      }
    }

    Object.assign(config, dto);
    await config.save();

    return { message: 'Updated', data: config };
  }
}
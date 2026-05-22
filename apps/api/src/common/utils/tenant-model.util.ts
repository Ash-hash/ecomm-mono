// src/common/utils/tenant-model.util.ts

import { Schema, Model } from 'mongoose';

export function getTenantModel(
  db: any,
  name: string,
  schema: Schema,
): Model<any> {
  return db.models[name] || db.model(name, schema);
}
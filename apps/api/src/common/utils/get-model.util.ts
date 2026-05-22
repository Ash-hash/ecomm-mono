// src/common/utils/get-model.util.ts
import { Schema, Model } from 'mongoose';

export function getModel(req: any, name: string, schema: Schema): Model<any> {
  return req.db.models[name] || req.db.model(name, schema);
}
import { Model } from 'mongoose';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page:       number;
    limit:      number;
    total:      number;
    totalPages: number;
  };
}

export async function paginate<T>(
  model: any,
  filter: any,
  options: {
    page: number;
    limit: number;
    sort?: any;
    populate?: any;
  },
) {
  const { page, limit, sort, populate } = options;

  const skip = (page - 1) * limit;

  let query = model.find(filter).sort(sort).skip(skip).limit(limit);

  if (populate) {
    query = query.populate(populate);
  }

  const [data, total] = await Promise.all([
    query.lean(),
    model.countDocuments(filter),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
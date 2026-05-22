// src/common/decorators/request-context.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RequestContext = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();

    return {
      req,
      user: req.user,
      tenant: req.tenant,
      tenantId: req.tenant?._id?.toString(),
      db: req.db,
    };
  },
);
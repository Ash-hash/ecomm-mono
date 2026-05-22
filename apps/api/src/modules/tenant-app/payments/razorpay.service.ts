// src/modules/tenant-app/payments/razorpay.service.ts
import { Injectable } from '@nestjs/common';
import Razorpay from 'razorpay';

@Injectable()
export class RazorpayService {
  getInstance(tenant: any) {
    if (!tenant?.razorpay?.keyId || !tenant?.razorpay?.keySecret) {
      throw new Error('Razorpay credentials not configured for this tenant');
    }

    return new Razorpay({
      key_id: tenant.razorpay.keyId,
      key_secret: tenant.razorpay.keySecret,
    });
  }
}
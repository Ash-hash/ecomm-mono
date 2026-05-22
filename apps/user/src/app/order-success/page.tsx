'use client';

import Link from 'next/link';
import Image from 'next/image';
import { redirect, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Package,
  ArrowRight,
  Clock,
  Mail,
  ShieldCheck,
  Truck,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

import { useStoreInfo ,  useCustomerProfile  } from '@/src/hooks';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');
  const router = useRouter();

  const { data: store } = useStoreInfo();
  const { data: profile } = useCustomerProfile();
  // ── 1. Immediate hard redirect if no order number (your exact problem solved) ──

  const firstName = profile?.name?.split(' ')[0] || 'there';

  // One-time confetti + subtle sparkle
  useEffect(() => {
    const timer = setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a78bfa', '#f472b6', '#60a5fa'],
      });
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem('lastOrder');

    if (!orderNumber || stored !== orderNumber) {
      router.replace('/');
    }
  }, [orderNumber]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50/70 to-white py-12 px-5 md:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="bg-white border border-neutral-100/80 rounded-2xl shadow-xl shadow-indigo-100/30 overflow-hidden"
        >
          {/* Hero / Success banner */}
          <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 px-8 py-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute -left-10 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -right-16 bottom-10 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            </div>

            <motion.div variants={item}>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/15 backdrop-blur-sm rounded-full mb-6 border border-white/20">
                <CheckCircle2
                  size={44}
                  className="text-white"
                  strokeWidth={1.4}
                />
              </div>
            </motion.div>

            <motion.h1
              variants={item}
              className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3"
            >
              Order Confirmed, {firstName}! 🎉
            </motion.h1>

            <motion.p
              variants={item}
              className="text-indigo-100/90 text-lg md:text-xl font-light max-w-xl mx-auto"
            >
              Thank you for shopping with{' '}
              <span className="font-medium text-white">
                {store?.storeName || 'us'}
              </span>
            </motion.p>
          </div>

          {/* Main content */}
          <div className="p-8 md:p-10">
            <motion.div variants={item} className="text-center mb-10">
              {orderNumber ? (
                <div className="inline-block bg-neutral-50 border border-neutral-200 rounded-xl px-6 py-4 mb-6">
                  <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium mb-1">
                    Order Number
                  </p>
                  <p className="font-mono text-2xl font-bold text-neutral-900 tracking-tight">
                    {orderNumber}
                  </p>
                </div>
              ) : null}

              <p className="text-neutral-600 text-base leading-relaxed max-w-2xl mx-auto">
                We’ve received your order and we’re getting it ready. A
                confirmation email with all the details has been sent to{' '}
                <strong className="text-neutral-900">
                  {profile?.email || 'your email address'}
                </strong>
                .
              </p>
            </motion.div>

            {/* Quick status cards */}
            <motion.div
              variants={item}
              className="grid sm:grid-cols-3 gap-5 mb-12"
            >
              {[
                {
                  icon: Clock,
                  title: 'Processing',
                  desc: 'Order confirmed',
                  color: 'text-amber-600',
                },
                {
                  icon: Truck,
                  title: 'Preparing & Shipping',
                  desc: '1–3 business days',
                  color: 'text-blue-600',
                },
                {
                  icon: Mail,
                  title: 'Updates',
                  desc: 'Track via email & account',
                  color: 'text-emerald-600',
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="bg-neutral-50/70 border border-neutral-100 rounded-xl p-5 text-center"
                >
                  <card.icon
                    size={28}
                    className={`${card.color} mx-auto mb-3`}
                    strokeWidth={1.6}
                  />
                  <h3 className="font-semibold text-neutral-800 mb-1">
                    {card.title}
                  </h3>
                  <p className="text-sm text-neutral-500">{card.desc}</p>
                </div>
              ))}
            </motion.div>

            {/* Trust & Info */}
            <motion.div
              variants={item}
              className="bg-gradient-to-r from-neutral-50 to-neutral-100/60 rounded-xl p-7 border border-neutral-200/70 mb-10"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center border border-neutral-200">
                    <ShieldCheck
                      size={28}
                      className="text-emerald-600"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-neutral-900 mb-2">
                    You’re in good hands
                  </h3>
                  <ul className="space-y-2.5 text-sm text-neutral-600">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2
                        size={16}
                        className="text-emerald-600 flex-shrink-0"
                      />
                      Secure payment processed
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2
                        size={16}
                        className="text-emerald-600 flex-shrink-0"
                      />
                      {store?.freeShippingThreshold
                        ? `Free shipping on orders over ₹${store.freeShippingThreshold}`
                        : 'Fast & reliable shipping'}
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2
                        size={16}
                        className="text-emerald-600 flex-shrink-0"
                      />
                      Easy returns & support
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              variants={item}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/account/orders"
                className="group relative flex items-center justify-center gap-3 px-8 py-3.5 bg-neutral-900 text-white font-medium rounded-xl hover:bg-neutral-800 transition-all duration-300 shadow-sm hover:shadow active:scale-[0.98]"
              >
                <Package size={18} strokeWidth={1.7} />
                Track Your Order
                <ChevronRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>

              <Link
                href="/products"
                className="group flex items-center justify-center gap-3 px-8 py-3.5 border-2 border-neutral-800 text-neutral-800 font-medium rounded-xl hover:bg-neutral-50 transition-all duration-300 hover:shadow-sm active:scale-[0.98]"
              >
                Continue Shopping
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </motion.div>
          </div>

          {/* Footer subtle branding */}
          <div className="border-t border-neutral-100 bg-neutral-50/60 px-8 py-6 text-center text-sm text-neutral-500">
            <p>
              Questions? Contact us at{' '}
              <a
                href={`mailto:${store?.storeEmail || 'support@example.com'}`}
                className="text-indigo-600 hover:underline font-medium"
              >
                {store?.storeEmail || 'support@store.com'}
              </a>
            </p>
            <p className="mt-1.5">
              Thank you for choosing{' '}
              <strong>{store?.storeName || 'our store'}</strong>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

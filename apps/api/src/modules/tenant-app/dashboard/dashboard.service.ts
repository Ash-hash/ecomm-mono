import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { getModel } from '../../../common/utils/get-model.util';
import { ProductSchema } from '../products/product.schema';
import { OrderSchema } from '../orders/order.schema';
import { UserSchema } from '../users/user.schema';

@Injectable()
export class DashboardService {
  async getStats(req: any) {
    const Product = getModel(req, 'Product', ProductSchema);
    const Order = getModel(req, 'Order', OrderSchema);
    const User = getModel(req, 'User', UserSchema);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    const pctDelta = (current: number, previous: number) => {
      if (!previous) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      revenueMtdAgg,
      revenuePrevAgg,
      ordersMtd,
      ordersPrev,
      customersMtd,
      customersPrev,
      revenueChart,
      statusAgg,
      topProductAgg,
      recentOrders,
    ] = await Promise.all([
      Product.countDocuments({ deleted: { $ne: true } }),
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: monthStart } } },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            createdAt: { $gte: prevMonthStart, $lt: prevMonthEnd },
          },
        },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: monthStart } }),
      Order.countDocuments({ createdAt: { $gte: prevMonthStart, $lt: prevMonthEnd } }),
      User.countDocuments({ role: 'customer', createdAt: { $gte: monthStart } }),
      User.countDocuments({
        role: 'customer',
        createdAt: { $gte: prevMonthStart, $lt: prevMonthEnd },
      }),
      Order.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            createdAt: {
              $gte: new Date(now.getFullYear(), now.getMonth() - 11, 1),
            },
          },
        },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            value: { $sum: '$total' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Order.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.productName' },
            revenue: { $sum: '$items.total' },
            orders: { $sum: '$items.quantity' },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .select('orderNumber customerName total status createdAt')
        .lean(),
    ]);

    const revenueMtd = revenueMtdAgg[0]?.total ?? 0;
    const revenuePrev = revenuePrevAgg[0]?.total ?? 0;
    const avgOrderValue = totalOrders ? revenueMtd / totalOrders : 0;
    const avgOrderValuePrev = ordersPrev
      ? (revenuePrevAgg[0]?.total ?? 0) / ordersPrev
      : 0;
    const totalStatusCount =
      statusAgg.reduce((sum: number, item: any) => sum + item.count, 0) || 1;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartMap = new Map(
      revenueChart.map((row: any) => [
        `${row._id.year}-${row._id.month}`,
        row.value,
      ]),
    );
    const normalizedChart = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      return {
        month: monthNames[date.getMonth()],
        value: chartMap.get(key) ?? 0,
      };
    });

    return {
      data: {
        revenue: { value: revenueMtd, delta: pctDelta(revenueMtd, revenuePrev) },
        orders: { value: totalOrders, delta: pctDelta(ordersMtd, ordersPrev) },
        customers: {
          value: totalCustomers,
          delta: pctDelta(customersMtd, customersPrev),
        },
        avgOrderValue: {
          value: Number(avgOrderValue.toFixed(2)),
          delta: pctDelta(avgOrderValue, avgOrderValuePrev),
        },
        products: totalProducts,
        revenueChart: normalizedChart,
        orderStatusBreakdown: statusAgg.map((item: any) => ({
          status: item._id ?? 'pending',
          count: item.count,
          pct: Math.round((item.count / totalStatusCount) * 100),
        })),
        topProducts: topProductAgg.map((item: any) => ({
          id: item._id instanceof Types.ObjectId ? item._id.toString() : String(item._id),
          name: item.name,
          revenue: item.revenue,
          orders: item.orders,
        })),
        recentOrders: recentOrders.map((order: any) => ({
          id: order.orderNumber ?? order._id.toString(),
          customer: order.customerName,
          total: order.total,
          status: order.status,
          type: 'order',
          createdAt: order.createdAt?.toISOString?.() ?? new Date().toISOString(),
        })),
      },
    };
  }
}

export interface DashboardStats {
  revenue: { value: number; delta: number };
  orders: { value: number; delta: number };
  customers: { value: number; delta: number };
  avgOrderValue: { value: number; delta: number };

  revenueChart: { month: string; value: number }[];

  orderStatusBreakdown: {
    status: string;
    count: number;
    pct: number;
  }[];

  topProducts: {
    id: string;
    name: string;
    revenue: number;
    orders: number;
  }[];

  recentOrders: {
    id: string;
    customer: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
}
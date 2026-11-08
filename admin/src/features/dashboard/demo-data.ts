/**
 * Explicitly illustrative UI-only dataset. Never describe these values as actual store analytics.
 * Replace with validated Laravel reporting endpoints after contract review.
 */
export const dashboardDemo = {
  metrics: [
    {
      label: "Total orders",
      value: "42,750",
      delta: "+5.0%",
      positive: true,
      caption: "vs. previous period",
      icon: "cart",
    },
    {
      label: "Total customers",
      value: "82,365",
      delta: "−1.5%",
      positive: false,
      caption: "vs. previous period",
      icon: "users",
    },
    {
      label: "Unique customers",
      value: "18,642",
      delta: "+3.1%",
      positive: true,
      caption: "vs. previous period",
      icon: "heart",
    },
    {
      label: "Total sales",
      value: "৳50,354",
      delta: "+5.4%",
      positive: true,
      caption: "vs. previous period",
      icon: "chart",
    },
  ],
  revenue: [30, 50, 43, 61, 36, 70, 55],
  income: [20, 35, 45, 30, 60, 41, 65],
  traffic: [
    { label: "Direct", count: 700, color: "#f3227b" },
    { label: "Google", count: 600, color: "#fe64a6" },
    { label: "Social media", count: 500, color: "#df91e8" },
    { label: "Referral", count: 400, color: "#ab52dd" },
    { label: "Campaigns", count: 300, color: "#ffd0e5" },
  ],
  bestSellers: [
    {
      name: "Vitamin C Serum",
      code: "PROD211",
      sold: "1,248",
      change: "+18%",
      emoji: "🧴",
    },
    {
      name: "Hydrating Face Cream",
      code: "PROD206",
      sold: "986",
      change: "+40%",
      emoji: "🌼",
    },
    {
      name: "Keratin Shampoo",
      code: "PROD208",
      sold: "842",
      change: "+30%",
      emoji: "🧴",
    },
    {
      name: "Matte Lipstick",
      code: "PROD212",
      sold: "736",
      change: "+15.1%",
      emoji: "💄",
    },
    {
      name: "Aloe Vera Gel",
      code: "PROD212",
      sold: "612",
      change: "+12.5%",
      emoji: "🌿",
    },
  ],
  weeklyOrders: [12, 19, 4, 17, 28, 24, 7],
  weeklyRevenue: [30, 28, 5, 5, 20, 3, 10],
  orders: [
    {
      id: "#359874",
      customer: "Sarah Rahman",
      product: "Vitamin C Serum",
      quantity: 1,
      total: "৳1,200.00",
      status: "Confirmed",
    },
    {
      id: "#359875",
      customer: "Mehedi Khan",
      product: "Hydrating Face Cream",
      quantity: 3,
      total: "৳750.00",
      status: "Shipped",
    },
    {
      id: "#359876",
      customer: "Nusrat Tabassum",
      product: "Matte Lipstick",
      quantity: 2,
      total: "৳600.00",
      status: "Processing",
    },
  ],
} as const;

import {
  MetricCards,
  RevenueChart,
  TrafficSources,
  TopProducts,
  WeeklySales,
  CategoryHighlights,
  PromoCard,
  RecentOrders,
  SummaryCards,
} from "@/components/dashboard/dashboard-widgets";
import { PeriodSelect } from "@/components/dashboard/period-select";

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <div className="heading-eyebrow">STORE OVERVIEW</div>
          <h1>Dashboard</h1>
          <p>Welcome to your GlowCare workspace.</p>
        </div>
        <PeriodSelect />
      </div>
      <div className="dashboard-columns">
        <div className="dashboard-primary">
          <MetricCards />
          <div className="chart-grid">
            <RevenueChart />
            <TrafficSources />
          </div>
          <div className="detail-grid">
            <TopProducts />
            <WeeklySales />
          </div>
          <RecentOrders />
        </div>
        <aside className="dashboard-rail" aria-label="Store highlights">
          <PromoCard />
          <CategoryHighlights />
          <SummaryCards />
        </aside>
      </div>
    </div>
  );
}

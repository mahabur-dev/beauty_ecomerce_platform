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

/** Visual preview only. All figures live in a typed fixture until Laravel analytics APIs are connected. */
export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <div className="heading-eyebrow">STORE OVERVIEW</div>
          <h1>Dashboard</h1>
          <p>Welcome to your GlowCare workspace.</p>
        </div>
        <div className="dashboard-date">Preview period · Last 7 days</div>
      </div>
      <div className="preview-notice" role="status">
        <strong>Design preview</strong> · Sample metrics and order records are
        illustrative. No live business analytics are connected yet.
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

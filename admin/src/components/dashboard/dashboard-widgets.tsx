import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { dashboardDemo } from "@/features/dashboard/demo-data";

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`dashboard-panel ${className}`} aria-label={title}>
      <div className="panel-heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const ranges = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function linePath(points: readonly number[], width = 600, height = 190) {
  return points
    .map(
      (y, i) =>
        `${i ? "L" : "M"} ${20 + i * ((width - 40) / (points.length - 1))} ${height - (y / 80) * (height - 20)}`,
    )
    .join(" ");
}

export function MetricCards() {
  return (
    <div className="metrics-grid">
      {dashboardDemo.metrics.map((metric) => (
        <article className="metric-card" key={metric.label}>
          <div className="metric-top">
            <span className="metric-icon">
              <Icon name={metric.icon as IconName} size={19} />
            </span>
            <span className="metric-label">{metric.label}</span>
          </div>
          <div className="metric-bottom">
            <strong>{metric.value}</strong>
            <span
              className={
                metric.positive ? "metric-positive" : "metric-negative"
              }
            >
              {metric.delta}
            </span>
          </div>
          <div className="metric-caption">{metric.caption}</div>
        </article>
      ))}
    </div>
  );
}

export function RevenueChart() {
  const primary = linePath(dashboardDemo.revenue);
  const secondary = linePath(dashboardDemo.income);
  return (
    <Panel
      title="Total revenue"
      action={
        <span className="chart-legend">
          <span className="legend-pink" />
          Orders <span className="legend-purple" /> Income
        </span>
      }
      className="revenue-panel"
    >
      <div
        className="revenue-graph"
        role="img"
        aria-label="Illustrative weekly orders and income trend lines, Monday to Sunday"
      >
        <div className="graph-yaxis">
          <span>80</span>
          <span>60</span>
          <span>40</span>
          <span>20</span>
          <span>0</span>
        </div>
        <div className="graph-body">
          <svg
            viewBox="0 0 600 190"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1">
                <stop stopColor="#fb398e" stopOpacity=".16" />
                <stop offset="1" stopColor="#fb398e" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`${primary} L580 190 L20 190 Z`}
              fill="url(#revenue-fill)"
            />
            <path
              d={secondary}
              stroke="#7f39d9"
              strokeWidth="3"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={primary}
              stroke="#ef2784"
              strokeWidth="3"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
            {dashboardDemo.revenue.map((v, i) => (
              <circle
                key={`p-${i}`}
                cx={20 + (i * 560) / 6}
                cy={190 - (v / 80) * 170}
                r="4.3"
                fill="#ef2784"
                stroke="white"
                strokeWidth="1.4"
              />
            ))}
            {dashboardDemo.income.map((v, i) => (
              <circle
                key={`s-${i}`}
                cx={20 + (i * 560) / 6}
                cy={190 - (v / 80) * 170}
                r="4.3"
                fill="#7f39d9"
                stroke="white"
                strokeWidth="1.4"
              />
            ))}
          </svg>
          <div className="graph-xaxis">
            {ranges.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function TrafficSources() {
  const gradient = dashboardDemo.traffic.reduce(
    (s, part) => {
      const end = s.offset + part.count / 25;
      return {
        offset: end,
        stops: [...s.stops, `${part.color} ${s.offset}% ${end}%`],
      };
    },
    { offset: 0, stops: [] as string[] },
  );
  return (
    <Panel
      title="Traffic sources"
      action={<span className="text-action">Overview</span>}
      className="traffic-panel"
    >
      <div className="traffic-content">
        <div
          className="donut"
          style={{ background: `conic-gradient(${gradient.stops.join(", ")})` }}
          role="img"
          aria-label="Illustrative traffic: direct 28 percent, Google 24 percent, social 20 percent, referrals 16 percent, campaigns 12 percent"
        >
          <div className="donut-inner">
            <strong>2,500</strong>
            <span>Sources</span>
          </div>
        </div>
        <ul className="traffic-list">
          {dashboardDemo.traffic.map((t) => (
            <li key={t.label}>
              <span
                className="traffic-dot"
                style={{ backgroundColor: t.color }}
              />
              <span>{t.label}</span>
              <strong>{t.count.toLocaleString()}</strong>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

export function TopProducts() {
  return (
    <Panel
      title="Top selling items"
      action={<span className="text-action">This week</span>}
      className="products-panel"
    >
      <ul className="top-products">
        {dashboardDemo.bestSellers.map((item) => (
          <li key={item.name}>
            <span className="product-avatar" aria-hidden="true">
              {item.emoji}
            </span>
            <span className="top-product-name">
              <strong>{item.name}</strong>
              <small>ID: {item.code}</small>
            </span>
            <span className="top-product-sold">{item.sold}</span>
            <span className="product-change">{item.change}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function WeeklySales() {
  return (
    <Panel
      title="Weekly performance"
      action={<span className="chip-select">Last 7 days</span>}
      className="weekly-panel"
    >
      <div
        className="bar-chart"
        role="img"
        aria-label="Illustrative weekly comparative orders and revenue bar chart"
      >
        <div className="bar-chart-lines" />
        {ranges.map((day, i) => (
          <div className="bar-group" key={day}>
            <div className="bar-pair">
              <span
                style={{
                  height: `${((dashboardDemo.weeklyOrders[i] ?? 0) / 30) * 100}%`,
                }}
              />
              <span
                style={{
                  height: `${((dashboardDemo.weeklyRevenue[i] ?? 0) / 30) * 100}%`,
                }}
              />
            </div>
            <span className="bar-day">{day}</span>
          </div>
        ))}
      </div>
      <div className="bar-legend">
        <span className="legend-pink" />
        Orders <span className="legend-purple" />
        Revenue
      </div>
    </Panel>
  );
}

const categories = [
  { name: "Skin care", icon: "🧴", count: "120+" },
  { name: "Makeup", icon: "💄", count: "150+" },
  { name: "Hair care", icon: "🌸", count: "95+" },
  { name: "Body care", icon: "🧼", count: "80+" },
];
export function CategoryHighlights() {
  return (
    <Panel
      title="Top categories"
      action={<span className="text-action">Featured</span>}
      className="category-panel"
    >
      <div className="category-grid">
        {categories.map((c) => (
          <div className="category-tile" key={c.name}>
            <div className="category-art" aria-hidden="true">
              {c.icon}
            </div>
            <strong>{c.name}</strong>
            <span>{c.count} products</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function PromoCard() {
  return (
    <aside className="promo-card" aria-label="GlowCare promotional preview">
      <div className="promo-brand">
        <Icon name="sparkles" size={16} /> GlowCare
      </div>
      <span className="promo-eyebrow">NEW ARRIVALS</span>
      <strong>
        Radiate your
        <br />
        natural glow
      </strong>
      <p>Beauty essentials, made for you</p>
      <span className="promo-pill">Sample campaign</span>
      <div className="cosmetic-bottle bottle-one" aria-hidden="true" />
      <div className="cosmetic-bottle bottle-two" aria-hidden="true" />
      <span className="promo-bloom" aria-hidden="true">
        ✿
      </span>
    </aside>
  );
}

export function RecentOrders() {
  return (
    <Panel
      title="Recent orders"
      action={<span className="chip-select">Preview data</span>}
      className="orders-panel"
    >
      <div className="table-scroll">
        <table className="orders-table">
          <thead>
            <tr>
              <th scope="col">Order ID</th>
              <th scope="col">Customer</th>
              <th scope="col">Product</th>
              <th scope="col">Qty</th>
              <th scope="col">Total</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {dashboardDemo.orders.map((o) => (
              <tr key={o.id}>
                <td className="order-id">{o.id}</td>
                <td>{o.customer}</td>
                <td>{o.product}</td>
                <td>×{o.quantity}</td>
                <td className="order-total">{o.total}</td>
                <td>
                  <span
                    className={`order-status status-${o.status.toLowerCase()}`}
                  >
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function SummaryCards() {
  return (
    <div className="summary-grid">
      <div className="summary-tile">
        <Icon name="award" />
        <strong>3,764</strong>
        <span>Reward points</span>
      </div>
      <div className="summary-tile">
        <Icon name="refresh" />
        <strong>56</strong>
        <span>Return requests</span>
      </div>
      <div className="summary-tile">
        <Icon name="warning" />
        <strong>4</strong>
        <span>Low-stock items</span>
      </div>
      <div className="summary-tile">
        <Icon name="cancel" />
        <strong>18</strong>
        <span>Cancelled orders</span>
      </div>
    </div>
  );
}

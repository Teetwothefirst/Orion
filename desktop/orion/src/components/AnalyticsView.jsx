import React, { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, ShoppingBag, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, Clock } from 'lucide-react';

export const AnalyticsView = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const [selectedReport, setSelectedReport] = useState('overview');

  // SVG Chart data path points
  // 7 days of weekly sales
  const salesData = [12000, 24000, 18000, 35000, 48000, 38000, 62000];
  const maxVal = Math.max(...salesData);
  const chartHeight = 160;
  const chartWidth = 500;
  
  // Calculate path
  const points = salesData.map((val, index) => {
    const x = (index / (salesData.length - 1)) * chartWidth;
    const y = chartHeight - (val / maxVal) * (chartHeight - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${chartHeight} ${points} ${chartWidth},${chartHeight}`;

  return (
    <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
      {/* Column 2: Sidebar (Reports Sections) */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} data-no-drag>
        <div className="sidebar-header">
          <span className="sidebar-title">Analytics Reports</span>
        </div>
        <div className="sidebar-content" style={{ padding: '12px' }}>
          {[
            { id: 'overview', label: 'Dashboard Overview' },
            { id: 'sales', label: 'Sales & Revenue' },
            { id: 'products', label: 'Top Products' },
            { id: 'performance', label: 'Escrow Health' }
          ].map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: selectedReport === report.id ? '600' : '400',
                backgroundColor: selectedReport === report.id ? 'var(--color-primary-light)' : 'transparent',
                color: selectedReport === report.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                marginBottom: '4px',
                transition: 'all var(--duration-fast)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <BarChart3 size={14} />
              <span>{report.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Column 3: Main dashboard area */}
      <div className="main-content" style={{ padding: '24px', overflowY: 'auto' }} data-no-drag>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
              Vendor Analytics
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Real-time insights on sales, escrow releases, and inventory volume.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '6px 12px', borderRadius: '10px' }}>
              <Calendar size={14} />
              <span>Last 7 Days</span>
            </div>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {/* Card 1 */}
          <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Gross Revenue</span>
              <div style={{ width: '28px', height: '28px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                <DollarSign size={14} />
              </div>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-text)', margin: '0 0 4px 0' }}>₦348,000</h3>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-online)', fontWeight: '600' }}>
              <ArrowUpRight size={12} />
              +14.2% from last week
            </span>
          </div>

          {/* Card 2 */}
          <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Completed Sales</span>
              <div style={{ width: '28px', height: '28px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                <ShoppingBag size={14} />
              </div>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-text)', margin: '0 0 4px 0' }}>18 Orders</h3>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-online)', fontWeight: '600' }}>
              <ArrowUpRight size={12} />
              +8.5% from last week
            </span>
          </div>

          {/* Card 3 */}
          <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Funds In Escrow</span>
              <div style={{ width: '28px', height: '28px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                <Clock size={14} />
              </div>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-text)', margin: '0 0 4px 0' }}>₦82,500</h3>
            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>3 pending releases</span>
          </div>

          {/* Card 4 */}
          <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Active Listings</span>
              <div style={{ width: '28px', height: '28px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                <Package size={14} />
              </div>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--color-text)', margin: '0 0 4px 0' }}>12 Items</h3>
            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>98% in-stock availability</span>
          </div>
        </div>

        {/* Chart View */}
        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '16px' }}>Weekly Sales Performance</h3>
          
          <div style={{ display: 'flex', width: '100%', height: `${chartHeight}px`, position: 'relative' }}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1={chartHeight / 4} x2={chartWidth} y2={chartHeight / 4} stroke="var(--color-border-light)" strokeWidth={1} strokeDasharray="3 3" />
              <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="var(--color-border-light)" strokeWidth={1} strokeDasharray="3 3" />
              <line x1="0" y1={chartHeight * 0.75} x2={chartWidth} y2={chartHeight * 0.75} stroke="var(--color-border-light)" strokeWidth={1} strokeDasharray="3 3" />

              {/* Gradient Area */}
              <polygon points={areaPoints} fill="url(#chartGradient)" />

              {/* Connected Line */}
              <polyline points={points} fill="none" stroke="var(--color-primary)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

              {/* Data points */}
              {salesData.map((val, index) => {
                const x = (index / (salesData.length - 1)) * chartWidth;
                const y = chartHeight - (val / maxVal) * (chartHeight - 20) - 10;
                return (
                  <g key={index}>
                    <circle cx={x} cy={y} r={5} fill="var(--color-surface)" stroke="var(--color-primary)" strokeWidth={3} />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* X Axis Labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        {/* Top Performing Table */}
        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text)' }}>Top Performing Products</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-surface-hover)', textAlign: 'left' }}>
                <th style={{ padding: '12px 20px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Product</th>
                <th style={{ padding: '12px 20px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Sales Volume</th>
                <th style={{ padding: '12px 20px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Revenue</th>
                <th style={{ padding: '12px 20px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Stock Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'White Maize Bags', sales: '45 Bags', revenue: '₦112,500', stock: '24 left', status: 'In Stock' },
                { name: 'Sweet Potatoes Crates', sales: '32 Crates', revenue: '₦96,000', stock: '8 left', status: 'Low Stock' },
                { name: 'Yam Tubers (Medium)', sales: '280 Tubers', revenue: '₦84,000', stock: '120 left', status: 'In Stock' },
                { name: 'Cassava Starch Tons', sales: '3 Tons', revenue: '₦55,500', stock: '2 left', status: 'Low Stock' }
              ].map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: '600', color: 'var(--color-text)' }}>{item.name}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--color-text-secondary)' }}>{item.sales}</td>
                  <td style={{ padding: '14px 20px', fontWeight: '700', color: 'var(--color-text)' }}>{item.revenue}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '600', color: item.status === 'In Stock' ? 'var(--color-online)' : '#f59e0b', backgroundColor: item.status === 'In Stock' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)' }}>
                      {item.status} ({item.stock})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

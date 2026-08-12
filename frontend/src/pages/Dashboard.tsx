import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function Dashboard() {
  const { user } = useAuth();
  
  const [metrics, setMetrics] = useState({
    customers: 0,
    products: 0,
    challans: 0
  });

  const [recentChallans, setRecentChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customers, products, challans] = await Promise.all([
          api.get('/customers?limit=1'),
          api.get('/products?limit=1'),
          api.get('/challans?limit=5')
        ]);
        
        setMetrics({
          customers: customers.data.total || 0,
          products: products.data.total || 0,
          challans: challans.data.total || 0
        });
        
        setRecentChallans(challans.data.data || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm">
        <div>
          <h2 className="font-headline-md text-[length:var(--text-headline-md)] leading-[var(--text-headline-md--line-height)] tracking-[var(--text-headline-md--letter-spacing)] font-[var(--text-headline-md--font-weight)] text-primary">Operations Overview</h2>
          <p className="font-body-md text-[length:var(--text-body-md)] leading-[var(--text-body-md--line-height)] font-[var(--text-body-md--font-weight)] text-on-surface-variant">Real-time metrics and recent activities across all departments.</p>
        </div>
        <div className="flex gap-sm">
          <button className="px-md py-sm bg-surface text-secondary border border-outline-variant rounded hover:border-secondary hover:text-on-secondary-fixed transition-colors font-label-caps text-[length:var(--text-label-caps)] flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px]">download</span> Export
          </button>
          <button className="px-md py-sm bg-primary text-on-primary rounded hover:bg-primary-container transition-colors font-label-caps text-[length:var(--text-label-caps)] flex items-center gap-xs shadow-sm">
            <span className="material-symbols-outlined text-[16px]">add</span> New Entry
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Card 1 */}
        <Link to="/customers" className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md flex flex-col gap-sm hover:border-outline transition-colors cursor-pointer group">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-[length:var(--text-label-caps)] tracking-[var(--text-label-caps--letter-spacing)] font-[var(--text-label-caps--font-weight)] text-on-surface-variant group-hover:text-primary transition-colors">Total Customers</span>
            <div className="w-8 h-8 rounded bg-secondary-container flex items-center justify-center text-on-secondary-container">
              <span className="material-symbols-outlined text-[18px]">groups</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display-lg text-[length:var(--text-display-lg)] leading-[var(--text-display-lg--line-height)] tracking-[var(--text-display-lg--letter-spacing)] font-[var(--text-display-lg--font-weight)] text-primary font-data-mono">
              {loading ? '...' : metrics.customers.toLocaleString()}
            </span>
            <div className="flex items-center gap-xs text-sm mt-1">
              <span className="material-symbols-outlined text-[14px] text-primary">trending_up</span>
              <span className="font-body-sm text-[length:var(--text-body-sm)] text-primary">Active leads</span>
            </div>
          </div>
        </Link>

        {/* Card 2 */}
        <Link to="/products" className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md flex flex-col gap-sm hover:border-outline transition-colors cursor-pointer group">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-[length:var(--text-label-caps)] tracking-[var(--text-label-caps--letter-spacing)] font-[var(--text-label-caps--font-weight)] text-on-surface-variant group-hover:text-primary transition-colors">Total Products</span>
            <div className="w-8 h-8 rounded bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
              <span className="material-symbols-outlined text-[18px]">category</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display-lg text-[length:var(--text-display-lg)] leading-[var(--text-display-lg--line-height)] tracking-[var(--text-display-lg--letter-spacing)] font-[var(--text-display-lg--font-weight)] text-primary font-data-mono">
              {loading ? '...' : metrics.products.toLocaleString()}
            </span>
            <div className="flex items-center gap-xs text-sm mt-1">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="font-body-sm text-[length:var(--text-body-sm)] text-on-surface-variant">Active catalog</span>
            </div>
          </div>
        </Link>

        {/* Card 3 */}
        <Link to="/challans" className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md flex flex-col gap-sm hover:border-outline transition-colors cursor-pointer group relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1 h-full bg-error"></div>
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-[length:var(--text-label-caps)] tracking-[var(--text-label-caps--letter-spacing)] font-[var(--text-label-caps--font-weight)] text-on-surface-variant group-hover:text-primary transition-colors">Pending Challans</span>
            <div className="w-8 h-8 rounded bg-error-container flex items-center justify-center text-on-error-container">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display-lg text-[length:var(--text-display-lg)] leading-[var(--text-display-lg--line-height)] tracking-[var(--text-display-lg--letter-spacing)] font-[var(--text-display-lg--font-weight)] text-primary font-data-mono">
              {loading ? '...' : metrics.challans.toLocaleString()}
            </span>
            <div className="flex items-center gap-xs text-sm mt-1">
              <span className="font-body-sm text-[length:var(--text-body-sm)] text-error font-medium">Recent items</span>
            </div>
          </div>
        </Link>

        {/* Card 4 */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md flex flex-col gap-sm hover:border-outline transition-colors cursor-pointer group relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1 h-full bg-surface-tint"></div>
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-[length:var(--text-label-caps)] tracking-[var(--text-label-caps--letter-spacing)] font-[var(--text-label-caps--font-weight)] text-on-surface-variant group-hover:text-primary transition-colors">Low Stock Alerts</span>
            <div className="w-8 h-8 rounded bg-surface-variant flex items-center justify-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]">warning</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display-lg text-[length:var(--text-display-lg)] leading-[var(--text-display-lg--line-height)] tracking-[var(--text-display-lg--letter-spacing)] font-[var(--text-display-lg--font-weight)] text-primary font-data-mono">
              15
            </span>
            <div className="flex items-center gap-xs text-sm mt-1">
              <span className="font-body-sm text-[length:var(--text-body-sm)] text-on-surface font-medium">Action Required</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table Section */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg flex flex-col overflow-hidden">
        <div className="px-md py-sm border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <h3 className="font-title-sm text-[length:var(--text-title-sm)] font-[var(--text-title-sm--font-weight)] text-primary">Recent Challans</h3>
          <Link to="/challans" className="text-secondary hover:text-primary transition-colors font-label-caps text-[length:var(--text-label-caps)] flex items-center gap-xs">
            View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant font-label-caps text-[length:var(--text-label-caps)] tracking-[var(--text-label-caps--letter-spacing)] font-[var(--text-label-caps--font-weight)] text-on-surface-variant">
                <th className="py-sm px-md font-normal whitespace-nowrap">Date</th>
                <th className="py-sm px-md font-normal">Challan No</th>
                <th className="py-sm px-md font-normal">Customer</th>
                <th className="py-sm px-md font-normal">Status</th>
                <th className="py-sm px-md font-normal text-right">Items</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-[length:var(--text-body-md)] text-on-surface">
              {recentChallans.map((challan, i) => (
                <tr key={challan.id} className={`border-b border-outline-variant hover:bg-surface-container-low transition-colors group ${i % 2 === 1 ? 'bg-surface-bright' : ''}`}>
                  <td className="py-sm px-md font-data-mono text-on-surface-variant whitespace-nowrap">
                    {new Date(challan.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-sm px-md font-medium text-primary">{challan.challanNumber}</td>
                  <td className="py-sm px-md">{challan.customer?.name || 'Unknown'}</td>
                  <td className="py-sm px-md">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${challan.status === 'CONFIRMED' ? 'bg-surface-variant text-on-surface-variant' : 'bg-secondary-container text-on-secondary-container'}`}>
                      {challan.status}
                    </span>
                  </td>
                  <td className="py-sm px-md font-data-mono text-right">{challan.totalQuantity}</td>
                </tr>
              ))}
              {recentChallans.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-sm px-md text-center text-on-surface-variant">No recent challans found.</td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="py-sm px-md text-center text-on-surface-variant">Loading...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

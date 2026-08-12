import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

interface ChallanItem {
  productId: string;
  quantity: number;
  product?: { name: string; currentStock: number; unitPrice: number };
}

interface Challan {
  id: string;
  challanNumber: string;
  status: string;
  totalQuantity: number;
  createdBy: string;
  createdAt: string;
  customer?: { name: string; businessName?: string };
}

interface Customer { id: string; name: string; businessName?: string; }
interface Product  { id: string; name: string; sku: string; currentStock: number; unitPrice: number; }

export default function Challans() {
  const { user } = useAuth();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([{ productId: '', quantity: 1 }]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const limit = 10;
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SALES';

  const load = useCallback(async () => {
    try {
      const params: any = { page, limit };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/challans', { params });
      setChallans(res.data.data);
      setTotal(res.data.total || 0);
    } catch { /* ignore */ }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openNew = async () => {
    setError(''); setMsg('');
    setCustomerId(''); setItems([{ productId: '', quantity: 1 }]);
    try {
      const [cRes, pRes] = await Promise.all([
        api.get('/customers', { params: { limit: 100 } }),
        api.get('/products', { params: { limit: 100 } }),
      ]);
      setCustomers(cRes.data.data);
      setProducts(pRes.data.data);
    } catch { /* ignore */ }
    setShowNew(true);
  };

  const addItem = () => setItems(is => [...is, { productId: '', quantity: 1 }]);
  const removeItem = (i: number) => setItems(is => is.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string | number) =>
    setItems(is => is.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const saveDraft = async () => {
    setError('');
    if (!customerId) { setError('Please select a customer'); return; }
    if (items.some(i => !i.productId)) { setError('Please select a product for each row'); return; }
    try {
      await api.post('/challans', { customerId, items: items.map(i => ({ ...i, quantity: Number(i.quantity) })) });
      setShowNew(false);
      setMsg('Draft challan created!');
      load();
    } catch (err: any) { setError(err.response?.data?.error || 'Failed to create challan'); }
  };

  const confirm = async (id: string) => {
    setMsg(''); setError('');
    try {
      await api.post(`/challans/${id}/confirm`);
      setMsg('Challan confirmed! Stock decremented.');
      load();
    } catch (err: any) { setError(err.response?.data?.error || 'Confirm failed'); }
  };

  const cancel = async (id: string) => {
    setMsg(''); setError('');
    try {
      await api.post(`/challans/${id}/cancel`);
      setMsg('Challan cancelled.');
      load();
    } catch (err: any) { setError(err.response?.data?.error || 'Cancel failed'); }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNew(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const pages = Math.ceil(total / limit);

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md mb-lg">
        <div>
          <h2 className="font-headline-md text-[length:var(--text-headline-md)] font-[var(--text-headline-md--font-weight)] text-on-surface">Sales Challans</h2>
          <p className="font-body-sm text-[length:var(--text-body-sm)] text-on-surface-variant mt-1">Manage and track all outgoing wholesale shipments.</p>
        </div>
        <div className="flex gap-sm w-full sm:w-auto">
          {canEdit && (
            <button onClick={openNew} className="bg-primary-container text-on-primary-container px-lg py-2 rounded-lg font-body-sm text-[length:var(--text-body-sm)] font-bold flex items-center gap-2 hover:bg-tertiary-container hover:text-on-tertiary-container transition-colors whitespace-nowrap shadow-sm">
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Challan
            </button>
          )}
        </div>
      </div>

      {msg && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">{msg}</div>}
      {error && !showNew && <div className="mb-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm">{error}</div>}

      {/* Filters / Toolbar */}
      <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant flex flex-wrap gap-md items-center justify-between mb-lg">
        <div className="flex flex-wrap gap-sm">
          <button className="px-sm py-1 border border-outline-variant rounded-lg text-[length:var(--text-body-sm)] font-body-sm text-on-surface-variant bg-surface-container hover:bg-surface-variant transition-colors flex items-center gap-1 cursor-default">
             <span className="material-symbols-outlined text-[16px]">filter_list</span>
             Filters
          </button>
          <select 
            value={statusFilter} 
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-outline-variant rounded-lg text-[length:var(--text-body-sm)] font-body-sm text-on-surface-variant bg-surface-container-lowest focus:border-secondary focus:ring-2 focus:ring-secondary/10 px-sm py-1 outline-none cursor-pointer">
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="p-3 font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant whitespace-nowrap">Challan Number</th>
                <th className="p-3 font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant whitespace-nowrap">Date</th>
                <th className="p-3 font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant">Customer</th>
                <th className="p-3 font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant text-right whitespace-nowrap">Quantity</th>
                <th className="p-3 font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant whitespace-nowrap">Created By</th>
                <th className="p-3 font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant text-center whitespace-nowrap">Status</th>
                {canEdit && <th className="p-3 font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="font-body-sm text-[length:var(--text-body-sm)] text-on-surface">
              {challans.map((c, i) => (
                <tr key={c.id} className={`border-b border-outline-variant hover:bg-surface-container transition-colors group ${i % 2 === 1 ? 'bg-surface/50' : ''}`}>
                  <td className="p-3 font-data-mono text-[length:var(--text-data-mono)] font-bold text-primary">{c.challanNumber}</td>
                  <td className="p-3 text-on-surface-variant">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 font-bold">{c.customer?.name || '-'}</td>
                  <td className="p-3 text-right text-on-surface-variant">{c.totalQuantity} Units</td>
                  <td className="p-3 text-on-surface-variant">{c.createdBy}</td>
                  <td className="p-3 text-center">
                    {c.status === 'CONFIRMED' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#e8f5e9] text-[#2e7d32] border border-[#a5d6a7]">Confirmed</span>
                    ) : c.status === 'CANCELLED' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ffebee] text-[#c62828] border border-[#ffcdd2]">Cancelled</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#fff8e1] text-[#ff8f00] border border-[#ffe082]">Draft</span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="p-3 text-right space-x-2">
                      {c.status === 'DRAFT' && (
                        <>
                          <button onClick={() => confirm(c.id)} className="text-[#2e7d32] hover:underline text-[length:var(--text-label-caps)] font-label-caps">Confirm</button>
                          <button onClick={() => cancel(c.id)} className="text-[#c62828] hover:underline text-[length:var(--text-label-caps)] font-label-caps">Cancel</button>
                        </>
                      )}
                      {c.status === 'CONFIRMED' && (
                        <button onClick={() => cancel(c.id)} className="text-[#c62828] hover:underline text-[length:var(--text-label-caps)] font-label-caps">Cancel</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {challans.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="p-3 py-8 text-center text-on-surface-variant font-body-sm">
                    No challans found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {pages > 0 && (
          <div className="mt-auto px-md py-sm bg-surface border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-sm">
            <div className="font-body-sm text-[length:var(--text-body-sm)] text-on-surface-variant">
              Showing page {page} of {pages} ({total} challans)
            </div>
            <div className="flex items-center gap-xs">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 border border-outline-variant rounded hover:bg-surface-variant text-on-surface-variant transition-colors disabled:opacity-50">
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-1 border border-outline-variant rounded hover:bg-surface-variant text-on-surface-variant transition-colors disabled:opacity-50">
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Challan Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-inverse-surface/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-outline-variant">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant sticky top-0 bg-surface-container-lowest">
              <h2 className="font-title-sm text-[length:var(--text-title-sm)] text-primary">New Sales Challan</h2>
              <button onClick={() => setShowNew(false)} className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-5">
              {error && <div className="text-error bg-error-container rounded p-2 text-[length:var(--text-body-sm)]">{error}</div>}
              
              <div>
                <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-1">Customer *</label>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)}
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary">
                  <option value="">Select a customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.businessName ? ` — ${c.businessName}` : ''}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-2">Items *</label>
                <div className="space-y-2">
                  {items.map((item, idx) => {
                    const prod = products.find(p => p.id === item.productId);
                    return (
                      <div key={idx} className="flex gap-2 items-center">
                        <select value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)}
                          className="flex-1 border border-outline-variant rounded-lg px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary">
                          <option value="">Select product...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock}, ₹{Number(p.unitPrice).toFixed(0)})</option>
                          ))}
                        </select>
                        <input type="number" min="1" max={prod?.currentStock || 999} value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                          className="w-20 border border-outline-variant rounded-lg px-3 py-2 text-[length:var(--text-body-sm)] text-center focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" />
                        {items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="text-on-surface-variant hover:text-error text-lg leading-none transition-colors">
                             <span className="material-symbols-outlined text-[20px]">close</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button onClick={addItem} className="mt-3 text-secondary hover:text-primary text-[length:var(--text-label-caps)] font-label-caps flex items-center transition-colors">
                  <span className="material-symbols-outlined text-[16px] mr-1">add</span> Add item
                </button>
              </div>

              {/* Summary */}
              {items.some(i => i.productId) && (
                <div className="bg-surface-variant rounded-lg p-4 text-[length:var(--text-body-sm)]">
                  <p className="font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-2">Summary</p>
                  {items.filter(i => i.productId).map((item, idx) => {
                    const prod = products.find(p => p.id === item.productId);
                    return prod ? (
                      <p key={idx} className="text-on-surface mb-1 flex justify-between">
                        <span>{prod.name} × {item.quantity}</span>
                        <span className="font-data-mono">₹{(Number(prod.unitPrice) * item.quantity).toFixed(2)}</span>
                      </p>
                    ) : null;
                  })}
                  <div className="border-t border-outline-variant mt-2 pt-2 flex justify-between font-bold text-primary">
                    <span>Total Qty: {items.reduce((s, i) => s + Number(i.quantity), 0)}</span>
                    <span className="font-data-mono">
                      Total: ₹{items.reduce((s, i) => {
                        const prod = products.find(p => p.id === i.productId);
                        return s + (prod ? Number(prod.unitPrice) * i.quantity : 0);
                      }, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
                <button onClick={() => setShowNew(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-DEFAULT text-[length:var(--text-label-caps)] font-label-caps hover:bg-surface-variant transition-colors">Cancel</button>
                <button onClick={saveDraft}
                  className="px-4 py-2 bg-primary text-on-primary rounded-DEFAULT text-[length:var(--text-label-caps)] font-label-caps hover:bg-primary-container transition-colors">
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

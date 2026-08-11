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
      setTotal(res.data.total);
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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Challans</h1>
        {canEdit && (
          <button onClick={openNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            + New Challan
          </button>
        )}
      </div>

      {msg && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{msg}</div>}
      {error && !showNew && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="flex gap-3 mb-4">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option>DRAFT</option>
          <option>CONFIRMED</option>
          <option>CANCELLED</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Challan #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              {canEdit && <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {challans.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono text-gray-900">{c.challanNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{c.customer?.name || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                    c.status === 'CANCELLED' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'
                  }`}>{c.status}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{c.totalQuantity}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{c.createdBy}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                {canEdit && (
                  <td className="px-6 py-4 text-right space-x-3">
                    {c.status === 'DRAFT' && (
                      <>
                        <button onClick={() => confirm(c.id)} className="text-green-600 hover:underline text-sm">Confirm</button>
                        <button onClick={() => cancel(c.id)} className="text-red-600 hover:underline text-sm">Cancel</button>
                      </>
                    )}
                    {c.status === 'CONFIRMED' && (
                      <button onClick={() => cancel(c.id)} className="text-red-600 hover:underline text-sm">Cancel</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {challans.length === 0 && (
              <tr><td colSpan={canEdit ? 7 : 6} className="px-6 py-8 text-center text-gray-400 text-sm">No challans found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded text-sm ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* New Challan Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-bold">New Sales Challan</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-5">
              {error && <div className="text-red-500 text-sm bg-red-50 rounded p-2">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select a customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.businessName ? ` — ${c.businessName}` : ''}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Items *</label>
                <div className="space-y-2">
                  {items.map((item, idx) => {
                    const prod = products.find(p => p.id === item.productId);
                    return (
                      <div key={idx} className="flex gap-2 items-center">
                        <select value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm">
                          <option value="">Select product...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock}, ₹{Number(p.unitPrice).toFixed(0)})</option>
                          ))}
                        </select>
                        <input type="number" min="1" max={prod?.currentStock || 999} value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                          className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center" />
                        {items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button onClick={addItem} className="mt-2 text-blue-600 hover:underline text-sm">+ Add item</button>
              </div>

              {/* Summary */}
              {items.some(i => i.productId) && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="font-medium text-gray-700 mb-1">Summary</p>
                  {items.filter(i => i.productId).map((item, idx) => {
                    const prod = products.find(p => p.id === item.productId);
                    return prod ? (
                      <p key={idx} className="text-gray-600">
                        {prod.name} × {item.quantity} = ₹{(Number(prod.unitPrice) * item.quantity).toFixed(2)}
                      </p>
                    ) : null;
                  })}
                  <p className="font-semibold text-gray-900 mt-1">
                    Total Qty: {items.reduce((s, i) => s + Number(i.quantity), 0)} |
                    Total: ₹{items.reduce((s, i) => {
                      const prod = products.find(p => p.id === i.productId);
                      return s + (prod ? Number(prod.unitPrice) * i.quantity : 0);
                    }, 0).toFixed(2)}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowNew(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">Cancel</button>
                <button onClick={saveDraft}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

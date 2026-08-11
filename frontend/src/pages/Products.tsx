import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location?: string;
  active: boolean;
}

const emptyForm = {
  name: '', sku: '', category: '', unitPrice: '', currentStock: '0',
  minStockAlert: '5', location: '', active: true,
};

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [showStock, setShowStock] = useState<Product | null>(null);
  const [stockQty, setStockQty] = useState('');
  const [stockType, setStockType] = useState<'IN' | 'OUT'>('IN');
  const [stockReason, setStockReason] = useState('');
  const [error, setError] = useState('');
  const limit = 10;
  const canEdit = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  const load = useCallback(async () => {
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (lowStock) params.lowStock = 'true';
      const res = await api.get('/products', { params });
      setProducts(res.data.data);
      setTotal(res.data.total);
    } catch { /* ignore */ }
  }, [page, search, lowStock]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setError(''); setShowModal(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, sku: p.sku, category: p.category || '', unitPrice: String(p.unitPrice),
      currentStock: String(p.currentStock), minStockAlert: String(p.minStockAlert),
      location: p.location || '', active: p.active,
    });
    setError('');
    setShowModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const body: any = {
      ...form, unitPrice: Number(form.unitPrice),
      currentStock: Number(form.currentStock), minStockAlert: Number(form.minStockAlert),
    };
    try {
      if (editing) await api.put(`/products/${editing.id}`, body);
      else await api.post('/products', body);
      setShowModal(false);
      load();
    } catch (err: any) { setError(err.response?.data?.error || 'Save failed'); }
  };

  const adjustStock = async () => {
    if (!stockQty || !showStock) return;
    try {
      await api.post(`/products/${showStock.id}/stock`, {
        quantity: Number(stockQty), movementType: stockType, reason: stockReason,
      });
      setShowStock(null);
      setStockQty(''); setStockReason('');
      load();
    } catch (err: any) { setError(err.response?.data?.error || 'Adjustment failed'); }
  };

  const pages = Math.ceil(total / limit);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products & Stock</h1>
        {canEdit && (
          <button onClick={openAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            + Add Product
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-4 items-center">
        <input
          type="text" placeholder="Search name or SKU..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none whitespace-nowrap">
          <input type="checkbox" checked={lowStock} onChange={e => { setLowStock(e.target.checked); setPage(1); }} />
          Low stock only
        </label>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              {canEdit && <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {products.map(p => (
              <tr key={p.id} className={`hover:bg-gray-50 ${p.currentStock <= p.minStockAlert ? 'bg-red-50' : ''}`}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500 font-mono">{p.sku}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{p.category || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-900">&#8377;{Number(p.unitPrice).toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-medium ${p.currentStock <= p.minStockAlert ? 'text-red-600' : 'text-gray-900'}`}>
                    {p.currentStock}
                    {p.currentStock <= p.minStockAlert && <span className="ml-1 text-xs text-red-400">(low)</span>}
                  </span>
                </td>
                {canEdit && (
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => openEdit(p)} className="text-blue-600 hover:underline text-sm">Edit</button>
                    <button onClick={() => { setShowStock(p); setError(''); }}
                      className="text-green-600 hover:underline text-sm">Adjust Stock</button>
                  </td>
                )}
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={canEdit ? 6 : 5} className="px-6 py-8 text-center text-gray-400 text-sm">No products found</td></tr>
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

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-bold">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              {error && <div className="text-red-500 text-sm bg-red-50 rounded p-2">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                  <input required value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (&#8377;) *</label>
                  <input required type="number" min="0.01" step="0.01" value={form.unitPrice}
                    onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                  <input type="number" min="0" value={form.currentStock}
                    onChange={e => setForm(f => ({ ...f, currentStock: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Alert</label>
                  <input type="number" min="0" value={form.minStockAlert}
                    onChange={e => setForm(f => ({ ...f, minStockAlert: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  {editing ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStock && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-bold">Adjust Stock — {showStock.name}</h2>
              <button onClick={() => setShowStock(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="text-red-500 text-sm bg-red-50 rounded p-2">{error}</div>}
              <p className="text-sm text-gray-500">Current stock: <strong className="text-gray-900">{showStock.currentStock}</strong></p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Movement Type</label>
                <select value={stockType} onChange={e => setStockType(e.target.value as 'IN' | 'OUT')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="IN">IN (Add)</option>
                  <option value="OUT">OUT (Remove)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input required type="number" min="1" value={stockQty}
                  onChange={e => setStockQty(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input value={stockReason} onChange={e => setStockReason(e.target.value)}
                  placeholder="Optional reason..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowStock(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">Cancel</button>
                <button onClick={adjustStock}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Adjust</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

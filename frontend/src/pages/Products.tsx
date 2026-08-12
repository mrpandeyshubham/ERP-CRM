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
      setTotal(res.data.total || 0);
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
    <>
      {/* Page Header & Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-lg gap-md">
        <div>
          <h2 className="font-headline-md text-[length:var(--text-headline-md)] font-[var(--text-headline-md--font-weight)] text-on-background mb-xs">Products</h2>
          <p className="font-body-md text-[length:var(--text-body-md)] text-on-surface-variant">Manage inventory, pricing, and stock levels.</p>
        </div>
        <div className="flex items-center gap-sm w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input 
              className="w-full sm:w-64 pl-xl pr-sm py-2 border border-outline-variant rounded bg-surface text-[length:var(--text-body-sm)] font-body-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all" 
              placeholder="Search products..." 
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select 
            value={lowStock ? 'low' : 'all'} 
            onChange={e => { setLowStock(e.target.value === 'low'); setPage(1); }}
            className="flex items-center justify-center px-2 py-2 border border-outline-variant rounded bg-surface hover:bg-surface-variant text-on-surface-variant transition-colors outline-none cursor-pointer">
            <option value="all">All Stock</option>
            <option value="low">Low Stock Alerts</option>
          </select>
          {canEdit && (
            <button onClick={openAdd} className="flex items-center gap-xs px-md py-2 bg-primary text-on-primary rounded hover:bg-primary-container transition-colors font-label-caps text-[length:var(--text-label-caps)] whitespace-nowrap shadow-sm">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Product
            </button>
          )}
        </div>
      </div>

      {/* Data Table Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#F1F5F9] border-b border-outline-variant">
                <th className="py-sm px-md font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant w-12"></th>
                <th className="py-sm px-md font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant">Product Name</th>
                <th className="py-sm px-md font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant">SKU</th>
                <th className="py-sm px-md font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant">Category</th>
                <th className="py-sm px-md font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant text-right">Price</th>
                <th className="py-sm px-md font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant text-right">Stock</th>
                <th className="py-sm px-md font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant text-center">Status</th>
                {canEdit && <th className="py-sm px-md font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="font-body-sm text-[length:var(--text-body-sm)] text-on-surface divide-y divide-outline-variant">
              {products.map((p, i) => {
                const isOutOfStock = p.currentStock === 0;
                const isLowStock = p.currentStock > 0 && p.currentStock <= p.minStockAlert;
                
                return (
                  <tr key={p.id} className={`hover:bg-surface-container-low transition-colors group ${i % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-surface-container-lowest'}`}>
                    <td className="py-sm px-md">
                      <div className="w-8 h-8 rounded border border-outline-variant bg-surface-variant flex items-center justify-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                      </div>
                    </td>
                    <td className="py-sm px-md font-medium">{p.name}</td>
                    <td className="py-sm px-md font-data-mono text-[length:var(--text-data-mono)] text-on-surface-variant">{p.sku}</td>
                    <td className="py-sm px-md text-on-surface-variant">{p.category || '-'}</td>
                    <td className="py-sm px-md font-data-mono text-[length:var(--text-data-mono)] text-right">&#8377;{Number(p.unitPrice).toFixed(2)}</td>
                    <td className="py-sm px-md font-data-mono text-[length:var(--text-data-mono)] text-right">{p.currentStock}</td>
                    <td className="py-sm px-md text-center">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-error-container text-on-error-container font-label-caps text-[10px] uppercase tracking-wider">Out of Stock</span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-label-caps text-[10px] uppercase tracking-wider">Low Stock</span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-secondary-container/50 text-on-secondary-container font-label-caps text-[10px] uppercase tracking-wider">In Stock</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="py-sm px-md text-right space-x-2">
                        <button onClick={() => { setShowStock(p); setError(''); }} className="p-1 text-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-variant rounded">
                          <span className="material-symbols-outlined text-[18px]">add_box</span>
                        </button>
                        <button onClick={() => openEdit(p)} className="p-1 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary rounded hover:bg-surface-variant">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="px-md py-8 text-center text-on-surface-variant font-body-sm">
                    No products found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {pages > 0 && (
          <div className="px-md py-sm border-t border-outline-variant bg-surface flex justify-between items-center text-[length:var(--text-body-sm)] font-[var(--text-body-sm--font-weight)] text-on-surface-variant">
            <div>Showing page {page} of {pages} ({total} total)</div>
            <div className="flex items-center gap-xs">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 border border-outline-variant rounded hover:bg-surface-variant transition-colors disabled:opacity-50">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-1 border border-outline-variant rounded hover:bg-surface-variant transition-colors disabled:opacity-50">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-inverse-surface/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-lg border border-outline-variant">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant">
              <h2 className="font-title-sm text-[length:var(--text-title-sm)] text-primary">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              {error && <div className="text-error bg-error-container rounded p-2 text-sm">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-1">Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-outline-variant rounded px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" />
                </div>
                <div>
                  <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-1">SKU *</label>
                  <input required value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    className="w-full border border-outline-variant rounded px-3 py-2 text-[length:var(--text-data-mono)] font-data-mono focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" />
                </div>
                <div>
                  <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-1">Category</label>
                  <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-outline-variant rounded px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" />
                </div>
                <div>
                  <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-1">Unit Price (&#8377;) *</label>
                  <input required type="number" min="0.01" step="0.01" value={form.unitPrice}
                    onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))}
                    className="w-full border border-outline-variant rounded px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" />
                </div>
                <div>
                  <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-1">Current Stock</label>
                  <input type="number" min="0" value={form.currentStock}
                    onChange={e => setForm(f => ({ ...f, currentStock: e.target.value }))}
                    className="w-full border border-outline-variant rounded px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" />
                </div>
                <div>
                  <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-1">Min Stock Alert</label>
                  <input type="number" min="0" value={form.minStockAlert}
                    onChange={e => setForm(f => ({ ...f, minStockAlert: e.target.value }))}
                    className="w-full border border-outline-variant rounded px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" />
                </div>
                <div className="col-span-2">
                  <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-1">Location</label>
                  <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    className="w-full border border-outline-variant rounded px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-DEFAULT text-[length:var(--text-label-caps)] font-label-caps hover:bg-surface-variant transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-on-primary rounded-DEFAULT text-[length:var(--text-label-caps)] font-label-caps hover:bg-primary-container transition-colors">
                  {editing ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStock && (
        <div className="fixed inset-0 bg-inverse-surface/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-sm border border-outline-variant">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant">
              <h2 className="font-title-sm text-[length:var(--text-title-sm)] text-primary">Adjust Stock — {showStock.name}</h2>
              <button onClick={() => setShowStock(null)} className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="text-error bg-error-container rounded p-2 text-sm">{error}</div>}
              <p className="text-[length:var(--text-body-sm)] text-on-surface-variant">Current stock: <strong className="text-primary font-data-mono">{showStock.currentStock}</strong></p>
              <div>
                <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-1">Movement Type</label>
                <select value={stockType} onChange={e => setStockType(e.target.value as 'IN' | 'OUT')}
                  className="w-full border border-outline-variant rounded px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary">
                  <option value="IN">IN (Add)</option>
                  <option value="OUT">OUT (Remove)</option>
                </select>
              </div>
              <div>
                <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-1">Quantity *</label>
                <input required type="number" min="1" value={stockQty}
                  onChange={e => setStockQty(e.target.value)}
                  className="w-full border border-outline-variant rounded px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" />
              </div>
              <div>
                <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-1">Reason</label>
                <input value={stockReason} onChange={e => setStockReason(e.target.value)}
                  placeholder="Optional reason..."
                  className="w-full border border-outline-variant rounded px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowStock(null)}
                  className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-DEFAULT text-[length:var(--text-label-caps)] font-label-caps hover:bg-surface-variant transition-colors">Cancel</button>
                <button onClick={adjustStock}
                  className="px-4 py-2 bg-secondary text-on-secondary rounded-DEFAULT text-[length:var(--text-label-caps)] font-label-caps hover:bg-secondary-container transition-colors">Adjust</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

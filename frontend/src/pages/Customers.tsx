import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  businessName?: string;
  gstNumber?: string;
  customerType: string;
  address?: string;
  status: string;
  followUpDate?: string;
  notes?: { id: string; note: string; createdBy: string; createdAt: string }[];
}

const TYPES = ['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'];
const STATUSES = ['LEAD', 'ACTIVE', 'INACTIVE'];

const emptyForm = {
  name: '', mobile: '', email: '', businessName: '', gstNumber: '',
  customerType: 'RETAIL', address: '', status: 'LEAD', followUpDate: '',
};

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [selected, setSelected] = useState<Customer | null>(null);
  const [noteText, setNoteText] = useState('');
  const [error, setError] = useState('');
  const limit = 10;
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SALES';

  const load = useCallback(async () => {
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/customers', { params });
      setCustomers(res.data.data);
      setTotal(res.data.total || 0);
    } catch { /* ignore */ }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setError(''); setShowModal(true); };
  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name, mobile: c.mobile, email: c.email || '', businessName: c.businessName || '',
      gstNumber: c.gstNumber || '', customerType: c.customerType, address: c.address || '',
      status: c.status, followUpDate: c.followUpDate ? c.followUpDate.substring(0, 10) : '',
    });
    setError('');
    setShowModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const body: any = { ...form };
    if (!body.followUpDate) delete body.followUpDate; else body.followUpDate = new Date(body.followUpDate).toISOString();
    try {
      if (editing) await api.put(`/customers/${editing.id}`, body);
      else await api.post('/customers', body);
      setShowModal(false);
      load();
    } catch (err: any) { setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.message || 'Save failed'); }
  };

  const openDetail = async (c: Customer) => {
    try {
      const res = await api.get(`/customers/${c.id}`);
      setSelected(res.data);
    } catch { setSelected(c); }
    setNoteText('');
  };

  const addNote = async () => {
    if (!noteText.trim() || !selected) return;
    await api.post(`/customers/${selected.id}/notes`, { note: noteText });
    setNoteText('');
    const res = await api.get(`/customers/${selected.id}`);
    setSelected(res.data);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setSelected(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const pages = Math.ceil(total / limit);

  return (
    <>
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-lg space-y-md sm:space-y-0">
        <div>
          <h1 className="font-headline-md text-[length:var(--text-headline-md)] font-[var(--text-headline-md--font-weight)] text-primary mb-1">Customers</h1>
          <p className="font-body-sm text-[length:var(--text-body-sm)] text-on-surface-variant">Manage your retail, wholesale, and distributor accounts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-sm w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input 
              className="w-full pl-[36px] pr-md py-[8px] bg-surface-container-lowest border border-outline-variant rounded focus:border-secondary focus:ring-2 focus:ring-secondary/10 font-body-sm text-body-sm text-on-surface outline-none transition-all" 
              placeholder="Search customers..." 
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          {/* Filter */}
          <select 
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="flex items-center space-x-xs px-md py-[8px] bg-surface-container-lowest border border-outline-variant rounded text-on-surface-variant hover:border-secondary transition-colors font-label-caps text-[length:var(--text-label-caps)] tracking-[var(--text-label-caps--letter-spacing)] shrink-0 outline-none cursor-pointer">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {/* Add Action */}
          {canEdit && (
            <button onClick={openAdd} className="flex items-center space-x-xs px-md py-[8px] bg-primary border border-primary text-on-primary rounded hover:bg-tertiary-container transition-colors font-label-caps text-[length:var(--text-label-caps)] shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* Data Table Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#F1F5F9] border-b border-outline-variant">
                <th className="px-md py-[10px] font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant">Name</th>
                <th className="px-md py-[10px] font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant">Business Name</th>
                <th className="px-md py-[10px] font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant">Mobile</th>
                <th className="px-md py-[10px] font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant">Email</th>
                <th className="px-md py-[10px] font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant">Customer Type</th>
                <th className="px-md py-[10px] font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant">Status</th>
                {canEdit && <th className="px-md py-[10px] font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="font-body-sm text-[length:var(--text-body-sm)] divide-y divide-outline-variant">
              {customers.map((c, i) => (
                <tr key={c.id} onClick={() => openDetail(c)} className={`cursor-pointer hover:border-secondary hover:border-l-2 hover:-ml-[2px] transition-all group ${i % 2 === 1 ? 'bg-[#F8FAFC]' : 'bg-surface-container-lowest'}`}>
                  <td className="px-md py-sm font-title-sm text-[14px] text-primary">{c.name}</td>
                  <td className="px-md py-sm text-on-surface-variant">{c.businessName || '-'}</td>
                  <td className="px-md py-sm font-data-mono text-[length:var(--text-data-mono)] text-on-surface-variant">{c.mobile}</td>
                  <td className="px-md py-sm text-on-surface-variant truncate max-w-[200px]">{c.email || '-'}</td>
                  <td className="px-md py-sm">
                    <span className="inline-flex items-center px-[8px] py-[2px] rounded-full text-[11px] font-semibold bg-surface-variant text-on-surface-variant border border-outline-variant">
                      {c.customerType}
                    </span>
                  </td>
                  <td className="px-md py-sm">
                    {c.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center px-[8px] py-[2px] rounded-full text-[11px] font-semibold bg-[#E6F4EA] text-[#137333]">Active</span>
                    ) : c.status === 'INACTIVE' ? (
                      <span className="inline-flex items-center px-[8px] py-[2px] rounded-full text-[11px] font-semibold bg-[#F1F3F4] text-[#5F6368]">Inactive</span>
                    ) : (
                      <span className="inline-flex items-center px-[8px] py-[2px] rounded-full text-[11px] font-semibold bg-[#E8F0FE] text-[#1967D2]">Lead</span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-md py-sm text-right" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(c)} className="text-on-surface-variant hover:text-primary transition-colors p-xs flex items-center justify-end w-full">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="px-md py-8 text-center text-on-surface-variant font-body-sm">
                    No customers found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pages > 0 && (
          <div className="px-md py-sm border-t border-outline-variant bg-[#F1F5F9] flex justify-between items-center text-[length:var(--text-body-sm)] font-[var(--text-body-sm--font-weight)]">
            <span className="text-on-surface-variant">Showing page {page} of {pages} ({total} total)</span>
            <div className="flex space-x-xs">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-sm py-xs border border-outline-variant rounded bg-surface-container-lowest text-on-surface-variant hover:bg-surface-variant disabled:opacity-50">Previous</button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="px-sm py-xs border border-outline-variant rounded bg-surface-container-lowest text-on-surface-variant hover:bg-surface-variant disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modals for Add/Edit/View (Using basic tailwind for structural modals as per prior version) */}
      {showModal && (
        <div className="fixed inset-0 bg-inverse-surface/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-lg border border-outline-variant">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant">
              <h2 className="font-title-sm text-[length:var(--text-title-sm)] text-primary">{editing ? 'Edit Customer' : 'Add Customer'}</h2>
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
                  <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-1">Mobile *</label>
                  <input required value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                    className="w-full border border-outline-variant rounded px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" />
                </div>
                <div>
                  <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-outline-variant rounded px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" />
                </div>
                <div>
                  <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-1">Business Name</label>
                  <input value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                    className="w-full border border-outline-variant rounded px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" />
                </div>
                <div>
                  <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-1">Type *</label>
                  <select value={form.customerType} onChange={e => setForm(f => ({ ...f, customerType: e.target.value }))}
                    className="w-full border border-outline-variant rounded px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary">
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-outline-variant rounded px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-1">GST Number</label>
                  <input value={form.gstNumber} onChange={e => setForm(f => ({ ...f, gstNumber: e.target.value }))}
                    className="w-full border border-outline-variant rounded px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" />
                </div>
                <div>
                  <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-1">Follow-up Date</label>
                  <input type="date" value={form.followUpDate} onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))}
                    className="w-full border border-outline-variant rounded px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" />
                </div>
              </div>
              <div>
                <label className="block font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant mb-1">Address</label>
                <textarea rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full border border-outline-variant rounded px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-outline-variant text-on-surface-variant rounded-DEFAULT text-[length:var(--text-label-caps)] font-label-caps hover:bg-surface-variant transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-on-primary rounded-DEFAULT text-[length:var(--text-label-caps)] font-label-caps hover:bg-primary-container transition-colors">
                  {editing ? 'Save Changes' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-inverse-surface/50 flex items-start justify-end z-50">
          <div className="bg-surface-container-lowest h-full w-full max-w-md shadow-xl overflow-y-auto border-l border-outline-variant">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant sticky top-0 bg-surface-container-lowest">
              <h2 className="font-title-sm text-[length:var(--text-title-sm)] text-primary">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <dl className="grid grid-cols-2 gap-4">
                <div><dt className="font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant">Type</dt><dd className="text-primary font-body-sm">{selected.customerType}</dd></div>
                <div><dt className="font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant">Status</dt><dd className="text-primary font-body-sm">{selected.status}</dd></div>
                <div><dt className="font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant">Mobile</dt><dd className="text-primary font-data-mono">{selected.mobile}</dd></div>
                <div><dt className="font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant">Email</dt><dd className="text-primary font-body-sm">{selected.email || '-'}</dd></div>
                <div><dt className="font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant">Business</dt><dd className="text-primary font-body-sm">{selected.businessName || '-'}</dd></div>
                <div><dt className="font-label-caps text-[length:var(--text-label-caps)] text-on-surface-variant">GST</dt><dd className="text-primary font-data-mono">{selected.gstNumber || '-'}</dd></div>
              </dl>

              <div className="border-t border-outline-variant pt-6">
                <h3 className="font-title-sm text-[length:var(--text-title-sm)] text-primary mb-4">Follow-up notes</h3>
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                  {(selected.notes || []).map(n => (
                    <div key={n.id} className="bg-surface-variant rounded p-3">
                      <p className="text-on-surface text-[length:var(--text-body-sm)]">{n.note}</p>
                      <p className="text-on-surface-variant text-[length:var(--text-label-caps)] font-label-caps mt-2 flex justify-between">
                        <span>{n.createdBy}</span>
                        <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                  ))}
                  {(selected.notes || []).length === 0 && <p className="text-on-surface-variant text-[length:var(--text-body-sm)]">No notes yet</p>}
                </div>
                <div className="flex gap-2">
                  <input value={noteText} onChange={e => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1 border border-outline-variant rounded px-3 py-2 text-[length:var(--text-body-sm)] focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary" />
                  <button onClick={addNote} className="px-4 py-2 bg-secondary text-on-secondary rounded text-[length:var(--text-label-caps)] font-label-caps hover:bg-secondary-container hover:text-on-secondary-container transition-colors">Add</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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
      setTotal(res.data.total);
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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        {canEdit && (
          <button onClick={openAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            + Add Customer
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text" placeholder="Search name, business, mobile..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
              {canEdit && <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(c)}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{c.businessName || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{c.customerType}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    c.status === 'INACTIVE' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'
                  }`}>{c.status}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{c.mobile}</td>
                {canEdit && (
                  <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(c)} className="text-blue-600 hover:underline text-sm">Edit</button>
                  </td>
                )}
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={canEdit ? 6 : 5} className="px-6 py-8 text-center text-gray-400 text-sm">No customers found</td></tr>
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-bold">{editing ? 'Edit Customer' : 'Add Customer'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              {error && <div className="text-red-500 text-sm bg-red-50 rounded p-2">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                  <input required value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select value={form.customerType} onChange={e => setForm(f => ({ ...f, customerType: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <input value={form.gstNumber} onChange={e => setForm(f => ({ ...f, gstNumber: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                  <input type="date" value={form.followUpDate} onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  {editing ? 'Save Changes' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-start justify-end z-50">
          <div className="bg-white h-full w-full max-w-md shadow-xl overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="font-medium text-gray-500">Type</dt><dd className="text-gray-900">{selected.customerType}</dd></div>
                <div><dt className="font-medium text-gray-500">Status</dt><dd className="text-gray-900">{selected.status}</dd></div>
                <div><dt className="font-medium text-gray-500">Mobile</dt><dd className="text-gray-900">{selected.mobile}</dd></div>
                <div><dt className="font-medium text-gray-500">Email</dt><dd className="text-gray-900">{selected.email || '-'}</dd></div>
                <div><dt className="font-medium text-gray-500">Business</dt><dd className="text-gray-900">{selected.businessName || '-'}</dd></div>
                <div><dt className="font-medium text-gray-500">GST</dt><dd className="text-gray-900">{selected.gstNumber || '-'}</dd></div>
              </dl>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Follow-up notes</h3>
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                  {(selected.notes || []).map(n => (
                    <div key={n.id} className="bg-gray-50 rounded p-3 text-sm">
                      <p className="text-gray-800">{n.note}</p>
                      <p className="text-gray-400 text-xs mt-1">{n.createdBy} · {new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                  {(selected.notes || []).length === 0 && <p className="text-gray-400 text-sm">No notes yet</p>}
                </div>
                <div className="flex gap-2">
                  <input value={noteText} onChange={e => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  <button onClick={addNote} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Add</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

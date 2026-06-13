import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', orderAmount: '', orderItems: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    apiGet('/api/customers')
      .then(setCustomers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const submitCustomer = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
      };
      if (form.orderAmount) {
        payload.order = { amount: Number(form.orderAmount), items: form.orderItems };
      }
      await apiPost('/api/customers', payload);
      setForm({ name: '', email: '', phone: '', orderAmount: '', orderItems: '' });
      setShowForm(false);
      const updated = await apiGet('/api/customers');
      setCustomers(updated);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading customers...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  const totalSpend = customers.reduce((s, c) => s + Number(c.total_spend || 0), 0);
  const totalOrders = customers.reduce((s, c) => s + Number(c.order_count || 0), 0);
  const avgSpend = customers.length ? Math.round(totalSpend / customers.length) : 0;
  const avgOrders = customers.length ? (totalOrders / customers.length).toFixed(1) : 0;

  return (
    <div>
      <div className="flex justify-between items-center">
  <h1>Customers</h1>
  <button className="btn" onClick={() => setShowForm((v) => !v)}>
    {showForm ? 'Cancel' : '+ Add Customer'}
  </button>
</div>
      <p style={{ color: '#64748b', marginBottom: 20 }}>Your shopper database</p>
      {showForm && (
  <div className="card">
    <h3>New Customer</h3>
    {formError && <p style={{ color: 'salmon' }}>Error: {formError}</p>}
    <form onSubmit={submitCustomer}>
      <div className="grid grid-cols-2 gap-4">
        <div className="field">
          <label>Name</label>
          <input style={{ width: '100%' }} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>Email</label>
          <input style={{ width: '100%' }} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label>Phone (optional)</label>
          <input style={{ width: '100%' }} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="field">
          <label>First order amount ₹ (optional)</label>
          <input style={{ width: '100%' }} type="number" value={form.orderAmount} onChange={(e) => setForm({ ...form, orderAmount: e.target.value })} />
        </div>
        <div className="field" style={{ gridColumn: 'span 2' }}>
          <label>Order items (optional)</label>
          <input style={{ width: '100%' }} value={form.orderItems} onChange={(e) => setForm({ ...form, orderItems: e.target.value })} placeholder="e.g. Cotton T-Shirt, Sneakers" />
        </div>
      </div>
      <button className="btn" type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Customer'}
      </button>
    </form>
  </div>
)}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>Total Customers</p>
          <p className="text-3xl font-bold text-indigo-600">{customers.length}</p>
        </div>
        <div className="card">
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>Avg Spend</p>
          <p className="text-3xl font-bold text-emerald-600">₹{avgSpend.toLocaleString()}</p>
        </div>
        <div className="card">
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>Avg Orders</p>
          <p className="text-3xl font-bold text-orange-600">{avgOrders}</p>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Email</th>
              <th>Total Spend</th><th>Orders</th><th>Days Since Last Order</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>₹{c.total_spend}</td>
                <td>{c.order_count}</td>
                <td>{c.days_since_last_order ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
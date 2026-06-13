import { useEffect, useState } from 'react';
import { apiGet } from '../api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiGet('/api/customers')
      .then(setCustomers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading customers...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  const totalSpend = customers.reduce((s, c) => s + Number(c.total_spend || 0), 0);
  const totalOrders = customers.reduce((s, c) => s + Number(c.order_count || 0), 0);
  const avgSpend = customers.length ? Math.round(totalSpend / customers.length) : 0;
  const avgOrders = customers.length ? (totalOrders / customers.length).toFixed(1) : 0;

  return (
    <div>
      <h1>Customers</h1>
      <p style={{ color: '#64748b', marginBottom: 20 }}>Your shopper database</p>

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
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

  return (
    <div>
      <h1>Customers ({customers.length})</h1>
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
  );
}   
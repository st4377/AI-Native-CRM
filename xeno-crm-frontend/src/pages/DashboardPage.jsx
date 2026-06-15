import { useEffect, useState } from 'react';
import { apiGet } from '../api';

export default function DashboardPage() {
  const [customers, setCustomers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([apiGet('/api/customers'), apiGet('/api/campaigns'), apiGet('/api/segments')])
      .then(([c, cam, seg]) => { setCustomers(c); setCampaigns(cam); setSegments(seg); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  const totalSent = campaigns.reduce((s, c) => s + Number(c.total_count || 0), 0);
  const totalDelivered = campaigns.reduce((s, c) => s + Number(c.delivered_count || 0), 0);
  const totalOpened = campaigns.reduce((s, c) => s + Number(c.opened_count || 0), 0);
  const totalClicked = campaigns.reduce((s, c) => s + Number(c.clicked_count || 0), 0);
  const pct = (num, den) => (den > 0 ? ((num / den) * 100).toFixed(1) : '0.0');

  const stats = [
    { label: 'Total Customers', value: customers.length, color: 'text-indigo-600' },
    { label: 'Total Segments', value: segments.length, color: 'text-emerald-600' },
    { label: 'Total Campaigns', value: campaigns.length, color: 'text-orange-600' },
    { label: 'Messages Sent', value: totalSent, color: 'text-slate-700' },
    { label: 'Delivery Rate', value: `${pct(totalDelivered, totalSent)}%`, color: 'text-emerald-600' },
    { label: 'Open Rate', value: `${pct(totalOpened, totalSent)}%`, color: 'text-indigo-600' },
    { label: 'Click Rate', value: `${pct(totalClicked, totalSent)}%`, color: 'text-orange-600' },
  ];

  return (
    <div>
      <h1>Dashboard</h1>
      <p style={{ color: '#64748b', marginBottom: 20 }}>Overview of your CRM activity</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Recent Campaigns</h3>
        <table className="data-table">
          <thead>
            <tr><th>Campaign</th><th>Channel</th><th>Segment</th><th>Sent</th><th>Delivered</th><th>Opened</th><th>Clicked</th><th>Status</th></tr>
          </thead>
          <tbody>
            {campaigns.slice(0, 5).map((c) => (
              <tr key={c.id}>
                <td>{c.name || c.segment_name}</td>
                <td>{c.channel}</td>
                <td>{c.segment_name}</td>
                <td>{c.total_count}</td>
                <td>{c.delivered_count}</td>
                <td>{c.opened_count}</td>
                <td>{c.clicked_count}</td>
                <td><span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
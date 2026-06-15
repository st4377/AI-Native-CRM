import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api';

const FIELD_LABELS = {
  total_spend: 'Spend',
  order_count: 'Orders',
  days_since_last_order: 'Inactive days',
};

function formatRules(rules) {
  if (!rules?.conditions?.length) return [];
  return rules.conditions.map((c) => {
    const label = FIELD_LABELS[c.field] || c.field;
    const value = c.field === 'total_spend' ? `₹${c.value}` : c.value;
    return `${label} ${c.op} ${value}`;
  });
}

export default function SegmentsPage() {
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState(null);
  const [preview, setPreview] = useState(null);
  const [name, setName] = useState('');
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadSegments = () => apiGet('/api/segments').then(setSegments).catch((e) => setError(e.message));

  useEffect(() => { loadSegments(); }, []);

  const generateFromDescription = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost('/api/segments/preview', { description });
      setRules(res.rules);
      setPreview({ count: res.count, customers: res.customers });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSegment = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiPost('/api/segments', { name, rules, description: description || null });
      setName('');
      setRules(null);
      setPreview(null);
      setDescription('');
      loadSegments();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1>Segments</h1>

      <div className="card">
        <h3>1. Describe your audience</h3>
        <div className="field">
          <label>Describe who you want to target (plain English)</label>
          <input
            style={{ width: '100%' }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. high spenders who haven't ordered in 30 days"
          />
        </div>
        <button className="btn" onClick={generateFromDescription} disabled={loading || !description}>
          {loading ? 'Thinking...' : 'Generate with AI'}
        </button>
      </div>

      {error && <p style={{ color: 'salmon' }}>Error: {error}</p>}

      {preview && (
        <div className="card">
          <h3>2. Matching customers</h3>
          <p><strong>{preview.count}</strong> customers match.</p>
          {formatRules(rules).map((r, i) => (
            <span key={i} style={{
              display: 'inline-block', background: '#eef2ff', color: '#4338ca',
              fontSize: 12, padding: '3px 10px', borderRadius: 12, marginRight: 6, marginBottom: 8,
            }}>
              {r}
            </span>
          ))}
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Total Spend</th><th>Orders</th><th>Days Since Last Order</th></tr></thead>
            <tbody>
              {preview.customers.slice(0, 10).map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td><td>{c.email}</td><td>₹{c.total_spend}</td>
                  <td>{c.order_count}</td><td>{c.days_since_last_order ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.count > 10 && <p style={{ color: '#888' }}>...and {preview.count - 10} more</p>}

          <div style={{ marginTop: 12 }}>
            <h3>3. Save this segment</h3>
            <div className="field">
              <label>Segment name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. High spenders - inactive" />
            </div>
            <button className="btn" onClick={saveSegment} disabled={saving || !name}>
              {saving ? 'Saving...' : 'Save Segment'}
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Saved segments</h3>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Name</th><th>Current size</th><th>Description & Rules</th></tr></thead>
          <tbody>
            {segments.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.name}</td>
                <td>{s.current_count}</td>
                <td>
                  {s.description && <p style={{ marginBottom: 6, fontSize: 14 }}>{s.description}</p>}
                  {formatRules(s.rules).map((r, i) => (
                    <span key={i} style={{
                      display: 'inline-block', background: '#eef2ff', color: '#4338ca',
                      fontSize: 12, padding: '3px 10px', borderRadius: 12, marginRight: 6, marginBottom: 4,
                    }}>
                      {r}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
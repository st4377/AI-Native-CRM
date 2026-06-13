import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api';

export default function SegmentsPage() {
  const [description, setDescription] = useState('');
  const [rulesJson, setRulesJson] = useState('');
  const [preview, setPreview] = useState(null); // { count, customers }
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
      setRulesJson(JSON.stringify(res.rules, null, 2));
      setPreview({ count: res.count, customers: res.customers });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const previewEditedRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const rules = JSON.parse(rulesJson);
      const res = await apiPost('/api/segments/preview', { rules });
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
      const rules = JSON.parse(rulesJson);
      await apiPost('/api/segments', { name, rules });
      setName('');
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

      {rulesJson && (
        <div className="card">
          <h3>2. Review / edit rules</h3>
          <div className="field">
            <label>Rules (JSON — you can edit this manually)</label>
            <textarea
              style={{ width: '100%', minHeight: 120, fontFamily: 'monospace' }}
              value={rulesJson}
              onChange={(e) => setRulesJson(e.target.value)}
            />
          </div>
          <button className="btn secondary" onClick={previewEditedRules} disabled={loading}>
            Preview these rules
          </button>

          {preview && (
            <div style={{ marginTop: 12 }}>
              <p><strong>{preview.count}</strong> customers match.</p>
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
            </div>
          )}

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
          <thead><tr><th>ID</th><th>Name</th><th>Current size</th><th>Rules</th></tr></thead>
          <tbody>
            {segments.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.name}</td>
                <td>{s.current_count}</td>
                <td><code style={{ fontSize: 12 }}>{JSON.stringify(s.rules)}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
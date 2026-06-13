import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api';

export default function CampaignsPage() {
  const [segments, setSegments] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  const [segmentId, setSegmentId] = useState('');
  const [channel, setChannel] = useState('email');
  const [goal, setGoal] = useState('');
  const [variants, setVariants] = useState([]);
  const [message, setMessage] = useState('');

  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const [summaries, setSummaries] = useState({}); // campaignId -> summary text
  const [loadingSummary, setLoadingSummary] = useState(null);

  const loadSegments = () => apiGet('/api/segments').then(setSegments).catch((e) => setError(e.message));
  const loadCampaigns = () => apiGet('/api/campaigns').then(setCampaigns).catch((e) => setError(e.message));

  useEffect(() => { loadSegments(); loadCampaigns(); }, []);

  const draftMessages = async () => {
    setDrafting(true);
    setError(null);
    try {
      const res = await apiPost('/api/campaigns/draft-messages', { segmentId: Number(segmentId), channel, goal });
      setVariants(res.variants);
      setMessage(res.variants[0] || '');
    } catch (e) {
      setError(e.message);
    } finally {
      setDrafting(false);
    }
  };

  const sendCampaign = async () => {
    setSending(true);
    setError(null);
    try {
      await apiPost('/api/campaigns', { segmentId: Number(segmentId), message, channel });
      setGoal('');
      setVariants([]);
      setMessage('');
      loadCampaigns();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const loadSummary = async (id) => {
    setLoadingSummary(id);
    try {
      const res = await apiGet(`/api/campaigns/${id}/summary`);
      setSummaries((prev) => ({ ...prev, [id]: res.summary }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingSummary(null);
    }
  };

  return (
    <div>
      <h1>Campaigns</h1>

      <div className="card">
        <h3>1. Choose a segment and goal</h3>
        <div className="field">
          <label>Segment</label>
          <select value={segmentId} onChange={(e) => setSegmentId(e.target.value)}>
            <option value="">-- select segment --</option>
            {segments.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.current_count} customers)</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Channel</label>
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="rcs">RCS</option>
          </select>
        </div>
        <div className="field">
          <label>Campaign goal (for AI drafting)</label>
          <input
            style={{ width: '100%' }}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. win back inactive customers with a discount"
          />
        </div>
        <button className="btn" onClick={draftMessages} disabled={drafting || !segmentId || !goal}>
          {drafting ? 'Drafting...' : 'Draft Messages with AI'}
        </button>
      </div>

      {error && <p style={{ color: 'salmon' }}>Error: {error}</p>}

      {variants.length > 0 && (
        <div className="card">
          <h3>2. Pick / edit your message</h3>
          {variants.map((v, i) => (
            <div key={i} className="field">
              <label>
                <input type="radio" name="variant" checked={message === v} onChange={() => setMessage(v)} /> Variant {i + 1}
              </label>
              <p style={{ color: '#aaa', marginLeft: 20 }}>{v}</p>
            </div>
          ))}
          <div className="field">
            <label>Final message ({"{{name}}"} will be replaced per customer)</label>
            <textarea style={{ width: '100%', minHeight: 80 }} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <button className="btn" onClick={sendCampaign} disabled={sending || !message}>
            {sending ? 'Sending...' : 'Send Campaign'}
          </button>
        </div>
      )}

      <div className="card">
        <h3>Past campaigns</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Segment</th><th>Channel</th><th>Audience</th>
              <th>Delivered</th><th>Failed</th><th>Opened</th><th>Clicked</th><th>AI Summary</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.segment_name}</td>
                <td>{c.channel}</td>
                <td>{c.audience_size}</td>
                <td>{c.delivered_count}</td>
                <td>{c.failed_count}</td>
                <td>{c.opened_count}</td>
                <td>{c.clicked_count}</td>
                <td style={{ maxWidth: 300 }}>
                  {summaries[c.id]
                    ? <span style={{ fontSize: 13 }}>{summaries[c.id]}</span>
                    : <button className="btn secondary" onClick={() => loadSummary(c.id)} disabled={loadingSummary === c.id}>
                        {loadingSummary === c.id ? 'Thinking...' : 'Get AI Summary'}
                      </button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
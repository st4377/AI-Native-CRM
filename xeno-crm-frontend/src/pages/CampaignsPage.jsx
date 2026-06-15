import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api';

export default function CampaignsPage() {
  const [segments, setSegments] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  const [campaignName, setCampaignName] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [channel, setChannel] = useState('email');
  const [goal, setGoal] = useState('');
  const [variants, setVariants] = useState([]);
  const [message, setMessage] = useState('');

  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const [summaries, setSummaries] = useState({});
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
      await apiPost('/api/campaigns', {
        segmentId: Number(segmentId),
        message,
        channel,
        name: campaignName || null,
      });
      setCampaignName('');
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
          <label>Campaign name (optional)</label>
          <input
            style={{ width: '100%' }}
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="e.g. Win-back June 2026"
          />
        </div>
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

      <div>
        <h3 style={{ marginBottom: 12 }}>Past Campaigns</h3>
        {campaigns.map((c) => {
          const icon = { email: '📧', sms: '💬', whatsapp: '🟢', rcs: '📱' }[c.channel] || '✉️';
          return (
            <div key={c.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-lg mr-2">{icon}</span>
                  <span className="font-semibold">{c.name || c.segment_name}</span>
                  <span className="ml-2 text-xs px-2 py-1 rounded-full" style={{ background: '#dcfce7', color: '#166534' }}>{c.status}</span>
                </div>
                <span className="text-xs text-slate-400">{c.channel.toUpperCase()}</span>
              </div>
              {c.name && <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>Segment: {c.segment_name}</p>}
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 12 }}>{c.message}</p>
              <div className="grid grid-cols-4 gap-4 mb-3">
                <div><p className="text-xl font-bold">{c.total_count}</p><p style={{ fontSize: 12, color: '#94a3b8' }}>Sent</p></div>
                <div><p className="text-xl font-bold text-emerald-600">{c.delivered_count}</p><p style={{ fontSize: 12, color: '#94a3b8' }}>Delivered</p></div>
                <div><p className="text-xl font-bold text-indigo-600">{c.opened_count}</p><p style={{ fontSize: 12, color: '#94a3b8' }}>Opened</p></div>
                <div><p className="text-xl font-bold text-orange-600">{c.clicked_count}</p><p style={{ fontSize: 12, color: '#94a3b8' }}>Clicked</p></div>
              </div>
              {summaries[c.id]
                ? <p style={{ fontSize: 13, color: '#475569', background: '#eef2ff', padding: 10, borderRadius: 8 }}>{summaries[c.id]}</p>
                : <button className="btn secondary" onClick={() => loadSummary(c.id)} disabled={loadingSummary === c.id}>
                    {loadingSummary === c.id ? 'Thinking...' : '✨ Get AI Summary'}
                  </button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default function Sidebar({ tab, setTab }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'segments', label: 'Segments', icon: '🎯' },
    { id: 'campaigns', label: 'Campaigns', icon: '📣' },
  ];
  return (
    <aside className="w-60 bg-slate-900 text-slate-200 flex flex-col p-4 min-h-screen">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-indigo-400">Xeno CRM</h1>
        <p className="text-xs text-slate-400">AI-native Mini CRM</p>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`text-left px-3 py-2 rounded-md text-sm transition ${
              tab === item.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <span className="mr-2">{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>
      <div className="mt-auto text-xs text-slate-500 pt-4">
      </div>
    </aside>
  );
}
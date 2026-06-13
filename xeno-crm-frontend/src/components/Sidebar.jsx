export default function Sidebar({ tab, setTab }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'segments', label: 'Segments', icon: '🎯' },
    { id: 'campaigns', label: 'Campaigns', icon: '📣' },
  ];
  return (
    <aside className="w-full md:w-60 bg-slate-900 text-slate-200 flex flex-row md:flex-col items-center md:items-stretch p-2 md:p-4 md:min-h-screen overflow-x-auto">
      <div className="mr-4 md:mr-0 md:mb-8 flex-shrink-0">
        <h1 className="text-lg md:text-xl font-bold text-indigo-400">Xeno CRM</h1>
        <p className="hidden md:block text-xs text-slate-400">AI-native Mini CRM</p>
      </div>
      <nav className="flex flex-row md:flex-col gap-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`whitespace-nowrap text-left px-3 py-2 rounded-md text-sm transition ${
              tab === item.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            <span className="mr-2">{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>
      <div className="hidden md:block mt-auto text-xs text-slate-500 pt-4">
        
      </div>
    </aside>
  );
}
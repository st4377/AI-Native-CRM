export default function Sidebar({ tab, setTab }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard'  },
    { id: 'customers', label: 'Customers'  },
    { id: 'segments', label: 'Segments'  },
    { id: 'campaigns', label: 'Campaigns'  },
  ];
  return (
    <aside className="w-full md:w-60 bg-[#16151f] text-slate-200 flex flex-row md:flex-col items-center md:items-stretch p-2 md:p-4 md:min-h-screen overflow-x-auto">
      <div className="mr-4 md:mr-0 md:mb-8 flex-shrink-0">
        <h1 className="text-lg md:text-xl font-extrabold tracking-tight" style={{ color: '#5eead4' }}>Xeno</h1>
<span className="hidden md:inline text-lg font-light text-slate-400"> CRM</span>
        <p className="hidden md:block text-xs text-slate-400">AI-native Mini CRM</p>
      </div>
      <nav className="flex flex-row md:flex-col gap-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`whitespace-nowrap text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
  tab === item.id ? 'bg-[#5eead4] text-[#16151f]' : 'hover:bg-white/5 text-slate-400'
}`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="hidden md:block mt-auto text-xs text-slate-500 pt-4">
        
      </div>
    </aside>
  );
}
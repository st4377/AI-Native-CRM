import { useState } from 'react';
import CustomersPage from './pages/CustomersPage';
import SegmentsPage from './pages/SegmentsPage';
import './App.css';

export default function App() {
  const [tab, setTab] = useState('customers');

  return (
    <div className="app">
      <nav className="tabs">
        <button className={tab === 'customers' ? 'active' : ''} onClick={() => setTab('customers')}>Customers</button>
        <button className={tab === 'segments' ? 'active' : ''} onClick={() => setTab('segments')}>Segments</button>
        <button className={tab === 'campaigns' ? 'active' : ''} onClick={() => setTab('campaigns')}>Campaigns</button>
      </nav>
      <main>
        {tab === 'customers' && <CustomersPage />}
        {tab === 'segments' && <SegmentsPage />}
        {tab === 'campaigns' && <p>Campaigns page coming next...</p>}
      </main>
    </div>
  );
}
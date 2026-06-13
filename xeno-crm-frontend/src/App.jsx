import { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import SegmentsPage from './pages/SegmentsPage';
import CampaignsPage from './pages/CampaignsPage';
import './App.css';

export default function App() {
  const [tab, setTab] = useState('dashboard');

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar tab={tab} setTab={setTab} />
      <main className="flex-1 p-8">
        {tab === 'dashboard' && <DashboardPage />}
        {tab === 'customers' && <CustomersPage />}
        {tab === 'segments' && <SegmentsPage />}
        {tab === 'campaigns' && <CampaignsPage />}
      </main>
    </div>
  );
}
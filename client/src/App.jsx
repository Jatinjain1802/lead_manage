import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import LeadTable from './components/LeadTable';
import ChatWindow from './components/ChatWindow';
import UserManagement from './components/UserManagement';
import Analytics from './components/Analytics';
import { LayoutDashboard, Users, LogOut, ShieldCheck, Settings, BarChart3, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ active, icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${active
        ? 'bg-blue-600/10 text-blue-500 border border-blue-600/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]'
        : 'hover:bg-slate-900/50 text-slate-400 hover:text-slate-200'
      }`}
  >
    <Icon className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
    <span className="font-medium text-sm">{label}</span>
    {active && (
      <motion.div
        layoutId="sidebar-active"
        className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
      />
    )}
  </button>
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [selectedLead, setSelectedLead] = useState(null);
  const [activeTab, setActiveTab] = useState('leads');

  const renderContent = () => {
    switch (activeTab) {
      case 'leads':
        return (
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-3xl font-bold text-white tracking-tight">Lead Intelligence</h3>
                <p className="text-slate-400 mt-1">Real-time WhatsApp traffic from your Meta advertising campaigns.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <LeadTable onOpenChat={(lead) => setSelectedLead(lead)} />
            </div>
          </div>
        );
      case 'analytics':
        return <Analytics />;
      case 'users':
        return <UserManagement />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-900 bg-[#020617] flex flex-col z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              LeadManage <span className="text-blue-500">AI</span>
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-4 mb-2">Main Menu</div>
          <SidebarItem
            active={activeTab === 'leads'}
            icon={LayoutDashboard}
            label="Live Inbox"
            onClick={() => setActiveTab('leads')}
          />

          {user?.role === 'admin' && (
            <SidebarItem
              active={activeTab === 'analytics'}
              icon={BarChart3}
              label="Analytics"
              onClick={() => setActiveTab('analytics')}
            />
          )}

          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-4 mt-8 mb-2">Administration</div>
          {user?.role === 'admin' && (
            <SidebarItem
              active={activeTab === 'users'}
              icon={Users}
              label="Team Intelligence"
              onClick={() => setActiveTab('users')}
            />
          )}
          <SidebarItem
            active={activeTab === 'settings'}
            icon={Settings}
            label="Account Settings"
            onClick={() => { }}
          />
        </nav>

        <div className="p-4 mt-auto">
          <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/50 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-white truncate">{user?.name}</div>
                <div className="text-[10px] text-blue-500 font-bold tracking-wider uppercase">{user?.role}</div>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-20 border-b border-slate-900 flex items-center justify-between px-8 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-10 transition-all">
          <div>
            <h2 className="text-lg font-semibold text-white uppercase tracking-widest text-[11px]">
              {activeTab === 'leads' ? 'Lead Intelligence' : activeTab === 'analytics' ? 'Performance Insights' : 'Team Directory'}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#020617]" />
            </button>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div className="bg-slate-900/80 px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-800 shadow-xl shadow-blue-500/5">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">Node Live</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.05),transparent_40%)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {selectedLead && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedLead(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              />
              <ChatWindow
                lead={selectedLead}
                onClose={() => setSelectedLead(null)}
                canSend={user?.canViewChat || user?.role === 'admin'}
              />
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

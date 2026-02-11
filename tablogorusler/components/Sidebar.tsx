import React from 'react';
import { LayoutDashboard, Table, ShieldCheck, BookOpen, History, PanelLeftClose, PanelLeft, BarChart3 } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  userRole: string;
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole, collapsed, onToggle }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'table', label: 'Veri İnceleme & Onay', icon: <Table size={20} /> },
  ];

  if (userRole === 'admin' || userRole === 'moderator') {
    menuItems.push({ id: 'history', label: 'Değişiklik Geçmişi', icon: <History size={20} /> });
  }

  if (userRole === 'admin') {
    menuItems.push({ id: 'report', label: 'Raporlar', icon: <BarChart3 size={20} /> });
    menuItems.push({ id: 'admin', label: 'Yönetim Paneli', icon: <ShieldCheck size={20} /> });
  }

  return (
    <aside className={`${collapsed ? 'w-[72px]' : 'w-64'} relative bg-slate-900 text-white flex flex-col shadow-2xl z-20 transition-all duration-300 ease-in-out flex-shrink-0`}>
      {/* Header */}
      <div className={`${collapsed ? 'p-4 justify-center' : 'p-6'} flex items-center gap-3 border-b border-slate-800/50`}>
        <div className="bg-blue-600 p-2 rounded-2xl shadow-lg shadow-blue-500/20 flex-shrink-0">
          <BookOpen size={20} className="text-white" />
        </div>
        {!collapsed && <h1 className="text-lg font-black tracking-tight uppercase whitespace-nowrap">MEB Panel</h1>}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        aria-label={collapsed ? 'Paneli Genişlet' : 'Paneli Daralt'}
        title={collapsed ? 'Paneli Aç' : 'Paneli Kapat'}
        className="absolute -right-4 top-20 z-30 inline-flex items-center gap-2 rounded-full border border-blue-200/40 bg-slate-800/95 px-3 py-2 text-[11px] font-bold text-slate-100 shadow-xl shadow-blue-500/20 ring-1 ring-slate-700/60 backdrop-blur hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white transition-all"
      >
        {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        {!collapsed && <span className="hidden lg:inline">Paneli Daralt</span>}
      </button>

      {/* Nav */}
      <nav className={`flex-1 ${collapsed ? 'px-2 py-2' : 'p-4'} space-y-2`}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={collapsed ? item.label : undefined}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} rounded-[1.25rem] transition-all duration-300 ${
              activeTab === item.id
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <span className={`flex-shrink-0 ${activeTab === item.id ? 'text-white' : 'text-slate-500'}`}>{item.icon}</span>
            {!collapsed && <span className="font-black text-xs uppercase tracking-widest whitespace-nowrap">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 mt-auto">
          <div className="bg-slate-800/50 rounded-2xl p-4 text-sm text-slate-400 border border-slate-700/50 backdrop-blur-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Eğitim Materyalleri</p>
            <p className="font-black text-white text-lg tracking-tight">V2.0.0</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

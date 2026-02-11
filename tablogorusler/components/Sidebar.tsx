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

  // Tüm roller değişiklik geçmişini görebilir
  menuItems.push({ id: 'history', label: 'Değişiklik Geçmişi', icon: <History size={20} /> });

  if (userRole === 'admin') {
    menuItems.push({ id: 'report', label: 'Raporlar', icon: <BarChart3 size={20} /> });
    menuItems.push({ id: 'admin', label: 'Yönetim Paneli', icon: <ShieldCheck size={20} /> });
  }

  return (
    <aside className={`${collapsed ? 'w-[72px]' : 'w-64'} bg-slate-900 text-white flex flex-col shadow-2xl z-20 transition-all duration-300 ease-in-out flex-shrink-0`}>
      {/* Header */}
      <div className={`${collapsed ? 'p-4 justify-center' : 'p-6'} flex items-center gap-3 border-b border-slate-800/50`}>
        <div className="bg-blue-600 p-2 rounded-2xl shadow-lg shadow-blue-500/20 flex-shrink-0">
          <BookOpen size={20} className="text-white" />
        </div>
        {!collapsed && <h1 className="text-lg font-black tracking-tight uppercase whitespace-nowrap">E-İçerik Tablosu</h1>}
      </div>

      {/* Toggle Button - Modern & Visible */}
      <button
        onClick={onToggle}
        className={`mx-3 mt-3 mb-1 flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-300 border ${
          collapsed
            ? 'justify-center bg-slate-800 border-slate-700 text-slate-300 hover:bg-blue-600 hover:border-blue-500 hover:text-white'
            : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-blue-600/20 hover:border-blue-500/50 hover:text-blue-300'
        }`}
        title={collapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt'}
      >
        {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        {!collapsed && <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">Menüyü Daralt</span>}
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
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">E-İçerik Tablosu</p>
            <p className="font-black text-white text-lg tracking-tight">V2.0.0</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

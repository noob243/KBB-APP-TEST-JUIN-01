import React, { FC, useState } from 'react';
import { 
  Icon, 
  DashboardIcon, 
  ClientsIcon, 
  CasesIcon, 
  AIIcon, 
  ChatIcon, 
  BillingIcon, 
  AvocatsIcon, 
  PersonnelsIcon, 
  SuppliersIcon, 
  LogoutIcon, 
  StaffIcon,
  EyeIcon
} from './Icons';

interface BottomNavBarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  onLogout: () => void;
}

const BottomNavBar: FC<BottomNavBarProps> = ({ currentPage, setCurrentPage, onLogout }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainItems = [
    { name: 'Dashboard', icon: <DashboardIcon />, label: 'Tableau' },
    { name: 'AIAssistant', icon: <AIIcon />, label: 'AI' },
    { name: 'Clients', icon: <ClientsIcon />, label: 'Clients' },
    { name: 'Dossiers', icon: <CasesIcon />, label: 'Dossiers' },
  ];

  const moreItems = [
    { name: 'All', icon: <EyeIcon />, label: "Toutes les interfaces" },
    { name: 'Procedures', icon: <svg className="w-5 h-5 text-indigo-400 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>, label: "Procédures" },
    { name: 'Agenda', icon: <svg className="w-4 h-4 text-indigo-400 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>, label: "Tâches" },
    { name: 'Evenements', icon: <svg className="w-4 h-4 text-indigo-400 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, label: "Événements" },
    { name: 'Chat', icon: <ChatIcon />, label: "Chat" },
    { name: 'Facturation', icon: <BillingIcon />, label: "Facturation" },
    { name: 'Avocats', icon: <AvocatsIcon />, label: "Avocats" },
    { name: 'Personnels', icon: <PersonnelsIcon />, label: "Personnels" },
    { name: 'Fournisseurs', icon: <SuppliersIcon />, label: "Fournisseurs" },
    { name: 'Gestion', icon: <StaffIcon />, label: "Gestion" }
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <div className="kbb-bottom-nav md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#15447c] border-t border-indigo-900/30 flex items-center justify-around px-2 z-50 shadow-lg text-slate-100">
        {mainItems.map((item) => {
          const isActive = currentPage === item.name;
          return (
            <button
              key={item.name}
              onClick={() => {
                setCurrentPage(item.name);
                setShowMoreMenu(false);
              }}
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
                isActive 
                  ? 'text-white bg-black/25 font-bold scale-105' 
                  : 'text-slate-350 hover:text-white'
              }`}
            >
              <span className="text-xl flex items-center justify-center p-0 m-0 shrink-0">
                {React.cloneElement(item.icon, { className: 'w-5 h-5 m-0' })}
              </span>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* Toggle Button for More Items */}
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
            showMoreMenu || moreItems.some(x => x.name === currentPage)
              ? 'text-white bg-black/20 font-bold scale-105' 
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <span className="text-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5-5.25h16.5m-16.5 10.5h16.5" />
            </svg>
          </span>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Plus</span>
        </button>
      </div>

      {/* Popover Menu Drawer for remaining navigation items */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowMoreMenu(false)}
          />
          {/* Drawer Menu */}
          <div className="relative bg-[#15447c] rounded-t-3xl border-t border-indigo-900/40 p-5 max-h-[75vh] overflow-y-auto z-10 text-slate-100 shadow-2xl animate-slide-up">
            <div className="w-12 h-1 bg-slate-300/30 rounded-full mx-auto mb-4" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-450 mb-3 px-2">Menu Global</h3>
            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => {
                const isActive = currentPage === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setCurrentPage(item.name);
                      setShowMoreMenu(false);
                    }}
                    className={`flex items-center px-4 py-3 rounded-2xl text-xs font-semibold tracking-wide transition-all ${
                      isActive 
                        ? 'bg-white/10 text-white font-black border border-white/10 shadow-inner' 
                        : 'text-slate-300 hover:bg-black/15 hover:text-white'
                    }`}
                  >
                    <span className="mr-3 h-5 w-5 flex items-center justify-center shrink-0">
                      {React.cloneElement(item.icon as React.ReactElement, { className: 'w-4 h-4' })}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
              <button 
                onClick={() => {
                  setShowMoreMenu(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center px-4 py-3.5 rounded-2xl text-xs font-bold bg-rose-950/40 hover:bg-rose-900/40 text-rose-350 border border-rose-900/20 transition-colors"
              >
                <span className="mr-2 h-4 w-4 flex items-center justify-center shrink-0">
                  <LogoutIcon className="w-4 h-4" />
                </span>
                Déconnexion du Cabinet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNavBar;

import React, { FC, useState, useEffect } from 'react';
import { 
  Icon, 
  DashboardIcon, 
  ClientsIcon, 
  CasesIcon, 
  EventsIcon, 
  AgendaIcon, 
  ChatIcon, 
  BillingIcon, 
  AvocatsIcon, 
  StaffIcon, 
  PersonnelsIcon, 
  SuppliersIcon, 
  LogoutIcon, 
  EyeIcon, 
  AIIcon 
} from './Icons';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  onLogout: () => void;
}

const Sidebar: FC<SidebarProps> = ({ currentPage, setCurrentPage, onLogout }) => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('kbb_sidebar_collapsed') === 'true';
        }
        return false;
    });
    
    const [isAgendaExpanded, setIsAgendaExpanded] = useState(
        currentPage === 'Agenda' || currentPage === 'Evenements'
    );

    useEffect(() => {
        if (currentPage === 'Agenda' || currentPage === 'Evenements') {
            setIsAgendaExpanded(true);
        }
    }, [currentPage]);

    const toggleCollapse = () => {
        const nextState = !isCollapsed;
        setIsCollapsed(nextState);
        localStorage.setItem('kbb_sidebar_collapsed', String(nextState));
    };

    const navItems = [
        { name: 'All', icon: <EyeIcon />, label: "Toutes les interfaces" },
        { name: 'Dashboard', icon: <DashboardIcon />, label: "Tableau de bord" },
        { name: 'AIAssistant', icon: <AIIcon />, label: "Otshudi AI" },
        { name: 'Clients', icon: <ClientsIcon />, label: "Clients" },
        { name: 'Dossiers', icon: <CasesIcon />, label: "Dossiers" },
        { name: 'Procedures', icon: <svg className="w-5 h-5 text-indigo-400 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>, label: "Procédures" },
        { 
            name: 'AgendaGroup', 
            icon: <AgendaIcon />, 
            label: "Agenda", 
            isGroup: true,
            subItems: [
                { 
                    name: 'Agenda', 
                    icon: (
                        <svg className="w-4 h-4 text-indigo-400 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    ), 
                    label: "Tâches" 
                },
                { 
                    name: 'Evenements', 
                    icon: (
                        <svg className="w-4 h-4 text-indigo-400 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    ), 
                    label: "Événements" 
                }
            ]
        },
        { name: 'Chat', icon: <ChatIcon />, label: "Chat" },
        { name: 'Facturation', icon: <BillingIcon />, label: "Facturation" },
        { name: 'Avocats', icon: <AvocatsIcon />, label: "Avocats" },
        { name: 'Personnels', icon: <PersonnelsIcon />, label: "Personnels" },
        { name: 'Fournisseurs', icon: <SuppliersIcon />, label: "Fournisseurs" },
        { name: 'Gestion', icon: <StaffIcon />, label: "Gestion" }
    ];

    return (
        <aside 
            data-collapsed={isCollapsed}
            className={`kbb-sidebar bg-[#15447c] text-slate-100 flex-shrink-0 flex flex-col p-4 transition-all duration-300 md:flex hidden ${
                isCollapsed ? 'w-20' : 'w-64'
            }`}
        >
            {/* Top Brand Section */}
            <div className="flex items-center justify-between mb-6 p-2 overflow-hidden min-h-[40px]">
                {!isCollapsed && (
                    <div className="flex items-center text-xl font-bold truncate animate-fadeIn">
                        <svg className="w-8 h-8 mr-2 text-indigo-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                        </svg>
                        <span className="truncate">KBB App</span>
                    </div>
                )}
                {isCollapsed && (
                    <svg className="w-8 h-8 text-indigo-400 mx-auto shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                    </svg>
                )}
                
                {/* Collapse / Expand Toggle Button */}
                <button 
                    onClick={toggleCollapse} 
                    className={`p-1.5 rounded-lg bg-black/10 hover:bg-black/25 text-indigo-300 transition-colors shrink-0 ${
                        isCollapsed ? 'absolute left-[18px] top-6 z-10' : ''
                    }`}
                >
                    <svg 
                        className={`w-4 h-4 transform transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        strokeWidth={2.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                    </svg>
                </button>
            </div>
            
            {/* Navigation links */}
            <nav className="flex-1 overflow-y-auto custom-scrollbar space-y-1 -mx-2 px-2">
                {navItems.map(item => {
                    const isSelectedGroup = currentPage === 'Agenda' || currentPage === 'Evenements';
                    const isActive = currentPage === item.name;

                    // Group item (e.g. Agenda/Tasks/Events)
                    if (item.isGroup) {
                        if (isCollapsed) {
                            // In collapsed mode, render the group as a single button linking to Tasks
                            const isGroupActive = currentPage === 'Agenda' || currentPage === 'Evenements';
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => setCurrentPage('Agenda')}
                                    className={`w-full flex items-center justify-center p-2.5 rounded-xl transition-colors duration-200 ${
                                        isGroupActive 
                                            ? 'bg-black/25 text-white shadow-inner font-bold border border-white/5' 
                                            : 'text-slate-300 hover:bg-black/15 hover:text-white'
                                    }`}
                                    title={item.label}
                                >
                                    <Icon className="m-0 shrink-0">{item.icon}</Icon>
                                </button>
                            );
                        }

                        return (
                            <div key={item.name} className="space-y-1">
                                <button
                                    onClick={() => setIsAgendaExpanded(!isAgendaExpanded)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${
                                        isSelectedGroup 
                                            ? 'bg-black/20 text-white font-semibold' 
                                            : 'text-slate-350 hover:bg-black/20 hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center min-w-0">
                                        <Icon>{item.icon}</Icon>
                                        <span className="ml-3 truncate">{item.label}</span>
                                    </div>
                                    <svg
                                        className={`w-4 h-4 transition-transform duration-200 shrink-0 ${isAgendaExpanded ? 'rotate-90' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                
                                {isAgendaExpanded && item.subItems && (
                                    <div className="pl-4 space-y-1 mt-1 border-l border-white/10 ml-6">
                                        {item.subItems.map(subItem => (
                                            <a
                                                key={subItem.name}
                                                href="#"
                                                onClick={(e) => { e.preventDefault(); setCurrentPage(subItem.name); }}
                                                className={`flex items-center px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                                    currentPage === subItem.name 
                                                        ? 'bg-white/10 text-white italic font-bold' 
                                                        : 'text-slate-350 hover:bg-black/10 hover:text-white'
                                                }`}
                                            >
                                                <span className="mr-2 text-sm">{subItem.icon}</span>
                                                <span>{subItem.label}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    // Single Item
                    return (
                        <a
                            key={item.name}
                            href="#"
                            onClick={(e) => { e.preventDefault(); setCurrentPage(item.name); }}
                            className={`flex items-center rounded-xl transition-all duration-200 ${
                                isCollapsed 
                                    ? 'justify-center p-2.5' 
                                    : 'px-4 py-2.5 text-sm font-medium'
                            } ${
                                isActive 
                                    ? 'bg-black/25 text-white shadow-inner font-bold border border-white/5' 
                                    : 'text-slate-350 hover:bg-black/20 hover:text-white'
                            }`}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <Icon className={isCollapsed ? "m-0 shrink-0" : "shrink-0"}>{item.icon}</Icon>
                            {!isCollapsed && <span className="ml-3 truncate">{item.label}</span>}
                        </a>
                    );
                })}
            </nav>
            
            {/* Bottom Logout Button */}
            <div className="mt-auto pt-4 border-t border-white/10">
                 <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); onLogout(); }} 
                    className={`flex items-center rounded-xl text-slate-350 hover:bg-black/20 hover:text-rose-400 transition-colors duration-200 ${
                        isCollapsed 
                            ? 'justify-center p-2.5' 
                            : 'px-4 py-2.5 text-sm font-medium'
                    }`}
                    title={isCollapsed ? "Déconnexion" : undefined}
                 >
                    <Icon className={isCollapsed ? "m-0 shrink-0" : "shrink-0"}><LogoutIcon /></Icon>
                    {!isCollapsed && <span className="ml-3 truncate">Déconnexion</span>}
                </a>
            </div>
        </aside>
    );
};

export default Sidebar;

import React, { FC, useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    Folders,
    Briefcase,
    Calendar,
    MessageSquare,
    FileText,
    UsersRound,
    Building2,
    LogOut,
    ChevronLeft,
    GanttChartSquare,
    Presentation,
    Settings,
    Bot,
    GanttChart,
    ChevronDown,
    Building,
    BookUser,
    Landmark,
} from 'lucide-react';

interface SidebarProps {
    currentPage: string;
    setCurrentPage: (page: string) => void;
    onLogout: () => void;
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, label: "Tableau de bord" },
    { name: 'AIAssistant', icon: Bot, label: "Otshudi AI" },
    { name: 'Clients', icon: Users, label: "Clients" },
    { name: 'Dossiers', icon: Folders, label: "Dossiers" },
    { name: 'Procedures', icon: GanttChartSquare, label: "Procédures" },
    {
        name: 'AgendaGroup',
        label: "Agenda",
        icon: Calendar,
        subItems: [
            { name: 'Agenda', icon: GanttChart, label: "Tâches" },
            { name: 'Evenements', icon: Presentation, label: "Événements" }
        ]
    },
    { name: 'Facturation', icon: FileText, label: "Facturation" },
    {
        name: 'HumanRessourcesGroup',
        label: "Ressources Humaines",
        icon: BookUser,
        subItems: [
            { name: 'Avocats', icon: Briefcase, label: "Avocats" },
            { name: 'Personnels', icon: UsersRound, label: "Personnels" }
        ]
    },
    { name: 'Fournisseurs', icon: Building2, label: "Fournisseurs" },
    { name: 'Gestion', icon: Landmark, label: "Gestion" },
    { name: 'Chat', icon: MessageSquare, label: "Chat" },
];

const Sidebar: FC<SidebarProps> = ({ currentPage, setCurrentPage, onLogout, isSidebarOpen, toggleSidebar }) => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        return typeof window !== 'undefined' ? localStorage.getItem('kbb_sidebar_collapsed') === 'true' : false;
    });

    const [openGroups, setOpenGroups] = useState<string[]>(() => {
        const activeGroup = navItems.find(item => 'subItems' in item && item.subItems.some(sub => sub.name === currentPage));
        return activeGroup ? [activeGroup.name] : [];
    });

    const toggleCollapse = () => {
        setIsCollapsed(prevState => {
            const newState = !prevState;
            localStorage.setItem('kbb_sidebar_collapsed', String(newState));
            return newState;
        });
    };

    const toggleGroup = (groupName: string) => {
        setOpenGroups(prevOpenGroups =>
            prevOpenGroups.includes(groupName)
                ? prevOpenGroups.filter(g => g !== groupName)
                : [...prevOpenGroups, groupName]
        );
    };

    const handleNavClick = (pageName: string) => {
        setCurrentPage(pageName);
        if (window.innerWidth < 768) {
            toggleSidebar();
        }
    };
    
    useEffect(() => {
        const activeGroup = navItems.find(item => 'subItems' in item && item.subItems.some(sub => sub.name === currentPage));
        if (activeGroup && !openGroups.includes(activeGroup.name)) {
            setOpenGroups(prev => [...prev, activeGroup.name]);
        }
    }, [currentPage]);

    const sidebarClasses = `
        bg-gray-900 text-slate-100 flex-shrink-0 flex flex-col transition-all duration-300
        fixed top-0 left-0 h-full z-40
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        ${isCollapsed ? 'w-20' : 'w-64'}
    `;

    return (
        <>
            <aside data-collapsed={isCollapsed} className={sidebarClasses}>
                <header className={`flex items-center justify-between p-4 ${isCollapsed ? 'py-4' : 'py-4'}`}>
                    <div className={`flex items-center gap-2 ${isCollapsed ? 'justify-center w-full' : ''}`}>
                        <Building className="text-white h-8 w-8" />
                        {!isCollapsed && <span className="text-xl font-bold text-white">KBB App</span>}
                    </div>
                    <button
                        onClick={toggleCollapse}
                        className="p-1.5 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors hidden md:block"
                    >
                        <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
                    </button>
                </header>
                
                <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-1 px-2 py-2">
                    {navItems.map(item => {
                        if ('subItems' in item) {
                            const isGroupOpen = openGroups.includes(item.name);
                            const isGroupActive = item.subItems.some(sub => sub.name === currentPage);

                            return (
                                <div key={item.name}>
                                    <button
                                        onClick={() => isCollapsed ? handleNavClick(item.subItems[0].name) : toggleGroup(item.name)}
                                        className={`w-full flex items-center p-3 rounded-lg text-sm font-semibold transition-colors
                                            ${isCollapsed ? 'justify-center' : 'justify-between'}
                                            ${isGroupActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
                                        }
                                        title={isCollapsed ? item.label : ''}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-5 h-5" />
                                            {!isCollapsed && <span>{item.label}</span>}
                                        </div>
                                        {!isCollapsed && <ChevronDown className={`w-4 h-4 transition-transform ${isGroupOpen ? 'rotate-180' : ''}`} />}
                                    </button>
                                    {!isCollapsed && isGroupOpen && (
                                        <div className="pl-6 mt-1 space-y-1 border-l-2 border-gray-700 ml-3">
                                            {item.subItems.map(subItem => {
                                                const isActive = currentPage === subItem.name;
                                                return (
                                                    <a
                                                        key={subItem.name}
                                                        href="#"
                                                        onClick={(e) => { e.preventDefault(); handleNavClick(subItem.name); }}
                                                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                            isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                                                        }`}
                                                    >
                                                        <subItem.icon className="w-4 h-4" />
                                                        <span>{subItem.label}</span>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        const isActive = currentPage === item.name;
                        return (
                            <a
                                key={item.name}
                                href="#"
                                onClick={(e) => { e.preventDefault(); handleNavClick(item.name); }}
                                className={`flex items-center p-3 rounded-lg text-sm font-semibold transition-colors
                                    ${isCollapsed ? 'justify-center' : ''}
                                    ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
                                }
                                title={isCollapsed ? item.label : ''}
                            >
                                <item.icon className="w-5 h-5" />
                                {!isCollapsed && <span className="ml-3">{item.label}</span>}
                            </a>
                        );
                    })}
                </nav>
                
                <div className="mt-auto p-2">
                     <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); onLogout(); }} 
                        className={`flex items-center p-3 rounded-lg text-gray-400 hover:bg-red-600 hover:text-white transition-colors duration-200
                            ${isCollapsed ? 'justify-center' : ''}`
                        }
                        title={isCollapsed ? "Déconnexion" : ''}
                     >
                        <LogOut className="w-5 h-5" />
                        {!isCollapsed && <span className="ml-3 font-semibold text-sm">Déconnexion</span>}
                    </a>
                </div>
            </aside>
            {isSidebarOpen && <div onClick={toggleSidebar} className="fixed inset-0 bg-black/50 z-30 md:hidden"></div>}
        </>
    );
};

export default Sidebar;

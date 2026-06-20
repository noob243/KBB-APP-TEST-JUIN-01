import React, { FC, useState } from 'react';
import {
    LayoutDashboard,
    Users,
    Folders,
    GanttChart,
    MoreHorizontal,
    LogOut,
    Briefcase,
    UsersRound,
    FileText,
    Building2,
    Landmark,
    MessageSquare, Bot, GanttChartSquare, Presentation
} from 'lucide-react';

interface BottomNavBarProps {
    currentPage: string;
    setCurrentPage: (page: string) => void;
    onLogout: () => void;
}

const mainNavItems = [
    { name: 'Dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { name: 'Clients', icon: Users, label: 'Clients' },
    { name: 'Dossiers', icon: Folders, label: 'Dossiers' },
    { name: 'Agenda', icon: GanttChart, label: 'Tâches' },
];

const moreNavItems = [
    { name: 'Procedures', icon: GanttChartSquare, label: "Procédures" },
    { name: 'Evenements', icon: Presentation, label: "Événements" },
    { name: 'AIAssistant', icon: Bot, label: "Otshudi AI" },
    { name: 'Facturation', icon: FileText, label: "Facturation" },
    { name: 'Avocats', icon: Briefcase, label: "Avocats" },
    { name: 'Personnels', icon: UsersRound, label: "Personnels" },
    { name: 'Fournisseurs', icon: Building2, label: "Fournisseurs" },
    { name: 'Gestion', icon: Landmark, label: "Gestion" },
    { name: 'Chat', icon: MessageSquare, label: "Chat" },
];

const BottomNavBar: FC<BottomNavBarProps> = ({ currentPage, setCurrentPage, onLogout }) => {
    const [isMoreMenuOpen, setMoreMenuOpen] = useState(false);

    const handleNavClick = (pageName: string) => {
        setCurrentPage(pageName);
        setMoreMenuOpen(false);
    };

    const isMoreMenuActive = moreNavItems.some(item => item.name === currentPage);

    return (
        <>
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-gray-900 border-t border-gray-700 flex justify-around items-center px-2 z-50">
                {mainNavItems.map((item) => {
                    const isActive = currentPage === item.name;
                    return (
                        <button
                            key={item.name}
                            onClick={() => handleNavClick(item.name)}
                            className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${isActive ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}>
                            <item.icon className="w-6 h-6 mb-0.5" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </button>
                    );
                })}
                <button
                    onClick={() => setMoreMenuOpen(true)}
                    className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${isMoreMenuActive ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}>
                    <MoreHorizontal className="w-6 h-6 mb-0.5" />
                    <span className="text-xs font-medium">Plus</span>
                </button>
            </div>

            {isMoreMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[60] flex flex-col justify-end">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setMoreMenuOpen(false)}
                    />
                    <div className="relative bg-gray-900 rounded-t-2xl border-t border-gray-700 p-4 pb-6">
                        <div className="grid grid-cols-4 gap-4">
                            {moreNavItems.map(item => {
                                const isActive = currentPage === item.name;
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => handleNavClick(item.name)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 ${isActive ? 'text-blue-500 bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                                        <item.icon className="w-6 h-6 mb-1" />
                                        <span className="text-xs text-center font-medium">{item.label}</span>
                                    </button>
                                );
                            })}
                            <button
                                onClick={onLogout}
                                className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 text-red-500 hover:bg-red-500 hover:text-white">
                                <LogOut className="w-6 h-6 mb-1" />
                                <span className="text-xs font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BottomNavBar;

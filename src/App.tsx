import React, { useState, useEffect } from 'react';
import { supabaseService } from './lib/supabaseService';

import Sidebar from './components/Sidebar';
import BottomNavBar from './components/BottomNavBar';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import CasesPage from './pages/CasesPage';
import ProceduresPage from './pages/ProceduresPage';
import EventsPage from './pages/EventsPage';
import AgendaPage from './pages/AgendaPage';
import ChatPage from './pages/ChatPage';
import BillingPage from './pages/BillingPage';
import AvocatsPage from './pages/AvocatsPage';
import PersonnelsPage from './pages/PersonnelsPage';
import FournisseursPage from './pages/FournisseursPage';
import GestionPage from './pages/GestionPage';
import AllInterfacesPage from './pages/AllInterfacesPage';
import AIAssistantPage from './pages/AIAssistantPage';
import { Client, Case, Event, Task, Invoice, Avocat, Personnel, Fournisseur } from './types';
import { playAlarmSound, stopAllAlarmSounds } from './utils/audio';

// Supabase core configuration
import { supabase } from './supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import EmailComposerModal from './components/modals/EmailComposerModal';

declare const jspdf: any;

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentPage, setCurrentPage] = useState('Dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeAlarmTask, setActiveAlarmTask] = useState<Task | null>(null);
    const stopActiveAlarmRef = React.useRef<(() => void) | null>(null);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    const [clients, setClients] = useState<Client[]>([]);
    const [cases, setCases] = useState<Case[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [avocats, setAvocats] = useState<Avocat[]>([]);
    const [personnels, setPersonnels] = useState<Personnel[]>([]);
    const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);

    const [isDbConnected, setIsDbConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const [toasts, setToasts] = useState<{ id: string, type: 'success' | 'error', text: string }[]>([]);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    const [emailConfig, setEmailConfig] = useState<{
        isOpen: boolean;
        to: string;
        subject: string;
        body: string;
        recipientName?: string;
        attachmentName?: string;
    }>({
        isOpen: false,
        to: '',
        subject: '',
        body: '',
        recipientName: '',
        attachmentName: ''
    });

    const triggerEmail = (to: string, subject: string, body: string, recipientName?: string, attachmentName?: string) => {
        setEmailConfig({
            isOpen: true,
            to,
            subject,
            body,
            recipientName,
            attachmentName
        });
    };

    const triggerToast = (type: 'success' | 'error', text: string) => {
        const id = Math.random().toString();
        setToasts(prev => [...prev, { id, type, text }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    };

    const fetchData = async () => {
        setIsSyncing(true);
        try {
            const data = await supabaseService.fetchAllData();
            setClients(data.clients || []);
            setCases(data.cases || []);
            setEvents(data.events || []);
            setTasks(data.tasks || []);
            setInvoices(data.invoices || []);
            setAvocats(data.avocats || []);
            setPersonnels(data.personnels || []);
            setFournisseurs(data.fournisseurs || []);
            triggerToast('success', 'Données chargées depuis Supabase !');
        } catch (error) {
            triggerToast('error', 'Erreur de chargement des données.');
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsAuthenticated(true);
                setIsDbConnected(true);
                fetchData();
            } else {
                setIsAuthenticated(false);
                setIsDbConnected(false);
            }
        };
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setIsAuthenticated(true);
                setIsDbConnected(true);
                fetchData();
            } else {
                setIsAuthenticated(false);
                setIsDbConnected(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);


    // Task reminder observer and notification checker loops
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }

        const interval = setInterval(() => {
            if (activeAlarmTask) return; // Wait until current alarm is resolved to avoid spamming

            const now = new Date();
            const currentLocalDateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const currentLocalTimeString = now.toTimeString().slice(0, 5);  // HH:MM

            const pendingReminder = tasks.find(t => {
                if (!t.reminderEnabled || t.reminderTriggered || t.status === 'Effectué') {
                    return false;
                }
                
                const scheduledDate = t.reminderDate || '';
                const scheduledTime = t.reminderTime || '';

                if (!scheduledDate || !scheduledTime) return false;

                if (scheduledDate < currentLocalDateString) {
                    return true; // Missed from before
                } else if (scheduledDate === currentLocalDateString) {
                    return scheduledTime <= currentLocalTimeString; // Today, at or after the scheduled time
                }

                return false;
            });

            if (pendingReminder) {
                setActiveAlarmTask(pendingReminder);
                
                const soundType = pendingReminder.reminderSound || 'digital';
                const stopSoundFn = playAlarmSound(soundType, 0.7);
                stopActiveAlarmRef.current = stopSoundFn;

                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    try {
                        const notif = new Notification(`Rappel de Tâche: ${pendingReminder.name}`, {
                            body: `Échéance / Rendez-vous à ${scheduledTime || 'l\'instant'}\nResponsable: ${pendingReminder.lawyer}`,
                            icon: '/favicon.ico',
                            requireInteraction: true
                        });
                        
                        notif.onclick = () => {
                            window.focus();
                            notif.close();
                        };
                    } catch (err) {
                        console.warn("Failed standard notifications call:", err);
                    }
                }
            }
        }, 4000); // Check every 4 seconds

        return () => clearInterval(interval);
    }, [tasks, activeAlarmTask]);

    const handleDismissAlarm = async () => {
        if (!activeAlarmTask) return;
        if (stopActiveAlarmRef.current) {
            stopActiveAlarmRef.current();
        }
        stopAllAlarmSounds();

        const updated = {
            ...activeAlarmTask,
            reminderTriggered: true
        };

        await handleUpdateTask(updated);
        setActiveAlarmTask(null);
        triggerToast('success', "Rappel acquitté avec succès.");
    };

    const handleSnoozeAlarm = async () => {
        if (!activeAlarmTask) return;
        if (stopActiveAlarmRef.current) {
            stopActiveAlarmRef.current();
        }
        stopAllAlarmSounds();

        // Snooze for 5 minutes
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);
        const snoozedDate = now.toISOString().split('T')[0];
        const snoozedTime = now.toTimeString().slice(0, 5);

        const updated = {
            ...activeAlarmTask,
            reminderDate: snoozedDate,
            reminderTime: snoozedTime,
            reminderTriggered: false
        };

        await handleUpdateTask(updated);
        setActiveAlarmTask(null);
        triggerToast('success', `Régler à nouveau pour dans 5 min (${snoozedTime})`);
    };

    const handleUpdateTask = async (updatedTask: Task) => {
        try {
            await supabaseService.updateTask(updatedTask.id, updatedTask);
            await fetchData(); // Refresh data
            triggerToast('success', `Tâche "${updatedTask.name}" mise à jour !`);
        } catch (err) {
            triggerToast('error', "Échec de modification de la tâche.");
        }
    };

    const lawyerNames = avocats.map((a) => a.fullName);

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setCurrentPage('Dashboard');
    };
    
    const handleExportPDF = (title: string, headers: string[], data: any[][]) => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(`${title} - KBB App`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);

        (doc as any).autoTable({
            head: [headers],
            body: data,
            startY: 35,
            theme: 'striped',
            headStyles: { fillColor: [21, 68, 124] },
        });

        const safeTitle = title.toLowerCase().replace(/\s+/g, '-');
        doc.save(`liste-${safeTitle}-kbb-app.pdf`);
    };

    const handleExportClients = () => {
        const headers = ["Nom du Client", "Contact Principal", "Dossiers Actifs"];
        const data = clients.map((c) => [c.name, c.contact, c.cases]);
        handleExportPDF("Clients", headers, data);
    };

    const handleExportCases = () => {
        const headers = ["Référence", "Nom du Dossier", "Client", "Statut"];
        const data = cases.map((c) => [c.id, c.name, c.client, c.status]);
        handleExportPDF("Dossiers", headers, data);
    };

    const handleAddClient = async (newClient: Omit<Client, 'id'>) => {
        try {
            await supabaseService.addClient(newClient);
            await fetchData(); // Refresh data
            triggerToast('success', `Client "${newClient.name}" créé !`);
        } catch (err) {
            triggerToast('error', `Échec de l'enregistrement.`);
        }
    };

    const handleAddCase = async (newCase: Omit<Case, 'id'>) => {
        try {
            await supabaseService.addCase(newCase);
            await fetchData(); // Refresh data
            triggerToast('success', `Dossier "${newCase.name}" enregistré !`);
        } catch (err) {
            triggerToast('error', `Échec de l'écriture du dossier.`);
        }
    };

    const handleAddEvent = async (newEvent: Omit<Event, 'id'>) => {
        try {
            await supabaseService.addEvent(newEvent);
            await fetchData(); // Refresh data
            triggerToast('success', `Événement "${newEvent.name}" planifié !`);
        } catch (err) {
            triggerToast('error', "Échec de l'enregistrement.");
        }
    };

    const handleUpdateEvent = async (updatedEvent: Event) => {
        try {
            await supabaseService.updateEvent(updatedEvent.id, updatedEvent);
            await fetchData(); // Refresh data
            triggerToast('success', `Événement "${updatedEvent.name}" mis à jour !`);
        } catch (err) {
            triggerToast('error', "Échec de la mise à jour.");
        }
    };

    const handleAddTask = async (newTask: Omit<Task, 'id'>) => {
        try {
            await supabaseService.addTask(newTask);
            await fetchData(); // Refresh data
            triggerToast('success', `Tâche "${newTask.name}" programmée.`);
        } catch (err) {
            triggerToast('error', "Impossible d'enregistrer la tâche.");
        }
    };

    const handleUpdateTaskStatus = async (id: number, status: 'Effectué' | 'Non effectué' | 'Effectué à moitié') => {
        try {
            await supabaseService.updateTask(id, { status });
            await fetchData(); // Refresh data
            triggerToast('success', `Statut de la tâche mis à jour !`);
        } catch (err) {
            triggerToast('error', "Échec de modification.");
        }
    };

    const handleAddInvoice = async (newInvoice: Omit<Invoice, 'id'>) => {
        try {
            await supabaseService.addInvoice(newInvoice);
            await fetchData(); // Refresh data
            triggerToast('success', `Facture "${newInvoice.id}" émise !`);
        } catch (err) {
            triggerToast('error', "Échec de l'émission.");
        }
    };

    const handleAddAvocat = async (newAvocat: Omit<Avocat, 'id'>) => {
        try {
            await supabaseService.addAvocat(newAvocat);
            await fetchData(); // Refresh data
            triggerToast('success', `Profil de l'avocat ${newAvocat.fullName} créé !`);
        } catch (err) {
            triggerToast('error', "Erreur d'enregistrement.");
        }
    };

    const handleAddPersonnel = async (newPersonnel: Omit<Personnel, 'id'>) => {
        try {
            await supabaseService.addPersonnel(newPersonnel);
            await fetchData(); // Refresh data
            triggerToast('success', `Agent "${newPersonnel.fullName}" enregistré !`);
        } catch (err) {
            triggerToast('error', "Erreur lors de l'inscription.");
        }
    };

    const handleAddFournisseur = async (newFournisseur: Omit<Fournisseur, 'id'>) => {
        try {
            await supabaseService.addFournisseur(newFournisseur);
            await fetchData(); // Refresh data
            triggerToast('success', `Fournisseur "${newFournisseur.nomComplet}" validé !`);
        } catch (err) {
            triggerToast('error', "Échec de l'enregistrement.");
        }
    };

    const executeDeleteClient = async (id: number) => {
        const client = clients.find(c => c.id === id);
        try {
            await supabaseService.deleteClient(id);
            await fetchData(); // Refresh data
            triggerToast('success', `Client "${client?.name || id}" révoqué !`);
        } catch (err) {
            triggerToast('error', "Échec de la suppression.");
        }
    };

    const handleDeleteClient = (id: number) => {
        const client = clients.find(c => c.id === id);
        const name = client?.name || `ID ${id}`;
        setConfirmModal({
            isOpen: true,
            title: 'Supprimer ce client ?',
            message: `Êtes-vous sûr de vouloir supprimer "${name}" ?`,
            onConfirm: () => executeDeleteClient(id)
        });
    };

    const executeDeleteCase = async (id: string) => {
        const d = cases.find(c => c.id === id);
        try {
            await supabaseService.deleteCase(id);
            await fetchData(); // Refresh data
            triggerToast('success', `Dossier "${d?.name || id}" archivé !`);
        } catch (err) {
            triggerToast('error', "Impossible d'archiver.");
        }
    };

    const handleDeleteCase = (id: string) => {
        const c = cases.find(item => item.id === id);
        const name = c?.name || id;
        setConfirmModal({
            isOpen: true,
            title: 'Archiver ce dossier ?',
            message: `Voulez-vous vraiment archiver le dossier "${name}" ?`,
            onConfirm: () => executeDeleteCase(id)
        });
    };

    const executeDeleteAvocat = async (id: string) => {
        const a = avocats.find(x => x.id === id);
        try {
            await supabaseService.deleteAvocat(id);
            await fetchData(); // Refresh data
            triggerToast('success', `Départ de "${a?.fullName || id}" acté !`);
        } catch (err) {
            triggerToast('error', "Échec de la désinscription.");
        }
    };

    const handleDeleteAvocat = (id: string) => {
        const avocat = avocats.find(item => item.id === id);
        const name = avocat?.fullName || id;
        setConfirmModal({
            isOpen: true,
            title: "Retirer l'avocat ?",
            message: `Supprimer la fiche de "${name}" ?`,
            onConfirm: () => executeDeleteAvocat(id)
        });
    };

    const executeDeletePersonnel = async (id: string) => {
        const p = personnels.find(x => x.id === id);
        try {
            await supabaseService.deletePersonnel(id);
            await fetchData(); // Refresh data
            triggerToast('success', `Agent "${p?.fullName || id}" retiré !`);
        } catch (err) {
            triggerToast('error', "Échec de suppression.");
        }
    };

    const handleDeletePersonnel = (id: string) => {
        const person = personnels.find(item => item.id === id);
        const name = person?.fullName || id;
        setConfirmModal({
            isOpen: true,
            title: "Retirer l'agent ?",
            message: `Retirer l'agent "${name}" ?`,
            onConfirm: () => executeDeletePersonnel(id)
        });
    };

    const executeDeleteFournisseur = async (id: string) => {
        const f = fournisseurs.find(x => x.id === id);
        try {
            await supabaseService.deleteFournisseur(id);
            await fetchData(); // Refresh data
            triggerToast('success', `Fournisseur "${f?.nomComplet || id}" retiré.`);
        } catch (err) {
            triggerToast('error', "Échec de retrait.");
        }
    };

    const handleDeleteFournisseur = (id: string) => {
        const f = fournisseurs.find(item => item.id === id);
        const name = f?.nomComplet || id;
        setConfirmModal({
            isOpen: true,
            title: "Supprimer le fournisseur ?",
            message: `Supprimer le fournisseur "${name}" ?`,
            onConfirm: () => executeDeleteFournisseur(id)
        });
    };

    const executeDeleteEvent = async (id: string) => {
        const ev = events.find(e => e.id === id);
        try {
            await supabaseService.deleteEvent(id);
            await fetchData(); // Refresh data
            triggerToast('success', `Événement "${ev?.name || id}" déprogrammé.`);
        } catch (err) {
            triggerToast('error', "Échec d'annulation.");
        }
    };

    const handleDeleteEvent = (id: string) => {
        const ev = events.find(item => item.id === id);
        const name = ev?.name || id;
        setConfirmModal({
            isOpen: true,
            title: "Déprogrammer l'événement ?",
            message: `Déprogrammer "${name}" ?`,
            onConfirm: () => executeDeleteEvent(id)
        });
    };

    const executeDeleteTask = async (id: number) => {
        const t = tasks.find(x => x.id === id);
        try {
            await supabaseService.deleteTask(id);
            await fetchData(); // Refresh data
            triggerToast('success', `Tâche "${t?.name || id}" supprimée.`);
        } catch (err) {
            triggerToast('error', "Échec d'annulation.");
        }
    };

    const handleDeleteTask = (id: number) => {
        const t = tasks.find(item => item.id === id);
        const name = t?.name || `ID ${id}`;
        setConfirmModal({
            isOpen: true,
            title: "Supprimer la tâche ?",
            message: `Supprimer la tâche "${name}" ?`,
            onConfirm: () => executeDeleteTask(id)
        });
    };

    const executeDeleteInvoice = async (id: string) => {
        try {
            await supabaseService.deleteInvoice(id);
            await fetchData(); // Refresh data
            triggerToast('success', `Facture "${id}" éliminée !`);
        } catch (err) {
            triggerToast('error', "Échec d'annulation.");
        }
    };

    const handleDeleteInvoice = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Supprimer la facture ?",
            message: `Supprimer la facture "${id}" ?`,
            onConfirm: () => executeDeleteInvoice(id)
        });
    };

    const handleUpdateClient = async (updated: Client) => {
        try {
            await supabaseService.updateClient(updated.id, updated);
            await fetchData(); // Refresh data
            triggerToast('success', `Client "${updated.name}" sauvegardé !`);
        } catch (err) {
            triggerToast('error', "Échec de mise à jour.");
        }
    };

    const handleUpdateCase = async (updated: Case) => {
        try {
            await supabaseService.updateCase(updated.id, updated);
            await fetchData(); // Refresh data
            triggerToast('success', `Dossier "${updated.name}" validé !`);
        } catch (err) {
            triggerToast('error', "Erreur de mise à jour.");
        }
    };

    const handleUpdateAvocat = async (updated: Avocat) => {
        try {
            await supabaseService.updateAvocat(updated.id, updated);
            await fetchData(); // Refresh data
            triggerToast('success', `Profil "${updated.fullName}" ajusté !`);
        } catch (err) {
            triggerToast('error', "Échec de restructuration.");
        }
    };

    const handleUpdatePersonnel = async (updated: Personnel) => {
        try {
            await supabaseService.updatePersonnel(updated.id, updated);
            await fetchData(); // Refresh data
            triggerToast('success', `Agent "${updated.fullName}" enregistré !`);
        } catch (err) {
            triggerToast('error', "Impossible d'appliquer.");
        }
    };

    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.contact.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCases = cases.filter(c => 
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.client.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredEvents = events.filter(e => 
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.type.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.lieu.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderPage = () => {
        const pageProps = {
            clients: filteredClients, 
            cases: filteredCases, 
            events: filteredEvents, 
            tasks, invoices, avocats, lawyerNames, personnels, fournisseurs,
            onAddClient: handleAddClient, onAddCase: handleAddCase, onAddEvent: handleAddEvent,
            onAddTask: handleAddTask, onAddInvoice: handleAddInvoice, onAddAvocat: handleAddAvocat, onAddPersonnel: handleAddPersonnel, onAddFournisseur: handleAddFournisseur,
            onDeleteClient: handleDeleteClient, onDeleteCase: handleDeleteCase, onDeleteAvocat: handleDeleteAvocat, onDeletePersonnel: handleDeletePersonnel, onDeleteFournisseur: handleDeleteFournisseur,
            onDeleteEvent: handleDeleteEvent, onDeleteTask: handleDeleteTask, onDeleteInvoice: handleDeleteInvoice,
            onExportClients: handleExportClients, onExportCases: handleExportCases,
            onUpdateClient: handleUpdateClient, onUpdateCase: handleUpdateCase, onUpdateAvocat: handleUpdateAvocat, onUpdatePersonnel: handleUpdatePersonnel,
            onSendEmail: triggerEmail,
        };

        switch (currentPage) {
            case 'Dashboard': return <DashboardPage clients={filteredClients} cases={filteredCases} events={filteredEvents} tasks={tasks} invoices={invoices} avocats={avocats} onUpdateTaskStatus={handleUpdateTaskStatus} onAddTask={handleAddTask} />;
            case 'AIAssistant': return <AIAssistantPage clients={filteredClients} cases={filteredCases} tasks={tasks} invoices={invoices} />;
            case 'Clients': return <ClientsPage clients={filteredClients} cases={cases} onAddClient={handleAddClient} onExport={handleExportClients} onSendEmail={triggerEmail} />;
            case 'Dossiers': return <CasesPage cases={filteredCases} clients={filteredClients} tasks={tasks} invoices={invoices} onAddCase={handleAddCase} onExport={handleExportCases} avocats={avocats} onSendEmail={triggerEmail} />;
            case 'Procedures': return <ProceduresPage cases={cases} onUpdateCase={handleUpdateCase} onSendEmail={triggerEmail} />;
            case 'Evenements': return <EventsPage events={filteredEvents} onAddEvent={handleAddEvent} onUpdateEvent={handleUpdateEvent} avocats={avocats} onSendEmail={triggerEmail} />;
            case 'Agenda': return <AgendaPage tasks={tasks} cases={filteredCases} lawyers={lawyerNames} avocats={avocats} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} events={filteredEvents} onSendEmail={triggerEmail} />;
            case 'Chat': return <ChatPage />;
            case 'Facturation': return <BillingPage invoices={invoices} cases={filteredCases} onAddInvoice={handleAddInvoice} onSendEmail={triggerEmail} clients={clients} />;
            case 'Avocats': return <AvocatsPage avocats={avocats} tasks={tasks} onAddAvocat={handleAddAvocat} onSendEmail={triggerEmail} />;
            case 'Personnels': return <PersonnelsPage personnels={personnels} onAddPersonnel={handleAddPersonnel} onDeletePersonnel={handleDeletePersonnel} onSendEmail={triggerEmail} />;
            case 'Fournisseurs': return <FournisseursPage fournisseurs={fournisseurs} onAddFournisseur={handleAddFournisseur} onDeleteFournisseur={handleDeleteFournisseur} onSendEmail={triggerEmail} />;
            case 'Gestion': return <GestionPage {...pageProps} onSendEmail={triggerEmail} />;
            case 'All': return <AllInterfacesPage {...pageProps} />;
            default: return <DashboardPage clients={filteredClients} cases={filteredCases} events={filteredEvents} tasks={tasks} invoices={invoices} avocats={avocats} onUpdateTaskStatus={handleUpdateTaskStatus} onAddTask={handleAddTask} />;
        }
    };

    if (!isAuthenticated) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-[#070b13] font-sans overflow-hidden transition-colors duration-300">
            <div style={{ position: 'absolute', top: 0, left: 0, padding: '1rem', background: 'rgba(0,0,0,0.8)', color: 'white', zIndex: 9999 }}>
                <h3>DEBUG PANEL</h3>
                <p><strong>URL:</strong> {import.meta.env.VITE_SUPABASE_URL || "NOT FOUND"}</p>
                <p><strong>ANON KEY:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY || "NOT FOUND"}</p>
            </div>
            <Sidebar 
                currentPage={currentPage} 
                setCurrentPage={setCurrentPage} 
                onLogout={handleLogout} 
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
            />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header 
                    searchQuery={searchQuery} 
                    setSearchQuery={setSearchQuery} 
                    clients={clients} 
                    cases={cases} 
                    events={events} 
                    setCurrentPage={setCurrentPage} 
                    isDarkMode={isDarkMode}
                    setIsDarkMode={setIsDarkMode}
                    toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 custom-scrollbar relative">
                    {renderPage()}
                </main>
            </div>

                <BottomNavBar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />

            <div className="fixed bottom-5 right-5 space-y-3 z-50 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => {
                        const isSync = toast.text.includes("Synchronisation");
                        const isDeleted = toast.text.includes("supprim") || toast.text.includes("retir");
                        const isUpdate = toast.text.includes("mis à jour") || toast.text.includes("valid");

                        let title = "Succès !";
                        if (toast.type === 'error') {
                            title = "Échec";
                        } else if (isSync) {
                            title = "Synchro DB";
                        } else if (isDeleted) {
                            title = "Suppression";
                        } else if (isUpdate) {
                            title = "Mise à jour";
                        }

                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.25 } }}
                                className={`p-4 rounded-2xl shadow-2xl pointer-events-auto flex items-start space-x-3 text-white max-w-sm border backdrop-blur-md ${
                                    toast.type === 'success' 
                                        ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-550' 
                                        : 'bg-slate-900/95 border-rose-500/50 text-rose-550'
                                }`}
                            >
                                <span className={`flex-shrink-0 text-lg flex items-center justify-center p-2 rounded-xl ${
                                    toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                }`}>
                                    {toast.type === 'success' ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                        </svg>
                                    )}
                                </span>
                                <div className="space-y-0.5">
                                    <h4 className={`text-xs font-black tracking-wide ${
                                        toast.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                                    }`}>
                                        {title}
                                    </h4>
                                    <p className="text-[11px] font-medium text-slate-300 leading-normal">
                                        {toast.text}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {confirmModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
                        />
                        
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.4 }}
                            className="bg-white rounded-3xl border border-rose-100 shadow-2xl relative w-full max-w-md overflow-hidden z-10 p-6 flex flex-col pointer-events-auto"
                        >
                            <div className="flex items-start space-x-4 mb-4">
                                <span className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                    </svg>
                                </span>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-black text-slate-950 tracking-tight">
                                        {confirmModal.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-semibold mt-1.5 leading-relaxed">
                                        {confirmModal.message}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-2 mt-4 bg-slate-50 -mx-6 -mb-6 p-4 border-t border-slate-150">
                                <button
                                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                    className="px-4 py-2.5 text-xs font-black text-slate-600 rounded-xl bg-white hover:bg-slate-100 transition border border-slate-200 active:scale-95 cursor-pointer"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={() => {
                                        confirmModal.onConfirm();
                                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                    }}
                                    className="px-5 py-2.5 text-xs font-black text-white rounded-xl bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/15 active:scale-95 transition cursor-pointer"
                                >
                                    Confirmer
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {activeAlarmTask && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full border border-red-100 overflow-hidden text-center relative"
                        >
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />
                            
                            <div className="my-6 relative flex justify-center">
                                <span className="absolute inline-flex h-20 w-20 rounded-full bg-red-100 opacity-75 animate-ping" />
                                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30">
                                    <svg className="w-10 h-10 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0M3.124 7.5A8.967 8.967 0 015.292 3m13.416 4.5a8.967 8.967 0 00-2.168-4.5" />
                                    </svg>
                                </div>
                            </div>

                            <span className="inline-block px-3 py-1 bg-red-50 text-red-700 font-extrabold text-[10px] tracking-widest uppercase rounded-full border border-red-100">
                                Rappel Actif
                            </span>

                            <h3 className="text-xl font-bold text-gray-900 mt-4 leading-tight">
                                {activeAlarmTask.name}
                            </h3>

                            <p className="text-xs text-slate-500 mt-2 font-semibold flex items-center justify-center gap-1">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                Responsable: <span className="text-gray-800 font-bold">{activeAlarmTask.lawyer}</span>
                            </p>

                            {activeAlarmTask.notes && (
                                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-gray-150 text-left w-full">
                                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Notes :</span>
                                    <p className="text-xs text-gray-650 italic leading-relaxed">
                                        {activeAlarmTask.notes}
                                    </p>
                                </div>
                            )}

                            <div className="mt-8 grid grid-cols-2 gap-3 pb-2">
                                <button
                                    onClick={handleSnoozeAlarm}
                                    className="bg-slate-100 hover:bg-slate-200 text-gray-800 font-extrabold text-xs py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm border border-slate-200 active:scale-95 cursor-pointer"
                                    id="btn-alarm-snooze"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Répéter (+5 min)
                                </button>
                                <button
                                    onClick={handleDismissAlarm}
                                    className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-red-600/15 transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                                    id="btn-alarm-dismiss"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    Éteindre
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            
            <EmailComposerModal 
                isOpen={emailConfig.isOpen}
                onClose={() => setEmailConfig(prev => ({ ...prev, isOpen: false }))}
                defaultTo={emailConfig.to}
                defaultSubject={emailConfig.subject}
                defaultBody={emailConfig.body}
                recipientName={emailConfig.recipientName}
                attachmentName={emailConfig.attachmentName}
            />
        </div>
    );
}

export default App;

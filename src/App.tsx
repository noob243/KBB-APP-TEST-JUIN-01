import React, { useState, useEffect } from 'react';
import { usePersistentState } from './hooks/usePersistentState';
import { initialClients, initialCases, initialEvents, initialTasks, initialInvoices, initialAvocats, initialPersonnels, initialFournisseurs } from './data/mockData';

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
import { 
    dbCreateDoc, 
    dbUpdateDoc, 
    dbDeleteDoc, 
    syncLocalCollection,
    onSnapshotPostgres
} from './lib/postgresService';
import { motion, AnimatePresence } from 'motion/react';
import EmailComposerModal from './components/modals/EmailComposerModal';

declare const jspdf: any;

function App() {
    const [isAuthenticated, setIsAuthenticated] = usePersistentState('kbb_auth', false);
    const [currentPage, setCurrentPage] = useState('Dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeAlarmTask, setActiveAlarmTask] = useState<Task | null>(null);
    const stopActiveAlarmRef = React.useRef<(() => void) | null>(null);
    
    // Core collection states backed by localStorage for offline fast fallback, and updated by real-time Firestore synchronization
    const [clients, setClients] = usePersistentState<Client[]>('kbb_clients', initialClients);
    const [cases, setCases] = usePersistentState<Case[]>('kbb_cases', initialCases);
    const [events, setEvents] = usePersistentState<Event[]>('kbb_events', initialEvents);
    const [tasks, setTasks] = usePersistentState<Task[]>('kbb_tasks', initialTasks);
    const [invoices, setInvoices] = usePersistentState<Invoice[]>('kbb_invoices', initialInvoices);
    const [avocats, setAvocats] = usePersistentState<Avocat[]>('kbb_avocats', initialAvocats);
    const [personnels, setPersonnels] = usePersistentState<Personnel[]>('kbb_personnels', initialPersonnels);
    const [fournisseurs, setFournisseurs] = usePersistentState<Fournisseur[]>('kbb_fournisseurs', initialFournisseurs);

    const [isDbConnected, setIsDbConnected] = useState(false);
    const [isSyncComplete, setIsSyncComplete] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isDarkMode, setIsDarkMode] = usePersistentState('kbb_darkMode', false);

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

    // 1. Establish Supabase Authentication Session state
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsAuthenticated(true);
                setIsDbConnected(true);
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
            } else {
                setIsAuthenticated(false);
                setIsDbConnected(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // 2. Synchronize local storage data (including offline inserts) to Cloud PostgreSQL on connection
    useEffect(() => {
        if (!isDbConnected) return;
        const performDataSync = async () => {
            setIsSyncing(true);
            try {
                console.log("Synchronizing all local states with PostgreSQL...");
                
                await syncLocalCollection('clients', clients);
                await syncLocalCollection('cases', cases);
                await syncLocalCollection('events', events);
                await syncLocalCollection('tasks', tasks);
                await syncLocalCollection('invoices', invoices);
                await syncLocalCollection('avocats', avocats);
                await syncLocalCollection('personnels', personnels);
                await syncLocalCollection('fournisseurs', fournisseurs);
                
                triggerToast('success', 'Synchronisation avec PostgreSQL réussie !');
                setIsSyncComplete(true);
            } catch (err) {
                console.error("Local records database synchronization failed on startup:", err);
                triggerToast('error', 'Échec lors de la synchronisation de certains enregistrements.');
                setIsSyncComplete(true); // Allow user session to continue anyway
            } finally {
                setIsSyncing(false);
            }
        };
        performDataSync();
    }, [isDbConnected]);

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

        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        try {
            const { id, ...cleanTask } = updated;
            await dbUpdateDoc('tasks', id, cleanTask);
        } catch (err) {
            console.error("Failed to dismiss alarm in DB:", err);
        }
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

        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        try {
            const { id, ...cleanTask } = updated;
            await dbUpdateDoc('tasks', id, cleanTask);
        } catch (err) {
            console.error("Failed to snooze alarm in DB:", err);
        }
        setActiveAlarmTask(null);
        triggerToast('success', `Régler à nouveau pour dans 5 min (${snoozedTime})`);
    };

    const handleUpdateTask = async (updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        try {
            const { id, ...cleanTask } = updatedTask;
            await dbUpdateDoc('tasks', id, cleanTask);
            triggerToast('success', `Tâche "${updatedTask.name}" mise à jour !`);
        } catch (err) {
            triggerToast('error', "Échec de modification de la tâche.");
        }
    };

    // 3. Realtime listening sync from Cloud DB (PostgreSQL)
    useEffect(() => {
        if (!isDbConnected || !isSyncComplete) return;

        try {
            const unsubClients = onSnapshotPostgres('clients', (list) => {
                setClients(list);
            }, (err) => console.error("Clients sync error:", err));

            const unsubCases = onSnapshotPostgres('cases', (list) => {
                setCases(list);
            }, (err) => console.error("Cases sync error:", err));

            const unsubEvents = onSnapshotPostgres('events', (list) => {
                setEvents(list);
            }, (err) => console.error("Events sync error:", err));

            const unsubTasks = onSnapshotPostgres('tasks', (list) => {
                setTasks(list);
            }, (err) => console.error("Tasks sync error:", err));

            const unsubInvoices = onSnapshotPostgres('invoices', (list) => {
                setInvoices(list);
            }, (err) => console.error("Invoices sync error:", err));

            const unsubAvocats = onSnapshotPostgres('avocats', (list) => {
                setAvocats(list);
            }, (err) => console.error("Avocats sync error:", err));

            const unsubPersonnels = onSnapshotPostgres('personnels', (list) => {
                setPersonnels(list);
            }, (err) => console.error("Personnels sync error:", err));

            const unsubFournisseurs = onSnapshotPostgres('fournisseurs', (list) => {
                setFournisseurs(list);
            }, (err) => console.error("Fournisseurs sync error:", err));

            return () => {
                unsubClients();
                unsubCases();
                unsubEvents();
                unsubTasks();
                unsubInvoices();
                unsubAvocats();
                unsubPersonnels();
                unsubFournisseurs();
            };
        } catch (syncError) {
            console.error("PostgreSQL synchronizers preparation failed:", syncError);
        }
    }, [isDbConnected, isSyncComplete]);

    const lawyerNames = avocats.map((a) => a.fullName);

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setCurrentPage('Dashboard');
    };
    
    // --- PDF Export Logic ---
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

    // --- Secured Firestore + Live Toast CRUD Handlers ---
    const handleAddClient = async (newClient: Omit<Client, 'id'> & { id?: string | number }) => {
        const nextId = newClient.id || (clients.length > 0 ? Math.max(...clients.map(c => typeof c.id === 'number' ? c.id : 0)) : 0) + 1;
        const { id, ...cleanClient } = newClient;
        const record = { ...cleanClient, id: nextId };
        setClients(prev => [...prev, record]);
        try {
            await dbCreateDoc('clients', nextId, cleanClient);
            triggerToast('success', `Client "${newClient.name}" créé avec succès !`);
        } catch (err) {
            triggerToast('error', `Échec de l'enregistrement du client "${newClient.name}".`);
        }
    };

    const handleAddCase = async (newCase: Case, tasksToAdd?: Omit<Task, 'id'>[]) => {
        setCases(prev => [...prev, newCase]);
        try {
            const { id, ...cleanCase } = newCase;
            await dbCreateDoc('cases', id, cleanCase);
            
            if (tasksToAdd && tasksToAdd.length > 0) {
                let currentMaxId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) : 0;
                for (const t of tasksToAdd) {
                    currentMaxId++;
                    const taskProps = { ...t, id: currentMaxId };
                    setTasks(prev => [...prev, taskProps]);
                    const { id: _, ...cleanTask } = taskProps;
                    await dbCreateDoc('tasks', currentMaxId, cleanTask);
                }
            }
            triggerToast('success', `Dossier "${newCase.name}" et tâches complémentaires enregistrés !`);
        } catch (err) {
            triggerToast('error', `Échec de l'écriture du dossier "${newCase.name}".`);
        }
    };

    const handleAddEvent = async (newEvent: Event) => {
        setEvents(prev => [...prev, newEvent]);
        try {
            const { id, ...cleanEvent } = newEvent;
            await dbCreateDoc('events', id, cleanEvent);
            triggerToast('success', `Événement "${newEvent.name}" planifié avec succès !`);
        } catch (err) {
            triggerToast('error', "Échec de l'enregistrement de l'événement.");
        }
    };

    const handleUpdateEvent = async (updatedEvent: Event) => {
        setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
        try {
            const { id, ...cleanEvent } = updatedEvent;
            await dbUpdateDoc('events', id, cleanEvent);
            triggerToast('success', `Événement "${updatedEvent.name}" mis à jour !`);
        } catch (err) {
            triggerToast('error', "Échec de la mise à jour de l'événement.");
        }
    };

    const handleAddTask = async (newTask: Omit<Task, 'id'>) => {
        const nextId = (tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) : 0) + 1;
        const record = { ...newTask, id: nextId };
        setTasks(prev => [...prev, record]);
        try {
            await dbCreateDoc('tasks', nextId, newTask);
            triggerToast('success', `Tâche "${newTask.name}" programmée avec succès.`);
        } catch (err) {
            triggerToast('error', "Impossible d'enregistrer la tâche.");
        }
    };

    const handleUpdateTaskStatus = async (id: number, status: 'Effectué' | 'Non effectué' | 'Effectué à moitié') => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
        try {
            await dbUpdateDoc('tasks', id, { status });
            triggerToast('success', `Statut de la tâche mis à jour !`);
        } catch (err) {
            triggerToast('error', "Échec de modification de la tâche.");
        }
    };

    const handleAddInvoice = async (newInvoice: Invoice) => {
        setInvoices(prev => [...prev, newInvoice]);
        try {
            const { id, ...cleanInvoice } = newInvoice;
            await dbCreateDoc('invoices', id, cleanInvoice);
            triggerToast('success', `Facture "${newInvoice.id}" émise avec succès !`);
        } catch (err) {
            triggerToast('error', "Échec de l'émission de la facture.");
        }
    };

    const handleAddAvocat = async (newAvocat: Avocat) => {
        setAvocats(prev => [...prev, newAvocat]);
        try {
            const { id, ...cleanAvocat } = newAvocat;
            const payload = { ...cleanAvocat, photo: null };
            await dbCreateDoc('avocats', id, payload);
            triggerToast('success', `Profil de l'avocat ${newAvocat.fullName} créé !`);
        } catch (err) {
            triggerToast('error', "Erreur d'enregistrement de l'avocat.");
        }
    };

    const handleAddPersonnel = async (newPersonnel: Personnel) => {
        setPersonnels(prev => [...prev, newPersonnel]);
        try {
            const { id, ...cleanPersonnel } = newPersonnel;
            await dbCreateDoc('personnels', id, cleanPersonnel);
            triggerToast('success', `Agent administratif "${newPersonnel.fullName}" enregistré !`);
        } catch (err) {
            triggerToast('error', "Erreur lors de l'inscription du membre du personnel.");
        }
    };

    const handleAddFournisseur = async (newFournisseur: Fournisseur) => {
        setFournisseurs(prev => [...prev, newFournisseur]);
        try {
            const { id, ...cleanFournisseur } = newFournisseur;
            await dbCreateDoc('fournisseurs', id, cleanFournisseur);
            triggerToast('success', `Fournisseur "${newFournisseur.nomComplet}" validé !`);
        } catch (err) {
            triggerToast('error', "Échec de l'enregistrement du fournisseur.");
        }
    };

    const executeDeleteClient = async (id: number) => {
        const client = clients.find(c => c.id === id);
        setClients(clients.filter(c => c.id !== id));
        try {
            await dbDeleteDoc('clients', id);
            triggerToast('success', `Client "${client?.name || id}" révoqué !`);
        } catch (err) {
            triggerToast('error', "Échec de la suppression du client.");
        }
    };

    const handleDeleteClient = (id: number) => {
        const client = clients.find(c => c.id === id);
        const name = client?.name || `ID ${id}`;
        setConfirmModal({
            isOpen: true,
            title: 'Supprimer ce client ?',
            message: `Êtes-vous sûr de vouloir supprimer définitivement le client "${name}" ? Cette action supprimera tous ses enregistrements et est irréversible.`,
            onConfirm: () => executeDeleteClient(id)
        });
    };

    const executeDeleteCase = async (id: string) => {
        const d = cases.find(c => c.id === id);
        setCases(cases.filter(c => c.id !== id));
        try {
            await dbDeleteDoc('cases', id);
            triggerToast('success', `Dossier "${d?.name || id}" archivé !`);
        } catch (err) {
            triggerToast('error', "Impossible d'archiver le dossier.");
        }
    };

    const handleDeleteCase = (id: string) => {
        const c = cases.find(item => item.id === id);
        const name = c?.name || id;
        setConfirmModal({
            isOpen: true,
            title: 'Archiver ce dossier ?',
            message: `Voulez-vous vraiment ranger ou archiver définitivement le dossier "${name}" ?`,
            onConfirm: () => executeDeleteCase(id)
        });
    };

    const executeDeleteAvocat = async (id: string) => {
        const a = avocats.find(x => x.id === id);
        setAvocats(avocats.filter(a => a.id !== id));
        try {
            await dbDeleteDoc('avocats', id);
            triggerToast('success', `Départ de l'avocat "${a?.fullName || id}" acté !`);
        } catch (err) {
            triggerToast('error', "Échec de la désinscription de l'avocat.");
        }
    };

    const handleDeleteAvocat = (id: string) => {
        const avocat = avocats.find(item => item.id === id);
        const name = avocat?.fullName || id;
        setConfirmModal({
            isOpen: true,
            title: "Retirer l'avocat du cabinet ?",
            message: `Êtes-vous sûr de vouloir révoquer l'accès et supprimer la fiche de l'avocat "${name}" ?`,
            onConfirm: () => executeDeleteAvocat(id)
        });
    };

    const executeDeletePersonnel = async (id: string) => {
        const p = personnels.find(x => x.id === id);
        setPersonnels(personnels.filter(p => p.id !== id));
        try {
            await dbDeleteDoc('personnels', id);
            triggerToast('success', `Agent administratif "${p?.fullName || id}" retiré !`);
        } catch (err) {
            triggerToast('error', "Échec de suppression de l'agent.");
        }
    };

    const handleDeletePersonnel = (id: string) => {
        const person = personnels.find(item => item.id === id);
        const name = person?.fullName || id;
        setConfirmModal({
            isOpen: true,
            title: "Retirer l'agent administratif ?",
            message: `Voulez-vous vraiment retirer l'agent administratif "${name}" du registre ?`,
            onConfirm: () => executeDeletePersonnel(id)
        });
    };

    const executeDeleteFournisseur = async (id: string) => {
        const f = fournisseurs.find(x => x.id === id);
        setFournisseurs(fournisseurs.filter(f => f.id !== id));
        try {
            await dbDeleteDoc('fournisseurs', id);
            triggerToast('success', `Fournisseur "${f?.nomComplet || id}" retiré avec succès.`);
        } catch (err) {
            triggerToast('error', "Échec de retrait du fournisseur.");
        }
    };

    const handleDeleteFournisseur = (id: string) => {
        const f = fournisseurs.find(item => item.id === id);
        const name = f?.nomComplet || id;
        setConfirmModal({
            isOpen: true,
            title: "Supprimer le fournisseur ?",
            message: `Voulez-vous rompre la fiche et supprimer le fournisseur "${name}" ?`,
            onConfirm: () => executeDeleteFournisseur(id)
        });
    };

    const executeDeleteEvent = async (id: string) => {
        const ev = events.find(e => e.id === id);
        setEvents(events.filter(e => e.id !== id));
        try {
            await dbDeleteDoc('events', id);
            triggerToast('success', `Événement "${ev?.name || id}" déprogrammé.`);
        } catch (err) {
            triggerToast('error', "Échec d'annulation de l'événement.");
        }
    };

    const handleDeleteEvent = (id: string) => {
        const ev = events.find(item => item.id === id);
        const name = ev?.name || id;
        setConfirmModal({
            isOpen: true,
            title: "Déprogrammer l'événement ?",
            message: `Souhaitez-vous vraiment déprogrammer l'événement "${name}" ?`,
            onConfirm: () => executeDeleteEvent(id)
        });
    };

    const executeDeleteTask = async (id: number) => {
        const t = tasks.find(x => x.id === id);
        setTasks(tasks.filter(t => t.id !== id));
        try {
            await dbDeleteDoc('tasks', id);
            triggerToast('success', `Tâche "${t?.name || id}" supprimée.`);
        } catch (err) {
            triggerToast('error', "Échec d'annulation de la tâche.");
        }
    };

    const handleDeleteTask = (id: number) => {
        const t = tasks.find(item => item.id === id);
        const name = t?.name || `ID ${id}`;
        setConfirmModal({
            isOpen: true,
            title: "Supprimer la tâche ?",
            message: `Voulez-vous supprimer définitivement la tâche "${name}" ?`,
            onConfirm: () => executeDeleteTask(id)
        });
    };

    const executeDeleteInvoice = async (id: string) => {
        setInvoices(invoices.filter(i => i.id !== id));
        try {
            await dbDeleteDoc('invoices', id);
            triggerToast('success', `Facture "${id}" éliminée !`);
        } catch (err) {
            triggerToast('error', "Échec d'annulation de la facture.");
        }
    };

    const handleDeleteInvoice = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Supprimer la facture ?",
            message: `Voulez-vous vraiment supprimer définitivement la facture "${id}" ? Cette action est irréversible.`,
            onConfirm: () => executeDeleteInvoice(id)
        });
    };

    const handleUpdateClient = async (updated: Client) => {
        setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
        try {
            const { id, ...properties } = updated;
            await dbUpdateDoc('clients', id, properties);
            triggerToast('success', `Données du client "${updated.name}" sauvegardées !`);
        } catch (err) {
            triggerToast('error', "Échec lors de la mise à jour.");
        }
    };

    const handleUpdateCase = async (updated: Case) => {
        setCases(prev => prev.map(c => c.id === updated.id ? updated : c));
        try {
            const { id, ...properties } = updated;
            const clean = { ...properties, procedures: null };
            await dbUpdateDoc('cases', id, clean);
            triggerToast('success', `Modifications du dossier "${updated.name}" validées !`);
        } catch (err) {
            triggerToast('error', "Erreur lors de la mise à jour.");
        }
    };

    const handleUpdateAvocat = async (updated: Avocat) => {
        setAvocats(prev => prev.map(a => a.id === updated.id ? updated : a));
        try {
            const { id, ...properties } = updated;
            const clean = { ...properties, photo: null };
            await dbUpdateDoc('avocats', id, clean);
            triggerToast('success', `Profil de l'avocat "${updated.fullName}" ajusté !`);
        } catch (err) {
            triggerToast('error', "Échec de restructuration de la fiche.");
        }
    };

    const handleUpdatePersonnel = async (updated: Personnel) => {
        setPersonnels(prev => prev.map(p => p.id === updated.id ? updated : p));
        try {
            const { id, ...properties } = updated;
            await dbUpdateDoc('personnels', id, properties);
            triggerToast('success', `Modification de l'agent "${updated.fullName}" enregistrée !`);
        } catch (err) {
            triggerToast('error', "Impossible d'appliquer la correction.");
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
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />
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
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 custom-scrollbar relative">
                    {renderPage()}
                </main>
            </div>

                <BottomNavBar currentPage={currentPage} setCurrentPage={setCurrentPage} onLogout={handleLogout} />

                {/* Micro-Interaction Toast Notifications Overlay */}
            <div className="fixed bottom-5 right-5 space-y-3 z-50 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => {
                        const isSync = toast.text.includes("Synchronisation");
                        const isDeleted = toast.text.includes("supprim") || toast.text.includes("retir") || toast.text.includes("révoqu") || toast.text.includes("élimin") || toast.text.includes("déprogramm");
                        const isUpdate = toast.text.includes("mis à jour") || toast.text.includes("sauvegard") || toast.text.includes("valid") || toast.text.includes("ajust") || toast.text.includes("modific");

                        let title = "Enregistrement réussi !";
                        if (toast.type === 'error') {
                            title = "Échec de l'opération";
                        } else if (isSync) {
                            title = "Synchronisation Firestore";
                        } else if (isDeleted) {
                            title = "Suppression réussie";
                        } else if (isUpdate) {
                            title = "Mise à jour réussie";
                        }

                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.25 } }}
                                className={`p-4 rounded-2xl shadow-2xl pointer-events-auto flex items-start space-x-3 text-white max-w-sm border backdrop-blur-md ${
                                    toast.type === 'success' 
                                        ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-550 shadow-emerald-950/30' 
                                        : 'bg-slate-900/95 border-rose-500/50 text-rose-550 shadow-rose-950/30'
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

            {/* Modal de Confirmation de Suppression */}
            <AnimatePresence>
                {confirmModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
                        />
                        
                        {/* Modal Contenu */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.4 }}
                            className="bg-white rounded-3xl border border-rose-100 shadow-2xl relative w-full max-w-md overflow-hidden z-10 p-6 flex flex-col pointer-events-auto"
                        >
                            {/* Alert Icon & Heading */}
                            <div className="flex items-start space-x-4 mb-4">
                                <span className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-sm animate-pulse">
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

                            {/* Actions Group */}
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
                                    Confirmer la suppression
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Alarm Reminder Ringing Dialog Interface */}
            <AnimatePresence>
                {activeAlarmTask && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full border border-red-100 overflow-hidden text-center relative"
                        >
                            {/* Animated ring glowing stripe */}
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
                                Rappel de Tâche Actif
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
                                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">Notes de tâche :</span>
                                    <p className="text-xs text-gray-650 italic leading-relaxed">
                                        {activeAlarmTask.notes}
                                    </p>
                                </div>
                            )}

                            {/* Alarm Actions */}
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

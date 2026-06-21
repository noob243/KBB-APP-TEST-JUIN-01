import { supabase } from '../supabaseClient';

// Generic fetch function
const fetchTable = async (tableName: string) => {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        throw error;
    }
    return data;
};

// Generic add function
const addRecord = async (tableName: string, record: any) => {
    const { data, error } = await supabase.from(tableName).insert([record]).select();
    if (error) {
        console.error(`Error adding to ${tableName}:`, error);
        throw error;
    }
    return data[0];
};

// Generic update function
const updateRecord = async (tableName: string, id: string | number, updates: any) => {
    const { data, error } = await supabase.from(tableName).update(updates).eq('id', id).select();
    if (error) {
        console.error(`Error updating ${tableName}:`, error);
        throw error;
    }
    return data[0];
};

// Generic delete function
const deleteRecord = async (tableName: string, id: string | number) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) {
        console.error(`Error deleting from ${tableName}:`, error);
        throw error;
    }
};

export const supabaseService = {
    // Fetch all data
    fetchAllData: async () => {
        const [clients, cases, events, tasks, invoices, avocats, personnels, fournisseurs] = await Promise.all([
            fetchTable('clients'),
            fetchTable('cases'),
            fetchTable('events'),
            fetchTable('tasks'),
            fetchTable('invoices'),
            fetchTable('avocats'),
            fetchTable('personnels'),
            fetchTable('fournisseurs')
        ]);
        return { clients, cases, events, tasks, invoices, avocats, personnels, fournisseurs };
    },

    // Client functions
    addClient: (client: any) => addRecord('clients', client),
    updateClient: (id: number, updates: any) => updateRecord('clients', id, updates),
    deleteClient: (id: number) => deleteRecord('clients', id),

    // Case functions
    addCase: (caseItem: any) => addRecord('cases', caseItem),
    updateCase: (id: string, updates: any) => updateRecord('cases', id, updates),
    deleteCase: (id: string) => deleteRecord('cases', id),

    // Event functions
    addEvent: (event: any) => addRecord('events', event),
    updateEvent: (id: string, updates: any) => updateRecord('events', id, updates),
    deleteEvent: (id: string) => deleteRecord('events', id),

    // Task functions
    addTask: (task: any) => addRecord('tasks', task),
    updateTask: (id: number, updates: any) => updateRecord('tasks', id, updates),
    deleteTask: (id: number) => deleteRecord('tasks', id),

    // Invoice functions
    addInvoice: (invoice: any) => addRecord('invoices', invoice),
    updateInvoice: (id: string, updates: any) => updateRecord('invoices', id, updates),
    deleteInvoice: (id: string) => deleteRecord('invoices', id),

    // Avocat functions
    addAvocat: (avocat: any) => addRecord('avocats', avocat),
    updateAvocat: (id: string, updates: any) => updateRecord('avocats', id, updates),
    deleteAvocat: (id: string) => deleteRecord('avocats', id),

    // Personnel functions
    addPersonnel: (personnel: any) => addRecord('personnels', personnel),
    updatePersonnel: (id: string, updates: any) => updateRecord('personnels', id, updates),
    deletePersonnel: (id: string) => deleteRecord('personnels', id),

    // Fournisseur functions
    addFournisseur: (fournisseur: any) => addRecord('fournisseurs', fournisseur),
    updateFournisseur: (id: string, updates: any) => updateRecord('fournisseurs', id, updates),
    deleteFournisseur: (id: string) => deleteRecord('fournisseurs', id),
};

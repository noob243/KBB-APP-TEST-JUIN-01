import { supabase } from '../supabaseClient';

// Fonction pour récupérer une table avec un nom de table dans l'erreur
const fetchTableWithErrorLogging = async (tableName: string) => {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
        // Propage une erreur personnalisée qui inclut le nom de la table
        throw new Error(`Erreur de chargement pour la table : ${tableName}. Vérifiez les politiques RLS.`);
    }
    return data;
};

export const supabaseService = {
    fetchAllData: async () => {
        const tableNames = ['clients', 'cases', 'events', 'tasks', 'invoices', 'avocats', 'personnel', 'fournisseurs'];
        const data: { [key: string]: any[] } = {};

        for (const tableName of tableNames) {
            // Attend la résolution de chaque promesse individuellement pour identifier l'erreur exacte
            data[tableName] = await fetchTableWithErrorLogging(tableName);
        }

        return {
            clients: data.clients,
            cases: data.cases,
            events: data.events,
            tasks: data.tasks,
            invoices: data.invoices,
            avocats: data.avocats,
            personnels: data.personnel,
            fournisseurs: data.fournisseurs,
        };
    },

    // ... (le reste des fonctions add, update, delete restent les mêmes)
    addClient: (client: any) => supabase.from('clients').insert([client]),
    updateClient: (id: number, updates: any) => supabase.from('clients').update(updates).eq('id', id),
    deleteClient: (id: number) => supabase.from('clients').delete().eq('id', id),

    addCase: (caseItem: any) => supabase.from('cases').insert([caseItem]),
    updateCase: (id: string, updates: any) => supabase.from('cases').update(updates).eq('id', id),
    deleteCase: (id: string) => supabase.from('cases').delete().eq('id', id),

    addEvent: (event: any) => supabase.from('events').insert([event]),
    updateEvent: (id: string, updates: any) => supabase.from('events').update(updates).eq('id', id),
    deleteEvent: (id: string) => supabase.from('events').delete().eq('id', id),

    addTask: (task: any) => supabase.from('tasks').insert([task]),
    updateTask: (id: number, updates: any) => supabase.from('tasks').update(updates).eq('id', id),
    deleteTask: (id: number) => supabase.from('tasks').delete().eq('id', id),

    addInvoice: (invoice: any) => supabase.from('invoices').insert([invoice]),
    updateInvoice: (id: string, updates: any) => supabase.from('invoices').update(updates).eq('id', id),
    deleteInvoice: (id: string) => supabase.from('invoices').delete().eq('id', id),

    addAvocat: (avocat: any) => supabase.from('avocats').insert([avocat]),
    updateAvocat: (id: string, updates: any) => supabase.from('avocats').update(updates).eq('id', id),
    deleteAvocat: (id: string) => supabase.from('avocats').delete().eq('id', id),

    addPersonnel: (personnel: any) => supabase.from('personnel').insert([personnel]),
    updatePersonnel: (id: string, updates: any) => supabase.from('personnel').update(updates).eq('id', id),
    deletePersonnel: (id: string) => supabase.from('personnel').delete().eq('id', id),

    addFournisseur: (fournisseur: any) => supabase.from('fournisseurs').insert([fournisseur]),
    updateFournisseur: (id: string, updates: any) => supabase.from('fournisseurs').update(updates).eq('id', id),
    deleteFournisseur: (id: string) => supabase.from('fournisseurs').delete().eq('id', id),
};

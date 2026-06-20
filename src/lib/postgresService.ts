import { supabase } from '../supabaseClient';

const tableNames: Record<string, string> = {
  personnels: 'personnel',
};

const camelToSnakeMap: Record<string, Record<string, string>> = {
  clients: {
    typeFacturation: 'type_facturation',
  },
  cases: {
    nextHearing: 'next_hearing',
    procedureInstance: 'procedure_instance',
    procedureObjet: 'procedure_objet',
    procedureDateDebut: 'procedure_date_debut',
    procedureDateFin: 'procedure_date_fin',
    procedureStatus: 'procedure_status',
  },
  events: {
    coOrganisateur: 'co_organisateur',
    publicCible: 'public_cible',
    membresKBB: 'membres_kbb',
    membresExternes: 'membres_externes',
    budgetPrevisionnel: 'budget_previsionnel',
    budgetRealise: 'budget_realise',
    fraisParticipation: 'frais_participation',
    autresRecettes: 'autres_recettes',
    recettesTotal: 'recettes_total',
    photoProfil: 'photo_profil',
    piecesJointes: 'pieces_jointes',
  },
  avocats: {
    fullName: 'full_name',
    photoUrl: 'photo_url',
    firstOathDate: 'first_oath_date',
    secondOathDate: 'second_oath_date',
    onaNumber: 'ona_number',
    cabinetStatus: 'cabinet_status',
    serviceStartDate: 'service_start_date',
    serviceStatus: 'service_status',
    cabinetRole: 'cabinet_role',
    disciplinaryMeasures: 'disciplinary_measures',
    mainBar: 'main_bar',
    secondaryBar: 'secondary_bar',
    maritalStatus: 'marital_status',
    physicalAddress: 'physical_address',
    hasChildren: 'has_children',
    childrenCount: 'children_count',
  },
  personnels: {
    fullName: 'full_name',
    serviceStartDate: 'service_start_date',
    serviceStatus: 'service_status',
    maritalStatus: 'marital_status',
    hasChildren: 'has_children',
    childrenCount: 'children_count',
    disciplinaryMeasure: 'disciplinary_measure',
    disciplinaryStatus: 'disciplinary_status',
  },
  tasks: {
    caseId: 'case_id',
    dueDate: 'due_date',
    procedureLinked: 'procedure_linked',
    procedureLinkedIds: 'procedure_linked_ids',
    startDate: 'start_date',
    endDate: 'end_date',
    associatedLawyers: 'associated_lawyers',
    reminderEnabled: 'reminder_enabled',
    reminderDate: 'reminder_date',
    reminderTime: 'reminder_time',
    reminderSound: 'reminder_sound',
    reminderTriggered: 'reminder_triggered',
  },
  invoices: {
    caseId: 'case_id',
    dueDate: 'due_date',
    totalAmount: 'total_amount',
    paidAmount: 'paid_amount',
  },
  fournisseurs: {
    nomComplet: 'nom_complet',
    naturePrestation: 'nature_prestation',
    designationPrestation: 'designation_prestation',
    typeFacturation: 'type_facturation',
    adressePhysique: 'adresse_physique',
    adresseMail: 'adresse_mail',
    dirigeantPrincipal: 'dirigeant_principal',
  }
};

export function toDbRecord(table: string, jsObj: any): any {
  if (!jsObj) return jsObj;
  const map = camelToSnakeMap[table];
  if (!map) return jsObj;
  const dbRecord: any = {};
  for (const key of Object.keys(jsObj)) {
    const dbKey = map[key] || key;
    dbRecord[dbKey] = jsObj[key];
  }
  return dbRecord;
}

export function fromDbRecord(table: string, dbRow: any): any {
  if (!dbRow) return dbRow;
  const map = camelToSnakeMap[table];
  if (!map) return dbRow;
  
  const reverseMap = Object.entries(map).reduce((acc, [k, v]) => {
    acc[v] = k;
    return acc;
  }, {} as Record<string, string>);
  
  const jsObj: any = {};
  for (const key of Object.keys(dbRow)) {
    const jsKey = reverseMap[key] || key;
    jsObj[jsKey] = dbRow[key];
  }
  return jsObj;
}

export async function dbCreateDoc<T extends { id: string | number }>(
  collectionName: string,
  id: string | number,
  data: Omit<T, 'id'>
) {
  const dbTable = tableNames[collectionName] || collectionName;
  const payload = toDbRecord(collectionName, { ...data, id });
  
  const { error } = await supabase.from(dbTable).insert(payload);
  if (error) {
    console.error(`PostgreSQL Create Error [${dbTable}]:`, error);
    throw error;
  }
  return true;
}

export async function dbUpdateDoc<T extends { id: string | number }>(
  collectionName: string,
  id: string | number,
  data: Partial<T>
) {
  const dbTable = tableNames[collectionName] || collectionName;
  const payload = toDbRecord(collectionName, data);
  
  const { error } = await supabase.from(dbTable).update(payload).eq('id', id);
  if (error) {
    console.error(`PostgreSQL Update Error [${dbTable}]:`, error);
    throw error;
  }
  return true;
}

export async function dbDeleteDoc(collectionName: string, id: string | number) {
  const dbTable = tableNames[collectionName] || collectionName;
  
  const { error } = await supabase
    .from(dbTable)
    .delete()
    .eq('id', id);
  if (error) {
    console.error(`PostgreSQL Delete Error [${dbTable}]:`, error);
    throw error;
  }
  return true;
}

export async function syncLocalCollection<T extends { id: string | number }>(
  collectionName: string,
  localItems: T[]
): Promise<void> {
  try {
    const dbTable = tableNames[collectionName] || collectionName;
    const { data, error } = await supabase.from(dbTable).select('id');
    if (error) throw error;
    
    const cloudIds = new Set((data || []).map(row => String(row.id)));
    
    for (const item of localItems) {
      if (!cloudIds.has(String(item.id))) {
        console.log(`Syncing missing item ${item.id} to PostgreSQL table ${dbTable}...`);
        const payload = toDbRecord(collectionName, item);
        const { error: insertError } = await supabase.from(dbTable).insert(payload);
        if (insertError) throw insertError;
      }
    }
  } catch (err) {
    console.error(`Local sync failed for ${collectionName}:`, err);
    throw err;
  }
}

export function onSnapshotPostgres(
  collectionName: string,
  onUpdate: (data: any[]) => void,
  onError?: (err: any) => void
) {
  const dbTable = tableNames[collectionName] || collectionName;
  let localData: any[] = [];

  // Fetch initial state
  supabase
    .from(dbTable)
    .select('*')
    .then(({ data, error }) => {
      if (error) {
        console.error(`Initial fetch error for table ${dbTable}:`, error);
        if (onError) onError(error);
        return;
      }
      localData = (data || []).map(row => fromDbRecord(collectionName, row));
      // Sort collections if they are ID or specific ordering based
      if (collectionName === 'clients' || collectionName === 'tasks') {
        localData.sort((a, b) => Number(a.id) - Number(b.id));
      }
      onUpdate([...localData]);
    });

  // Setup Realtime Postgres Subscription
  const channel = supabase
    .channel(`${collectionName}-changes`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: dbTable },
      (payload) => {
        const { eventType, new: newRec, old: oldRec } = payload;
        
        if (eventType === 'INSERT') {
          const item = fromDbRecord(collectionName, newRec);
          if (!localData.some(x => String(x.id) === String(item.id))) {
            localData.push(item);
          }
        } else if (eventType === 'UPDATE') {
          const item = fromDbRecord(collectionName, newRec);
          localData = localData.map(x => String(x.id) === String(item.id) ? item : x);
        } else if (eventType === 'DELETE') {
          const id = oldRec.id;
          localData = localData.filter(x => String(x.id) !== String(id));
        }

        // Re-sort collections if necessary
        if (collectionName === 'clients' || collectionName === 'tasks') {
          localData.sort((a, b) => Number(a.id) - Number(b.id));
        }
        
        onUpdate([...localData]);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

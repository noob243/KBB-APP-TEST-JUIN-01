import React, { FC, useState } from 'react';
import PageContainer from '../components/PageContainer';
import { UserIcon } from '../components/Icons';
import { Client, Case, Event, Task, Invoice, Avocat, Personnel } from '../types';
import { DetailedEditModal } from '../components/DetailedEditModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Custom Tooltip Component for Recharts v3
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
          borderRadius: '12px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          fontSize: '11px', 
          fontWeight: 'bold',
          backgroundColor: 'white', // Added background color for visibility
          padding: '10px' // Added padding
      }}>
        <p style={{ color: '#0f172a', fontWeight: '800' }}>{label}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index}>
            {`${pld.name}: ${pld.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface GestionPageProps {
    clients: Client[];
    cases: Case[];
    events: Event[];
    tasks: Task[];
    invoices: Invoice[];
    avocats: Avocat[];
    personnels: Personnel[];
    onDeleteClient: (id: number) => void;
    onDeleteCase: (id: string) => void;
    onDeleteAvocat: (id: string) => void;
    onDeletePersonnel: (id: string) => void;
    onUpdateClient: (updated: Client) => void;
    onUpdateCase: (updated: Case) => void;
    onUpdateAvocat: (updated: Avocat) => void;
    onUpdatePersonnel: (updated: Personnel) => void;
}

const GestionPage: FC<GestionPageProps> = (props) => {
    const tableHeaderClass = "p-3 font-extrabold text-2xs text-[#15447c] uppercase tracking-wider bg-slate-50 border-b border-gray-250";
    const tableCellClass = "p-3 text-xs text-gray-700 align-middle border-b border-gray-100";
    const actionButtonClass = "font-extrabold text-indigo-600 hover:text-indigo-850 bg-indigo-50 hover:bg-indigo-100/70 px-2 py-1.5 rounded-lg mr-2 transition";
    const deleteButtonClass = "font-extrabold text-rose-600 hover:text-rose-850 bg-rose-50 hover:bg-rose-100 px-2 py-1.5 rounded-lg transition";
    const saveButtonClass = "font-extrabold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg mr-2 transition shadow-3xs";
    const cancelButtonClass = "font-extrabold text-gray-500 hover:text-gray-750 bg-gray-55/70 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg transition border border-gray-200";

    // Edit states
    const [editingType, setEditingType] = useState<'client' | 'case' | 'avocat' | 'personnel' | null>(null);
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [editForm, setEditForm] = useState<any>({});

    // Detailed edit states
    const [detailedEditingType, setDetailedEditingType] = useState<'client' | 'case' | 'avocat' | 'personnel' | null>(null);
    const [detailedEditForm, setDetailedEditForm] = useState<any>(null);

    const startDetailedEdit = (type: 'client' | 'case' | 'avocat' | 'personnel', item: any) => {
        setDetailedEditingType(type);
        setDetailedEditForm(JSON.parse(JSON.stringify(item)));
    };

    const closeDetailedEdit = () => {
        setDetailedEditingType(null);
        setDetailedEditForm(null);
    };

    const handleDetailedFieldChange = (field: string, value: any) => {
        setDetailedEditForm((prev: any) => {
            if (!prev) return prev;
            const up = { ...prev, [field]: value };
            if (field === 'hasChildren' && value === 'Non') {
                up.childrenCount = 0;
            }
            return up;
        });
    };

    const saveDetailedEdit = () => {
        if (!detailedEditForm) return;
        if (detailedEditingType === 'client') {
            props.onUpdateClient(detailedEditForm as Client);
        } else if (detailedEditingType === 'case') {
            // Sync backward compatibility properties from the first procedure of the case
            const updatedForm = { ...detailedEditForm };
            if (updatedForm.procedures && updatedForm.procedures.length > 0) {
                const primaryProc = updatedForm.procedures[0];
                updatedForm.procedure = primaryProc?.name || '';
                updatedForm.procedureInstance = primaryProc?.instance || '';
                updatedForm.procedureObjet = primaryProc?.objet || '';
                updatedForm.procedureDateDebut = primaryProc?.dateDebut || '';
                updatedForm.procedureDateFin = primaryProc?.dateFin || '';
                updatedForm.procedureStatus = primaryProc?.status || '';
            } else {
                updatedForm.procedure = '';
                updatedForm.procedureInstance = '';
                updatedForm.procedureObjet = '';
                updatedForm.procedureDateDebut = '';
                updatedForm.procedureDateFin = '';
                updatedForm.procedureStatus = '';
            }
            props.onUpdateCase(updatedForm as Case);
        } else if (detailedEditingType === 'avocat') {
            props.onUpdateAvocat(detailedEditForm as Avocat);
        } else if (detailedEditingType === 'personnel') {
            props.onUpdatePersonnel(detailedEditForm as Personnel);
        }
        closeDetailedEdit();
    };

    const startEdit = (type: 'client' | 'case' | 'avocat' | 'personnel', item: any) => {
        setEditingType(type);
        setEditingId(item.id);
        setEditForm({ ...item });
    };

    const cancelEdit = () => {
        setEditingType(null);
        setEditingId(null);
        setEditForm({});
    };

    const handleFieldChange = (field: string, value: any) => {
        setEditForm((prev: any) => {
            const up = { ...prev, [field]: value };
            // Auto handle logic for children in personnel
            if (field === 'hasChildren' && value === 'Non') {
                up.childrenCount = 0;
            }
            return up;
        });
    };

    const saveEdit = () => {
        if (editingType === 'client') {
            props.onUpdateClient(editForm as Client);
        } else if (editingType === 'case') {
            props.onUpdateCase(editForm as Case);
        } else if (editingType === 'avocat') {
            props.onUpdateAvocat(editForm as Avocat);
        } else if (editingType === 'personnel') {
            props.onUpdatePersonnel(editForm as Personnel);
        }
        cancelEdit();
    };

    const handleDelete = (action: Function, id: number | string, type: string) => {
        action(id);
    };
    
    // Calculate completed tasks per lawyer for workload visualization
    const lawyerCompletedTaskCounts = props.avocats.map(avocat => {
        const completedTasksCount = props.tasks.filter(task => 
            task.lawyer && 
            task.lawyer.trim().toLowerCase() === avocat.fullName.trim().toLowerCase() && 
            task.status === 'Effectué'
        ).length;
        
        return {
            name: avocat.fullName,
            completed: completedTasksCount
        };
    });

    return (
        <PageContainer title="Panneau de Gestion (Admin)">
            <p className="mb-8 text-xs text-gray-500 font-bold bg-slate-50 border border-gray-150 p-3.5 rounded-xl max-w-2xl leading-relaxed">
                🛡️ <span className="text-[#15447c] font-black">Console Administrateur KBB KIN-SERVICES</span>. Saisissez, modifiez et contrôlez toutes les informations de l'application en temps réel avec sauvegarde automatique.
            </p>

            {/* WORKLOAD BAR CHART */}
            <div className="bg-white rounded-2xl border border-gray-150 p-6 mb-10 shadow-xs max-w-4xl">
                <div className="mb-4">
                    <h3 className="text-sm font-black text-gray-800 tracking-tight flex items-center gap-1.5">
                        📈 Charge de travail par Avocat
                    </h3>
                    <p className="text-[10px] text-gray-450 font-bold mt-0.5">Nombre de tâches officiellement terminées (Statut: Effectué) pour chaque avocat</p>
                </div>
                <div className="h-[250px] w-full mt-4">
                    {lawyerCompletedTaskCounts.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">
                            Aucun avocat enregistré pour générer le graphique.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={lawyerCompletedTaskCounts} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }} 
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis 
                                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} 
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="completed" name="Tâches complétées" radius={[6, 6, 0, 0]} barSize={28}>
                                    {lawyerCompletedTaskCounts.map((entry, index) => {
                                        const colors = ['#15447c', '#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#3b82f6'];
                                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
            
            {/* Section Avocats */}
            <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs mb-10">
                <div className="p-4 bg-slate-50/50 border-b border-gray-150 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-black text-gray-800 tracking-tight">Avocats inscrits ({props.avocats.length})</h3>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">Membres du barreau rattachés au cabinet</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className={tableHeaderClass}>Nom Complet</th>
                                <th className={tableHeaderClass}>Commission / Niveau</th>
                                <th className={tableHeaderClass}>Statut de Service</th>
                                <th className={tableHeaderClass}>Rôle Cabinet</th>
                                <th className={tableHeaderClass}>Téléphone</th>
                                <th className={`${tableHeaderClass} text-right`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {props.avocats.map((item) => {
                                const isEditing = editingType === 'avocat' && editingId === item.id;
                                return (
                                    <tr key={item.id} className="border-b border-gray-100 hover:bg-slate-50/20 transition">
                                        {isEditing ? (
                                            <>
                                                <td className={tableCellClass}>
                                                    <input 
                                                        type="text" 
                                                        value={editForm.fullName || ''} 
                                                        onChange={(e) => handleFieldChange('fullName', e.target.value)}
                                                        className="p-1.5 border border-indigo-400/50 rounded-lg text-xs font-bold w-full bg-white shadow-inner focus:ring-2 focus:ring-indigo-500/10 focus:outline-hidden"
                                                    />
                                                </td>
                                                <td className={tableCellClass}>
                                                    <select 
                                                        value={editForm.cabinetStatus || 'Junior'} 
                                                        onChange={(e) => handleFieldChange('cabinetStatus', e.target.value)}
                                                        className="p-1.5 border border-indigo-400/50 rounded-lg text-2xs font-bold w-full bg-white focus:outline-hidden"
                                                    >
                                                        <option value="Senior of counsel">Senior of counsel</option>
                                                        <option value="Senior">Senior</option>
                                                        <option value="Associé">Associé</option>
                                                        <option value="Junior">Junior</option>
                                                    </select>
                                                </td>
                                                <td className={tableCellClass}>
                                                    <select 
                                                        value={editForm.serviceStatus || 'Actif'} 
                                                        onChange={(e) => handleFieldChange('serviceStatus', e.target.value)}
                                                        className="p-1.5 border border-indigo-400/50 rounded-lg text-2xs font-bold w-full bg-white focus:outline-hidden"
                                                    >
                                                        <option value="Actif">Actif</option>
                                                        <option value="Omis">Omis</option>
                                                        <option value="Mise en disponibilité">Mise en disponibilité</option>
                                                    </select>
                                                </td>
                                                <td className={tableCellClass}>
                                                    <input 
                                                        type="text" 
                                                        value={editForm.cabinetRole || ''} 
                                                        onChange={(e) => handleFieldChange('cabinetRole', e.target.value)}
                                                        className="p-1.5 border border-indigo-400/50 rounded-lg text-xs font-medium w-full bg-white shadow-inner focus:ring-2 focus:ring-indigo-500/10 focus:outline-hidden"
                                                    />
                                                </td>
                                                <td className={tableCellClass}>
                                                    <input 
                                                        type="text" 
                                                        value={editForm.phone || ''} 
                                                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                                                        className="p-1.5 border border-indigo-400/50 rounded-lg text-xs font-semibold w-full bg-white shadow-inner font-mono focus:outline-hidden"
                                                    />
                                                </td>
                                                <td className={`${tableCellClass} text-right whitespace-nowrap`}>
                                                    <button onClick={saveEdit} className={saveButtonClass}>Enregistrer</button>
                                                    <button onClick={cancelEdit} className={cancelButtonClass}>Annuler</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className={`${tableCellClass} font-bold text-gray-800`}>{item.fullName}</td>
                                                <td className={tableCellClass}>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                                        item.cabinetStatus === 'Senior' ? 'bg-[#15447c]/10 text-[#15447c]' :
                                                        item.cabinetStatus === 'Senior of counsel' ? 'bg-purple-100 text-purple-800' :
                                                        item.cabinetStatus === 'Associé' ? 'bg-emerald-100 text-emerald-800' :
                                                        'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {item.cabinetStatus}
                                                    </span>
                                                </td>
                                                <td className={tableCellClass}>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        item.serviceStatus === 'Actif' ? 'bg-green-100 text-green-800' :
                                                        item.serviceStatus === 'Omis' ? 'bg-amber-100 text-amber-805 bg-amber-50 text-amber-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {item.serviceStatus}
                                                    </span>
                                                </td>
                                                <td className={`${tableCellClass} font-semibold text-slate-650`}>{item.cabinetRole || 'Non spécifié'}</td>
                                                <td className={`${tableCellClass} font-mono font-bold text-gray-500`}>{item.phone || '-'}</td>
                                                <td className={`${tableCellClass} text-right whitespace-nowrap`}>
                                                    <div className="inline-flex gap-1">
                                                        <button 
                                                            onClick={() => startEdit('avocat', item)} 
                                                            className="font-extrabold text-[10px] text-indigo-600 hover:text-indigo-850 bg-indigo-50 hover:bg-indigo-100/70 px-2 py-1.5 rounded-lg transition"
                                                            title="Modification rapide inline"
                                                        >
                                                            ⚡ Rapide
                                                        </button>
                                                        <button 
                                                            onClick={() => startDetailedEdit('avocat', item)} 
                                                            className="font-extrabold text-[10px] text-amber-700 hover:text-amber-850 bg-amber-50 hover:bg-amber-100/60 px-2 py-1.5 rounded-lg transition"
                                                            title="Modifier tous les champs"
                                                        >
                                                            ⚙️ Détaillé
                                                        </button>
                                                        <button onClick={() => handleDelete(props.onDeleteAvocat, item.id, 'avocat')} className={deleteButtonClass}>Supprimer</button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section Clients */}
            <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs mb-10">
                <div className="p-4 bg-slate-50/50 border-b border-gray-150 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-black text-gray-800 tracking-tight">Clients enregistrés ({props.clients.length})</h3>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">Personnes physiques ou de droit moral</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className={tableHeaderClass}>Nom / Raison Sociale</th>
                                <th className={tableHeaderClass}>Contact Principal</th>
                                <th className={tableHeaderClass}>Adresse E-mail</th>
                                <th className={tableHeaderClass}>Téléphone</th>
                                <th className={tableHeaderClass}>Type Facturation</th>
                                <th className={tableHeaderClass}>Siège Social</th>
                                <th className={`${tableHeaderClass} text-right`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {props.clients.map((item) => {
                                const isEditing = editingType === 'client' && editingId === item.id;
                                return (
                                    <tr key={item.id} className="border-b border-gray-100 hover:bg-slate-50/20 transition">
                                        {isEditing ? (
                                            <>
                                                <td className={tableCellClass}>
                                                    <input 
                                                        type="text" 
                                                        value={editForm.name || ''} 
                                                        onChange={(e) => handleFieldChange('name', e.target.value)}
                                                        className="p-1.5 border border-indigo-400/50 rounded-lg text-xs font-bold w-full bg-white shadow-inner focus:outline-hidden"
                                                    />
                                                </td>
                                                <td className={tableCellClass}>
                                                    <input 
                                                        type="text" 
                                                        value={editForm.contact || ''} 
                                                        onChange={(e) => handleFieldChange('contact', e.target.value)}
                                                        className="p-1.5 border border-indigo-400/50 rounded-lg text-xs font-semibold w-full bg-white shadow-inner focus:outline-hidden"
                                                    />
                                                </td>
                                                <td className={tableCellClass}>
                                                    <input 
                                                        type="email" 
                                                        value={editForm.email || ''} 
                                                        onChange={(e) => handleFieldChange('email', e.target.value)}
                                                        className="p-1.5 border border-indigo-400/50 rounded-lg text-xs font-medium w-full bg-white shadow-inner font-mono focus:outline-hidden"
                                                    />
                                                </td>
                                                <td className={tableCellClass}>
                                                    <input 
                                                        type="text" 
                                                        value={editForm.phone || ''} 
                                                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                                                        className="p-1.5 border border-indigo-400/50 rounded-lg text-xs font-bold w-full bg-white shadow-inner font-mono focus:outline-hidden"
                                                    />
                                                </td>
                                                <td className={tableCellClass}>
                                                    <div className="flex flex-col gap-1 max-h-24 overflow-y-auto p-1 border border-indigo-300 bg-white rounded-lg select-none min-w-[120px]">
                                                        {[
                                                            'Forfaitaire',
                                                            'Taux horaire',
                                                            'Abonnement mensuel',
                                                            'Abonnement annuel',
                                                            'Au dossier (Ponctuelle)'
                                                        ].map(opt => {
                                                            const currentTypes = (editForm.typeFacturation || '').split(',').map((t: string) => t.trim()).filter(Boolean);
                                                            const isChecked = currentTypes.includes(opt);
                                                            return (
                                                                <label key={opt} className="flex items-center gap-1 cursor-pointer text-[10px] whitespace-nowrap text-gray-700 hover:bg-slate-50 font-bold p-0.5">
                                                                    <input 
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={() => {
                                                                            let newTypes;
                                                                            if (isChecked) {
                                                                                newTypes = currentTypes.filter((t: string) => t !== opt);
                                                                            } else {
                                                                                newTypes = [...currentTypes, opt];
                                                                            }
                                                                            handleFieldChange('typeFacturation', newTypes.join(', '));
                                                                        }}
                                                                        className="h-3 w-3 text-indigo-600 rounded border-gray-300"
                                                                        id={`opt-${opt}`}
                                                                    />
                                                                    <span>{opt}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                <td className={tableCellClass}>
                                                    <input 
                                                        type="text" 
                                                        value={editForm.siege || ''} 
                                                        onChange={(e) => handleFieldChange('siege', e.target.value)}
                                                        className="p-1.5 border border-indigo-400/50 rounded-lg text-xs font-semibold w-full bg-white shadow-inner focus:outline-hidden"
                                                    />
                                                </td>
                                                <td className={`${tableCellClass} text-right whitespace-nowrap`}>
                                                    <button onClick={saveEdit} className={saveButtonClass}>Enregistrer</button>
                                                    <button onClick={cancelEdit} className={cancelButtonClass}>Annuler</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className={`${tableCellClass} font-bold text-gray-800`}>{item.name}</td>
                                                <td className={`${tableCellClass} font-semibold text-gray-650`}>{item.contact}</td>
                                                <td className={`${tableCellClass} font-mono text-gray-500`}>{item.email || '-'}</td>
                                                <td className={`${tableCellClass} font-mono font-bold text-gray-500`}>{item.phone || '-'}</td>
                                                <td className={tableCellClass}>
                                                    <span className="inline-flex items-center text-3xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 uppercase tracking-wider">
                                                        {item.typeFacturation || 'Forfaitaire'}
                                                    </span>
                                                </td>
                                                <td className={`${tableCellClass} text-gray-700 font-medium truncate max-w-[130px]`} title={item.siege}>{item.siege || '-'}</td>
                                                <td className={`${tableCellClass} text-right whitespace-nowrap`}>
                                                    <div className="inline-flex gap-1">
                                                        <button 
                                                            onClick={() => startEdit('client', item)} 
                                                            className="font-extrabold text-[10px] text-indigo-600 hover:text-indigo-850 bg-indigo-50 hover:bg-indigo-100/70 px-2 py-1.5 rounded-lg transition"
                                                            title="Modification rapide inline"
                                                        >
                                                            ⚡ Rapide
                                                        </button>
                                                        <button 
                                                            onClick={() => startDetailedEdit('client', item)} 
                                                            className="font-extrabold text-[10px] text-amber-700 hover:text-amber-850 bg-amber-50 hover:bg-amber-100/60 px-2 py-1.5 rounded-lg transition"
                                                            title="Modifier tous les champs"
                                                        >
                                                            ⚙️ Détaillé
                                                        </button>
                                                        <button onClick={() => handleDelete(props.onDeleteClient, item.id, 'client')} className={deleteButtonClass}>Supprimer</button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section Dossiers */}
            <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs mb-10">
                <div className="p-4 bg-slate-50/50 border-b border-gray-150 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-black text-gray-800 tracking-tight">Dossiers actifs ({props.cases.length})</h3>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">Affaires judiciaires en cours de traitement</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className={tableHeaderClass}>Nom Dossier</th>
                                <th className={tableHeaderClass}>Client associé</th>
                                <th className={tableHeaderClass}>Statut Litige</th>
                                <th className={tableHeaderClass}>Notes / Commentaires</th>
                                <th className={`${tableHeaderClass} text-right`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {props.cases.map((item) => {
                                const isEditing = editingType === 'case' && editingId === item.id;
                                return (
                                    <tr key={item.id} className="border-b border-gray-100 hover:bg-slate-50/20 transition">
                                        {isEditing ? (
                                            <>
                                                <td className={tableCellClass}>
                                                    <input 
                                                        type="text" 
                                                        value={editForm.name || ''} 
                                                        onChange={(e) => handleFieldChange('name', e.target.value)}
                                                        className="p-1.5 border border-indigo-400/50 rounded-lg text-xs font-bold w-full bg-white shadow-inner focus:outline-hidden"
                                                    />
                                                </td>
                                                <td className={tableCellClass}>
                                                    <select 
                                                        value={editForm.client || ''} 
                                                        onChange={(e) => handleFieldChange('client', e.target.value)}
                                                        className="p-1.5 border border-indigo-400/50 rounded-lg text-2xs font-bold w-full bg-white focus:outline-hidden"
                                                    >
                                                        {props.clients.map(c => (
                                                            <option key={c.id} value={c.name}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className={tableCellClass}>
                                                    <select 
                                                        value={editForm.status || 'Nouveau'} 
                                                        onChange={(e) => handleFieldChange('status', e.target.value)}
                                                        className="p-1.5 border border-indigo-400/50 rounded-lg text-2xs font-bold w-full bg-white focus:outline-hidden"
                                                    >
                                                        <option value="Nouveau">Nouveau</option>
                                                        <option value="En cours">En cours</option>
                                                        <option value="En attente">En attente</option>
                                                        <option value="Clôturé">Clôturé</option>
                                                    </select>
                                                </td>
                                                <td className={tableCellClass}>
                                                    <textarea 
                                                        value={editForm.notes || ''} 
                                                        onChange={(e) => handleFieldChange('notes', e.target.value)}
                                                        className="p-1.5 border border-indigo-400/50 rounded-lg text-xs w-full bg-white shadow-inner min-h-[50px] focus:outline-hidden"
                                                        placeholder="Notes supplémentaires..."
                                                    />
                                                </td>
                                                <td className={`${tableCellClass} text-right whitespace-nowrap`}>
                                                    <button onClick={saveEdit} className={saveButtonClass}>Enregistrer</button>
                                                    <button onClick={cancelEdit} className={cancelButtonClass}>Annuler</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className={`${tableCellClass} font-bold text-gray-800`}>
                                                    {item.name}
                                                    <span className="text-[9px] font-mono text-gray-400 block tracking-tight">{item.id}</span>
                                                </td>
                                                <td className={`${tableCellClass} font-semibold text-gray-650`}>{item.client}</td>
                                                <td className={tableCellClass}>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                                        item.status === 'En cours' ? 'bg-indigo-150 text-indigo-900' :
                                                        item.status === 'Clôturé' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className={`${tableCellClass} max-w-sm text-gray-400 font-medium truncate`} title={item.notes}>
                                                    {item.notes || <span className="text-gray-300 italic">Aucune note</span>}
                                                </td>
                                                <td className={`${tableCellClass} text-right whitespace-nowrap`}>
                                                    <div className="inline-flex gap-1">
                                                        <button 
                                                            onClick={() => startEdit('case', item)} 
                                                            className="font-extrabold text-[10px] text-indigo-600 hover:text-indigo-850 bg-indigo-50 hover:bg-indigo-100/70 px-2 py-1.5 rounded-lg transition"
                                                            title="Modification rapide inline"
                                                        >
                                                            ⚡ Rapide
                                                        </button>
                                                        <button 
                                                            onClick={() => startDetailedEdit('case', item)} 
                                                            className="font-extrabold text-[10px] text-amber-700 hover:text-amber-850 bg-amber-50 hover:bg-amber-100/60 px-2 py-1.5 rounded-lg transition"
                                                            title="Modifier tous les champs"
                                                        >
                                                            ⚙️ Détaillé
                                                        </button>
                                                        <button onClick={() => handleDelete(props.onDeleteCase, item.id, 'dossier')} className={deleteButtonClass}>Supprimer</button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section Personnel */}
            <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-xs mb-10">
                <div className="p-4 bg-slate-50/50 border-b border-gray-150 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-black text-gray-800 tracking-tight">Membres du personnel ({props.personnels.length})</h3>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">Parcours d'embauche, salaires et états de service</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th className={tableHeaderClass}>Nom Complet</th>
                                <th className={tableHeaderClass}>Rôle / Fonction</th>
                                <th className={tableHeaderClass}>Salaire Mensuel</th>
                                <th className={tableHeaderClass}>État matrimonial / Enfants</th>
                                <th className={tableHeaderClass}>Statut de service</th>
                                <th className={tableHeaderClass}>Sanctions & Mesures disciplinaires</th>
                                <th className={`${tableHeaderClass} text-right`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {props.personnels.map((item) => {
                                const isEditing = editingType === 'personnel' && editingId === item.id;
                                return (
                                    <tr key={item.id} className="border-b border-gray-100 hover:bg-slate-50/20 transition">
                                        {isEditing ? (
                                            <>
                                                <td className={tableCellClass}>
                                                    <input 
                                                        type="text" 
                                                        value={editForm.fullName || ''} 
                                                        onChange={(e) => handleFieldChange('fullName', e.target.value)}
                                                        className="p-1.5 border border-indigo-400/50 rounded-lg text-xs font-bold w-full bg-white shadow-inner focus:outline-hidden"
                                                    />
                                                </td>
                                                <td className={tableCellClass}>
                                                    <select 
                                                        value={editForm.role || 'Secrétaire'} 
                                                        onChange={(e) => handleFieldChange('role', e.target.value)}
                                                        className="p-1.5 border border-indigo-400/50 rounded-lg text-2xs font-bold w-full bg-white focus:outline-hidden"
                                                    >
                                                        <option value="Secrétaire">Secrétaire</option>
                                                        <option value="Stagiaire">Stagiaire</option>
                                                        <option value="Assistant juridique">Assistant juridique</option>
                                                        <option value="Chauffeur">Chauffeur</option>
                                                        <option value="Assistant de direction">Assistant de direction</option>
                                                        <option value="Cleaner">Cleaner</option>
                                                        <option value="Courtier">Courtier</option>
                                                        <option value="Intendant">Intendant</option>
                                                    </select>
                                                </td>
                                                <td className={tableCellClass}>
                                                    <input 
                                                        type="number" 
                                                        value={editForm.salary || 0} 
                                                        onChange={(e) => handleFieldChange('salary', parseFloat(e.target.value) || 0)}
                                                        className="p-1.5 border border-indigo-400/50 rounded-lg text-xs font-semibold font-mono w-full bg-white shadow-inner focus:outline-hidden"
                                                    />
                                                </td>
                                                <td className={tableCellClass}>
                                                    <div className="space-y-1.5">
                                                        <select 
                                                            value={editForm.maritalStatus || 'Célibataire'} 
                                                            onChange={(e) => handleFieldChange('maritalStatus', e.target.value)}
                                                            className="p-1 border border-indigo-300 rounded text-3xs font-semibold w-full bg-white"
                                                        >
                                                            <option value="Célibataire">Célibataire</option>
                                                            <option value="Marié(e)">Marié(e)</option>
                                                            <option value="Divorcé(e)">Divorcé(e)</option>
                                                            <option value="Veuf(ve)">Veuf(ve)</option>
                                                        </select>
                                                        <div className="flex gap-1">
                                                            <select 
                                                                value={editForm.hasChildren || 'Non'} 
                                                                onChange={(e) => handleFieldChange('hasChildren', e.target.value)}
                                                                className="p-1 border border-indigo-300 rounded text-3xs font-semibold w-full bg-white"
                                                            >
                                                                <option value="Non">Non</option>
                                                                <option value="Oui">Oui</option>
                                                            </select>
                                                            {editForm.hasChildren === 'Oui' && (
                                                                <input 
                                                                    type="number" 
                                                                    value={editForm.childrenCount || 0} 
                                                                    onChange={(e) => handleFieldChange('childrenCount', parseInt(e.target.value, 15) || 0)}
                                                                    className="p-1 border border-indigo-300 rounded text-3xs font-bold font-mono w-10 text-center bg-white"
                                                                    min="0"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={tableCellClass}>
                                                    <select 
                                                        value={editForm.serviceStatus || 'Actif'} 
                                                        onChange={(e) => handleFieldChange('serviceStatus', e.target.value)}
                                                        className="p-1.5 border border-indigo-400/50 rounded-lg text-2xs font-bold w-full bg-white focus:outline-hidden"
                                                    >
                                                        <option value="Actif">Actif</option>
                                                        <option value="Inactif">Inactif</option>
                                                        <option value="Mise en disponibilité">Mise en disponibilité</option>
                                                    </select>
                                                </td>
                                                <td className={tableCellClass}>
                                                    <div className="space-y-1">
                                                        <select 
                                                            value={editForm.disciplinaryStatus || 'Aucune'} 
                                                            onChange={(e) => handleFieldChange('disciplinaryStatus', e.target.value)}
                                                            className="p-1 border border-indigo-300 rounded text-3xs font-semibold w-full bg-white"
                                                        >
                                                            <option value="Aucune">Aucune mesure</option>
                                                            <option value="En cours d'instruction">En cours d'instruction</option>
                                                            <option value="Avertissement oral">Avertissement oral</option>
                                                            <option value="Avertissement écrit">Avertissement écrit</option>
                                                            <option value="Blâme">Blâme</option>
                                                            <option value="Mise à pied">Mise à pied</option>
                                                            <option value="Suspension temporaire">Suspension temporaire</option>
                                                            <option value="Licenciement">Licenciement</option>
                                                        </select>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Motif/Détail..."
                                                            value={editForm.disciplinaryMeasure || ''} 
                                                            onChange={(e) => handleFieldChange('disciplinaryMeasure', e.target.value)}
                                                            className="p-1.5 border border-indigo-400/50 rounded-lg text-3xs w-full bg-white shadow-inner focus:outline-hidden"
                                                        />
                                                    </div>
                                                </td>
                                                <td className={`${tableCellClass} text-right whitespace-nowrap`}>
                                                    <button onClick={saveEdit} className={saveButtonClass}>Enregistrer</button>
                                                    <button onClick={cancelEdit} className={cancelButtonClass}>Annuler</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className={`${tableCellClass} font-bold text-gray-800`}>
                                                    <div className="flex items-center gap-2">
                                                        {item.photo ? (
                                                            <img src={item.photo} alt="" className="w-6 h-6 rounded-full object-cover border border-gray-150" />
                                                        ) : (
                                                            <UserIcon className="w-4 h-4 text-gray-400 shrink-0 inline-block" />
                                                        )}
                                                        <span>{item.fullName}</span>
                                                    </div>
                                                </td>
                                                <td className={`${tableCellClass} font-extrabold text-[#15447c]`}>{item.role}</td>
                                                <td className={`${tableCellClass} font-bold font-mono text-emerald-700`}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(item.salary || 0)}</td>
                                                <td className={`${tableCellClass} font-semibold text-slate-650`}>
                                                    {item.maritalStatus} {item.hasChildren === 'Oui' ? `(${item.childrenCount} enfants)` : '(Sans enfants)'}
                                                </td>
                                                <td className={tableCellClass}>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                        item.serviceStatus === 'Actif' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {item.serviceStatus}
                                                    </span>
                                                </td>
                                                <td className={tableCellClass}>
                                                    {item.disciplinaryStatus && item.disciplinaryStatus !== 'Aucune' ? (
                                                        <div className="space-y-0.5">
                                                            <span className="inline-block px-1.5 py-0.5 rounded text-[8px] bg-amber-100 text-amber-800 font-extrabold border border-amber-200">
                                                                {item.disciplinaryStatus}
                                                            </span>
                                                            <p className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]" title={item.disciplinaryMeasure}>
                                                                {item.disciplinaryMeasure}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300 italic text-2xs">Aucune sanction</span>
                                                    )}
                                                </td>
                                                <td className={`${tableCellClass} text-right whitespace-nowrap`}>
                                                    <div className="inline-flex gap-1">
                                                        <button 
                                                            onClick={() => startEdit('personnel', item)} 
                                                            className="font-extrabold text-[10px] text-indigo-600 hover:text-indigo-850 bg-indigo-50 hover:bg-indigo-100/70 px-2 py-1.5 rounded-lg transition"
                                                            title="Modification rapide inline"
                                                        >
                                                            ⚡ Rapide
                                                        </button>
                                                        <button 
                                                            onClick={() => startDetailedEdit('personnel', item)} 
                                                            className="font-extrabold text-[10px] text-amber-700 hover:text-amber-850 bg-amber-50 hover:bg-amber-100/60 px-2 py-1.5 rounded-lg transition"
                                                            title="Modifier tous les champs"
                                                        >
                                                            ⚙️ Détaillé
                                                        </button>
                                                        <button onClick={() => handleDelete(props.onDeletePersonnel, item.id, 'personnel')} className={deleteButtonClass}>Supprimer</button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DE MODIFICATION DÉTAILLÉE (MODULAIRE ET PROPRE) */}
            {detailedEditingType && detailedEditForm && (
                <DetailedEditModal
                    type={detailedEditingType}
                    item={detailedEditForm}
                    clients={props.clients}
                    onClose={closeDetailedEdit}
                    onSave={(updatedItem) => {
                        if (detailedEditingType === 'client') {
                            props.onUpdateClient(updatedItem as Client);
                        } else if (detailedEditingType === 'case') {
                            props.onUpdateCase(updatedItem as Case);
                        } else if (detailedEditingType === 'avocat') {
                            props.onUpdateAvocat(updatedItem as Avocat);
                        } else if (detailedEditingType === 'personnel') {
                            props.onUpdatePersonnel(updatedItem as Personnel);
                        }
                        closeDetailedEdit();
                    }}
                />
            )}
        </PageContainer>
    );
};

export default GestionPage;
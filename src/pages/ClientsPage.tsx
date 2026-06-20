
import React, { FC, useState } from 'react';
import PageContainer from '../components/PageContainer';
import ClientModal from '../components/modals/ClientModal';
import { UsersIcon, PhoneIcon, MailIcon, ChartIcon, CourthouseIcon } from '../components/Icons';
import { Client, Case } from '../types';

interface ClientsPageProps {
  clients: Client[];
  cases?: Case[]; // Made optional to avoid runtime crash, but fully implemented
  onAddClient: (client: Omit<Client, 'id'> & { id?: string | number }) => void;
  onExport: () => void;
  onSendEmail: (to: string, subject: string, body: string, recipientName?: string, attachmentName?: string) => void;
}

const ClientsPage: FC<ClientsPageProps> = ({ clients, cases = [], onAddClient, onExport, onSendEmail }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    // Industry & contact info for details (preferring real ones over fallback mock info)
    const getClientDetails = (client: Client) => {
        let sector = client.secteur || "Services Professionnels";
        let localAddress = client.siege || "Bvd du 30 Juin, Gombe, Kinshasa, RDC";
        
        if (!client.secteur) {
            if (client.name.includes("Invest")) {
                sector = "Investissements & Services Financiers";
            } else if (client.name.includes("Digital")) {
                sector = "Infrastructures Numériques & Logiciels";
            } else if (client.name.includes("Bâtir") || client.name.includes("Construction")) {
                sector = "Bâtiment & Travaux Publics (BTP)";
            } else if (client.name.includes("Saveurs")) {
                sector = "Restauration & Agro-alimentaire";
            }
        }

        const email = client.email || `${client.contact.toLowerCase().replace(/\s+/g, '.')}@${client.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
        const idNum = typeof client.id === 'number' ? client.id : (client.id ? client.id.charCodeAt(client.id.length - 1) : 42);
        const phone = client.phone || `+243 81 234 ${100 + idNum * 17}`;

        return { sector, localAddress, email, phone };
    };

    return (
        <>
            <PageContainer title="Clients" buttonLabel="Ajouter un Client" onButtonClick={() => setIsAddModalOpen(true)} exportButtonLabel="Exporter en PDF" onExportClick={onExport}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr className="text-sm text-gray-600">
                                <th className="p-4 font-semibold">Nom du Client</th>
                                <th className="p-4 font-semibold">Contact Principal</th>
                                <th className="p-4 font-semibold">Dossiers Actifs</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(client => (
                                <tr key={client.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-800">{client.name}</td>
                                    <td className="p-4 text-gray-600">{client.contact}</td>
                                    <td className="p-4 text-gray-600">
                                        <span className="inline-flex font-semibold text-xs px-2.5 py-1 bg-indigo-50 text-indigo-750 border border-indigo-100 rounded-lg">
                                            {client.cases} dossier{client.cases > 1 ? 's' : ''}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => setSelectedClient(client)}
                                                className="text-indigo-600 hover:text-indigo-850 hover:underline font-bold text-sm bg-indigo-50 hover:bg-indigo-100/60 px-3 py-1.5 rounded-xl transition duration-150 cursor-pointer"
                                            >
                                                Voir
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const details = getClientDetails(client);
                                                    onSendEmail(
                                                        details.email,
                                                        `Relation Clients — Cabinet KBB SARL`,
                                                        `Bonjour ${client.contact},\n\nDans le cadre de l'accompagnement d'affaires de ${client.name}...\n\nSentiments dévoués,\nCabinet KBB SARL`,
                                                        client.name
                                                    );
                                                }}
                                                className="text-slate-500 hover:text-indigo-800 bg-slate-50 hover:bg-indigo-50/55 p-1.5 rounded-xl transition cursor-pointer"
                                                title={`Envoyer un e-mail à ${client.name}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </PageContainer>
            
            <ClientModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={onAddClient} />

            {/* Client Details Modal */}
            {selectedClient && (() => {
                const details = getClientDetails(selectedClient);
                const clientCases = cases.filter(c => c.client.toLowerCase() === selectedClient.name.toLowerCase());
                
                return (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-center items-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                                <div>
                                    <span className="text-2xs font-bold text-indigo-600 uppercase tracking-widest block mb-1">Fiche Client n°{selectedClient.id}</span>
                                    <h2 className="text-2xl font-extrabold text-gray-850">{selectedClient.name}</h2>
                                </div>
                                <button 
                                    onClick={() => setSelectedClient(null)} 
                                    className="p-1.5 hover:bg-slate-100 rounded-xl text-gray-400 hover:text-gray-600 transition"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Informational Details */}
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Secteur d'activité</span>
                                        <p className="text-sm font-semibold text-gray-850">{details.sector}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Siège Social Principal</span>
                                        <p className="text-sm font-semibold text-gray-850 bg-slate-50 border border-slate-100 p-2.5 rounded-xl">{details.localAddress}</p>
                                    </div>
                                    {selectedClient.sieges && selectedClient.sieges.length > 0 && (
                                        <div className="mt-2 text-3xs sm:text-[11px]">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Autres Adresses Sociales ({selectedClient.sieges.length})</span>
                                            <div className="space-y-1.5">
                                                {selectedClient.sieges.map((s, idx) => (
                                                    <div key={idx} className="flex gap-2 items-start bg-indigo-50/40 p-2 rounded-xl border border-indigo-100/30 text-3xs sm:text-[10px] font-medium text-indigo-900 leading-normal">
                                                        <CourthouseIcon className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                                        <span>{s}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Dirigeant Représentant</span>
                                        <div className="text-sm font-semibold text-indigo-950 flex items-center gap-1.5">
                                            <UsersIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                                            <span>{selectedClient.contact}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Coordonnées</span>
                                        <div className="text-xs text-gray-750 font-medium p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                                            <p className="flex items-center gap-1.5">
                                                <PhoneIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                <span>{details.phone}</span>
                                            </p>
                                            <p className="flex items-center justify-between gap-2 border-t border-slate-150/50 pt-2">
                                                <span className="flex items-center gap-1.5 truncate">
                                                    <MailIcon className="w-3.5 h-3.5 text-indigo-550 shrink-0" />
                                                    <span className="truncate">{details.email}</span>
                                                </span>
                                                <button
                                                    onClick={() => onSendEmail(
                                                        details.email,
                                                        `Relation Clients — Cabinet KBB SARL`,
                                                        `Bonjour ${selectedClient.contact},\n\nNous faisons suite à l'analyse active de votre dossier au cabinet...\n\nSentiments dévoués,\nCabinet KBB SARL`,
                                                        selectedClient.name
                                                    )}
                                                    className="text-[10px] bg-indigo-100/60 hover:bg-indigo-100 text-indigo-850 font-bold px-2.5 py-1 rounded-lg transition shrink-0 cursor-pointer"
                                                >
                                                    📩 Écrire
                                                </button>
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Type de Facturation</span>
                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                                            <ChartIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                            <span>{selectedClient.typeFacturation || 'Forfaitaire'}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Linked Dossiers */}
                            <div className="border-t border-gray-100 pt-5">
                                <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest mb-3">
                                    Dossiers liés ({clientCases.length})
                                </h3>

                                {clientCases.length === 0 ? (
                                    <div className="p-5 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                                        Aucun dossier opérationnel n'est actuellement repéré pour ce client.
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                                        {clientCases.map(c => (
                                            <div key={c.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-slate-100/50 transition duration-150">
                                                <div>
                                                    <span className="text-2xs font-bold text-slate-450 font-mono tracking-wider block">{c.id}</span>
                                                    <span className="text-sm font-bold text-gray-800">{c.name}</span>
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                                    c.status === 'En cours' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
                                                    c.status === 'Clôturé' ? 'bg-green-100 text-green-800 border border-green-200' : 
                                                    c.status === 'Nouveau' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                                    'bg-yellow-100 text-yellow-800 border border-yellow-250'
                                                }`}>
                                                    {c.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end">
                                <button 
                                    onClick={() => setSelectedClient(null)} 
                                    className="bg-slate-100 hover:bg-slate-200 text-gray-800 font-bold py-2 px-6 rounded-xl transition duration-150"
                                >
                                    Fermer la fiche
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </>
    );
};

export default ClientsPage;

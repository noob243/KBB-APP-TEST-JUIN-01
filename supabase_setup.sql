-- ==========================================
-- SCRIPT DE CONFIGURATION DE LA BASE DE DONNÉES POSTGRESQL (SUPABASE)
-- Cabinet d'Avocats KBB App
-- ==========================================

-- Désactivation temporaire des triggers pour le seeding propre
SET session_replication_role = 'replica';

-- Suppression des tables si elles existent déjà (pour réinitialisation propre)
DROP TABLE IF EXISTS referents CASCADE;
DROP TABLE IF EXISTS fournisseurs CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
DROP TABLE IF EXISTS personnel CASCADE;
DROP TABLE IF EXISTS personnels CASCADE;
DROP TABLE IF EXISTS avocats CASCADE;
DROP TABLE IF EXISTS event_reports CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS case_procedures CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- Réactivation du comportement normal des triggers
SET session_replication_role = 'origin';

-- Activation de l'extension UUID si requise
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------
-- 1. Table CLIENTS
-- -----------------------------------------------------
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255) NOT NULL,
    cases INTEGER DEFAULT 0,
    email VARCHAR(255),
    phone VARCHAR(50),
    secteur VARCHAR(100),
    siege VARCHAR(255),
    sieges TEXT[] DEFAULT '{}',
    dirigeant VARCHAR(255),
    ref1_nom VARCHAR(255),
    ref1_phone VARCHAR(50),
    ref1_email VARCHAR(255),
    ref2_nom VARCHAR(255),
    ref2_phone VARCHAR(50),
    ref2_email VARCHAR(255),
    type_facturation VARCHAR(100)
);

-- -----------------------------------------------------
-- 2. Table CASES (Dossiers)
-- -----------------------------------------------------
CREATE TABLE cases (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    client VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Nouveau', 'En cours', 'En attente', 'Clôturé')),
    next_hearing DATE,
    procedure VARCHAR(255),
    procedure_instance VARCHAR(255),
    procedure_objet VARCHAR(255),
    procedure_date_debut DATE,
    procedure_date_fin DATE,
    procedure_status VARCHAR(100),
    notes TEXT
);

-- -----------------------------------------------------
-- 3. Table CASE_PROCEDURES (Procédures d'un dossier)
-- -----------------------------------------------------
CREATE TABLE case_procedures (
    id VARCHAR(100) PRIMARY KEY,
    case_id VARCHAR(100) REFERENCES cases(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    instance VARCHAR(255),
    objet VARCHAR(255),
    date_debut DATE,
    date_fin DATE,
    status VARCHAR(100),
    linked_cases TEXT[] DEFAULT '{}'
);

-- -----------------------------------------------------
-- 4. Table EVENTS (Événements / Audiences)
-- -----------------------------------------------------
CREATE TABLE events (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Atelier', 'Conférence', 'Colloque', 'Séminaire', 'Autre')),
    date DATE NOT NULL,
    dates DATE[] DEFAULT '{}',
    lieu VARCHAR(255) NOT NULL,
    partenaires TEXT,
    co_organisateur VARCHAR(255),
    public_cible VARCHAR(255),
    membres_kbb TEXT,
    membres_externes TEXT,
    budget_previsionnel VARCHAR(100),
    budget_realise VARCHAR(100),
    frais_participation NUMERIC(15, 2) DEFAULT 0.00,
    autres_recettes NUMERIC(15, 2) DEFAULT 0.00,
    recettes_total NUMERIC(15, 2) DEFAULT 0.00,
    financement TEXT,
    financements JSONB DEFAULT '[]', -- [{label: "...", amount: "..."}]
    sponsors TEXT,
    photo_profil VARCHAR(255),
    pieces_jointes JSONB DEFAULT '[]' -- [{name: "...", size: "...", content: "..."}]
);

-- -----------------------------------------------------
-- 5. Table EVENT_REPORTS (Rapports d'événements)
-- -----------------------------------------------------
CREATE TABLE event_reports (
    id VARCHAR(100) PRIMARY KEY,
    event_id VARCHAR(100) REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    author VARCHAR(255),
    files JSONB DEFAULT '[]' -- [{name: "...", size: "..."}]
);

-- -----------------------------------------------------
-- 6. Table AVOCATS
-- -----------------------------------------------------
CREATE TABLE avocats (
    id VARCHAR(100) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    photo_url VARCHAR(255),
    first_oath_date DATE NOT NULL,
    second_oath_date DATE,
    ona_number VARCHAR(100) NOT NULL,
    cabinet_status VARCHAR(50) NOT NULL CHECK (cabinet_status IN ('Senior of counsel', 'Senior', 'Associé', 'Junior')),
    service_start_date DATE NOT NULL,
    service_status VARCHAR(50) NOT NULL CHECK (service_status IN ('Actif', 'Omis', 'Mise en disponibilité')),
    cabinet_role VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    emails TEXT[] DEFAULT '{}',
    disciplinary_measures TEXT,
    main_bar VARCHAR(100) CHECK (main_bar IN ('Kinshasa-Gombe', 'Kinshasa-Matete', 'Lualaba', 'Haut Katanga', 'Kwilu')),
    secondary_bar VARCHAR(100),
    barreaux TEXT[] DEFAULT '{}',
    marital_status VARCHAR(50) CHECK (marital_status IN ('Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf(ve)')),
    physical_address VARCHAR(255),
    has_children VARCHAR(3) CHECK (has_children IN ('Oui', 'Non')),
    children_count INTEGER DEFAULT 0
);

-- -----------------------------------------------------
-- 7. Table PERSONNELS (Agents administratifs)
-- Note: le pluriel "personnels" est utilisé car c'est le nom attendu par le code TypeScript (supabaseService.ts)
-- -----------------------------------------------------
CREATE TABLE personnels (
    id VARCHAR(100) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    service_start_date DATE NOT NULL,
    service_status VARCHAR(50) NOT NULL CHECK (service_status IN ('Actif', 'Inactif', 'Mise en disponibilité')),
    salary NUMERIC(15, 2) NOT NULL,
    marital_status VARCHAR(50) CHECK (marital_status IN ('Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf(ve)')),
    has_children VARCHAR(3) CHECK (has_children IN ('Oui', 'Non')),
    children_count INTEGER DEFAULT 0,
    address VARCHAR(255) NOT NULL,
    photo VARCHAR(255),
    disciplinary_measure TEXT,
    disciplinary_status VARCHAR(100)
);

-- -----------------------------------------------------
-- 8. Table BANK_ACCOUNTS (Comptes bancaires des avocats et personnels)
-- -----------------------------------------------------
CREATE TABLE bank_accounts (
    id SERIAL PRIMARY KEY,
    owner_id VARCHAR(100) NOT NULL,
    owner_type VARCHAR(20) NOT NULL CHECK (owner_type IN ('avocat', 'personnel')),
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    iban VARCHAR(100),
    swift VARCHAR(50)
);

-- -----------------------------------------------------
-- 9. Table TASKS (Tâches)
-- -----------------------------------------------------
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    case_id VARCHAR(100) REFERENCES cases(id) ON DELETE CASCADE,
    lawyer VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Effectué', 'Non effectué', 'Effectué à moitié')),
    notes TEXT,
    procedure_linked VARCHAR(255),
    procedure_linked_ids TEXT[] DEFAULT '{}',
    start_date DATE,
    end_date DATE,
    associated_lawyers TEXT[] DEFAULT '{}',
    rapport TEXT,
    reminder_enabled BOOLEAN DEFAULT FALSE,
    reminder_date DATE,
    reminder_time VARCHAR(20),
    reminder_sound VARCHAR(50) DEFAULT 'digital' CHECK (reminder_sound IN ('digital', 'bell', 'marimba', 'classic')),
    reminder_triggered BOOLEAN DEFAULT FALSE
);

-- -----------------------------------------------------
-- 10. Table INVOICES (Factures)
-- -----------------------------------------------------
CREATE TABLE invoices (
    id VARCHAR(100) PRIMARY KEY,
    case_id VARCHAR(100) REFERENCES cases(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    status VARCHAR(50) NOT NULL CHECK (status IN ('Réglée', 'Non réglée', 'En cours')),
    etiquette VARCHAR(255)
);

-- -----------------------------------------------------
-- 11. Table FOURNISSEURS
-- -----------------------------------------------------
CREATE TABLE fournisseurs (
    id VARCHAR(100) PRIMARY KEY,
    nom_complet VARCHAR(255) NOT NULL,
    logo VARCHAR(255),
    nature_prestation VARCHAR(50) NOT NULL CHECK (nature_prestation IN ('Bien', 'Services', 'Baie locative')),
    designation_prestation VARCHAR(255) NOT NULL,
    type_facturation VARCHAR(50) NOT NULL CHECK (type_facturation IN ('Périodique', 'Ponctuelle')),
    periode VARCHAR(50) CHECK (periode IN ('mensuel', 'trimestriel', 'Annuel')),
    montant NUMERIC(15, 2) NOT NULL CHECK (montant >= 0),
    adresse_physique VARCHAR(255) NOT NULL,
    adresse_mail VARCHAR(255) NOT NULL,
    dirigeant_principal VARCHAR(255) NOT NULL
);

-- -----------------------------------------------------
-- 12. Table REFERENTS (Contacts chez les fournisseurs)
-- -----------------------------------------------------
CREATE TABLE referents (
    id SERIAL PRIMARY KEY,
    fournisseur_id VARCHAR(100) REFERENCES fournisseurs(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL
);

-- ==========================================
-- ACTIVATION DE LA SÉCURITÉ AU NIVEAU DES LIGNES (RLS)
-- ==========================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE avocats ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referents ENABLE ROW LEVEL SECURITY;

-- Création des politiques d'accès pour les utilisateurs authentifiés
-- (Chaque utilisateur authentifié a un accès complet en lecture/écriture aux tables opérationnelles)
CREATE POLICY "Full access to authenticated users" ON clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to authenticated users" ON cases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to authenticated users" ON case_procedures FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to authenticated users" ON events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to authenticated users" ON event_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to authenticated users" ON avocats FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to authenticated users" ON personnels FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to authenticated users" ON bank_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to authenticated users" ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to authenticated users" ON invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to authenticated users" ON fournisseurs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access to authenticated users" ON referents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- SEEDING : JEU DE DONNÉES INITIALES (MOCK DATA)
-- ==========================================

-- Clients
INSERT INTO clients (id, name, contact, cases, email, phone, secteur, siege, dirigeant, type_facturation) VALUES
(1, 'Congo Invest SARL', 'Alain Mabiala', 2, 'contact@congoinvest.cd', '+243 812 345 678', 'Finance', 'Boulevard du 30 Juin, Gombe, Kinshasa', 'Alain Mabiala', 'Mensuel'),
(2, 'Kinshasa Digital Solutions', 'Pascaline Bongo', 1, 'info@kinshasadigital.com', '+243 898 765 432', 'Technologie', 'Avenue de la Justice, Gombe, Kinshasa', 'Pascaline Bongo', 'Forfaitaire'),
(3, 'Bâtir Congo Construction', 'Christine Okito', 5, 'contact@batircongo.cd', '+243 821 122 334', 'BTP / Immobilier', 'Zone Industrielle, Limete, Kinshasa', 'Christine Okito', 'Périodique'),
(4, 'Saveurs du Fleuve', 'Chantal Biya', 0, 'contact@saveursdufleuve.cd', '+243 854 433 221', 'Restauration', 'Avenue du Fleuve, Gombe, Kinshasa', 'Chantal Biya', 'Ponctuel');

-- Cases
INSERT INTO cases (id, name, client, status, next_hearing, notes) VALUES
('CI-2023-001', 'Litige commercial', 'Congo Invest SARL', 'En cours', '2024-09-15', 'Dossier complexe concernant un désaccord de facturation de prestations avec un sous-traitant. En attente de pièces comptables complémentaires.'),
('KDS-2023-012', 'Dépôt de brevet', 'Kinshasa Digital Solutions', 'En attente', NULL, 'Dépôt de marque et brevet technologique en cours d''examen auprès de l''ANAPI.'),
('BCC-2022-050', 'Contentieux immobilier', 'Bâtir Congo Construction', 'Clôturé', NULL, 'Litige foncier résolu par ordonnance de référé favorable. Frais de justice entièrement recouvrés.'),
('CI-2023-002', 'Recouvrement de créances', 'Congo Invest SARL', 'En cours', '2024-10-02', 'Mise en demeure infructueuse. Procédure d''injonction de payer lancée.');

-- Events
INSERT INTO events (id, name, type, date, lieu, partenaires) VALUES
('ATL-LC-01', 'Atelier d''échanges: Litige commercial', 'Atelier', '2024-09-15', 'Tribunal de Commerce', 'Barreau de la Gombe'),
('ATL-RC-02', 'Atelier pratique: Recouvrement de créances', 'Atelier', '2024-10-02', 'Tribunal Judiciaire', 'Banque Centrale'),
('CONF-DA-01', 'Conférence sur le Droit des Affaires', 'Conférence', '2024-11-20', 'Palais des Congrès', 'OHADA RDC'),
('COL-PI-01', 'Colloque: Propriété Intellectuelle', 'Colloque', '2024-12-05', 'Université de Kinshasa', 'ANAPI / OAPI');

-- Avocats
INSERT INTO avocats (id, full_name, photo_url, first_oath_date, second_oath_date, ona_number, cabinet_status, service_start_date, service_status, cabinet_role, phone, emails, main_bar, secondary_bar, marital_status, has_children, children_count) VALUES
('JLT-01', 'Jean-Luc Tshisekedi', '', '2010-01-15', NULL, 'ONA-12345', 'Associé', '2012-09-01', 'Actif', 'Avocat Associé', '0812345678', '{"jl.tshisekedi@cabinet.com"}', 'Kinshasa-Gombe', 'Haut Katanga', 'Marié(e)', 'Oui', 3),
('MCM-02', 'Marie-Claire Mobutu', '', '2018-05-20', NULL, 'ONA-67890', 'Senior', '2020-01-10', 'Actif', 'Avocate Collaboratrice', '0887654321', '{"mc.mobutu@cabinet.com"}', 'Haut Katanga', NULL, 'Célibataire', 'Non', 0),
('PL-03', 'Patrick Lumumba', '', '2022-07-01', NULL, 'ONA-11223', 'Junior', '2023-09-01', 'Actif', 'Avocat Stagiaire', '0811223344', '{"p.lumumba@cabinet.com"}', 'Kinshasa-Matete', 'Kwilu', 'Célibataire', 'Non', 0);

-- Tasks
INSERT INTO tasks (id, name, case_id, lawyer, due_date, status) VALUES
(1, 'Rédiger conclusions pour Congo Invest', 'CI-2023-001', 'Jean-Luc Tshisekedi', '2024-09-25', 'Non effectué'),
(2, 'Préparer audience Kinshasa Digital', 'KDS-2023-012', 'Marie-Claire Mobutu', '2024-10-10', 'Effectué à moitié'),
(3, 'Rechercher jurisprudence Bâtir Congo', 'BCC-2022-050', 'Patrick Lumumba', '2024-09-30', 'Effectué');

-- Invoices
INSERT INTO invoices (id, case_id, due_date, total_amount, paid_amount, status, etiquette) VALUES
('FACT-CI001-01', 'CI-2023-001', '2024-09-30', 2500.00, 2500.00, 'Réglée', 'Honoraires de Conseil'),
('FACT-KDS012-01', 'KDS-2023-012', '2024-10-15', 5000.00, 1000.00, 'En cours', 'Suivi contentieux fiscal'),
('FACT-CI002-01', 'CI-2023-002', '2024-10-20', 1200.00, 0.00, 'Non réglée', 'Rédaction Contrat de Travail');

-- Personnel
INSERT INTO personnels (id, full_name, role, email, phone, service_start_date, service_status, salary, marital_status, has_children, children_count, address, photo, disciplinary_measure, disciplinary_status) VALUES
('PERS-01', 'Félicité Kanku', 'Secrétaire', 'f.kanku@cabinet.com', '0815551234', '2021-03-15', 'Actif', 850.00, 'Marié(e)', 'Oui', 2, 'Av. de la Gombe 12, Kinshasa/Gombe', '', 'Aucune', 'Aucune'),
('PERS-02', 'Didier Mbenga', 'Assistant de direction', 'd.mbenga@cabinet.com', '0815555678', '2019-11-01', 'Actif', 1200.00, 'Célibataire', 'Non', 0, 'Bld du 30 Juin 45, Kinshasa/Gombe', '', 'Aucune', 'Aucune'),
('PERS-03', 'Arsène Lupungu', 'Intendant', 'a.lupungu@cabinet.com', '0815559012', '2023-05-10', 'Actif', 600.00, 'Célibataire', 'Non', 0, 'Av. Kisangani 104, Kinshasa/Lingwala', '', 'Avertissement écrit pour retards injustifiés', 'En cours');

-- Fournisseurs
INSERT INTO fournisseurs (id, nom_complet, nature_prestation, designation_prestation, type_facturation, periode, montant, adresse_physique, adresse_mail, dirigeant_principal) VALUES
('F-1', 'Congo Telecom Services', 'Services', 'Abonnement Internet Fibre Optique Haute Performance', 'Périodique', 'mensuel', 250.00, 'Boulevard du 30 Juin, Immeuble CCI, Gombe, Kinshasa', 'contact@congotel.cd', 'Augustin Kabeya'),
('F-2', 'Papeterie Moderne du Centre', 'Bien', 'Fournitures de bureau, papier d''impression et consommables', 'Ponctuelle', NULL, 450.00, 'Avenue de l''Équateur, Kinshasa/Gombe', 'commandes@papeteriemoderne.cd', 'Félix Muteba'),
('F-3', 'Securitas RDC', 'Services', 'Gardiennage et système d''alarme du cabinet', 'Périodique', 'trimestriel', 1800.00, 'Avenue du Flambeau, Zone Industrielle, Kinshasa', 'info@securitas.cd', 'John Smith');

-- Referents
INSERT INTO referents (fournisseur_id, nom, phone, email) VALUES
('F-1', 'Marc Maputa', '0812233445', 'm.maputa@congotel.cd'),
('F-1', 'Sarah Mbiya', '0898877665', 's.mbiya@congotel.cd'),
('F-2', 'Gisèle Ndolo', '0821122334', 'g.ndolo@papeteriemoderne.cd'),
('F-3', 'Capitaine Jean Lelo', '0854433221', 'j.lelo@securitas.cd');

-- Ajustement des séquences de clé primaire auto-incrémentées après insertion manuelle
SELECT setval('clients_id_seq', COALESCE((SELECT MAX(id)+1 FROM clients), 1), false);
SELECT setval('tasks_id_seq', COALESCE((SELECT MAX(id)+1 FROM tasks), 1), false);
SELECT setval('referents_id_seq', COALESCE((SELECT MAX(id)+1 FROM referents), 1), false);
SELECT setval('bank_accounts_id_seq', COALESCE((SELECT MAX(id)+1 FROM bank_accounts), 1), false);
SELECT setval('personnels_id_seq', COALESCE((SELECT MAX(id)+1 FROM personnels), 1), false);

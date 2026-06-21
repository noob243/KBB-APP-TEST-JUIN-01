// Ce fichier est un script de test pour diagnostiquer la connexion à Supabase.
// Il n'est PAS partie de l'application.
// Pour l'exécuter : node test-supabase.js

import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const SUPABASE_URL = 'https://krbksjyncnkicstpiybi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyYmtzanluY25raWNzdHBpeWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODI4NTMsImV4cCI6MjA5NzU1ODg1M30.pWZE5MZb3AwjpyoFUYoQTNmI-nbY1FNKduRjyx6sXW8';

// Correction : Appliquer l'option directement au client Realtime
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    transport: ws
  }
});

async function testConnection() {
  console.log('Tentative de connexion à la table "clients"...');
  
  // Test SANS realtime pour isoler le problème de base de données
  const { data, error } = await supabase.from('clients').select('*').limit(1);

  if (error) {
    console.error('ÉCHEC DE LA CONNEXION. Voici l\'erreur complète :');
    console.error(error);
    console.log('\n--- PISTES DE CORRECTION ---');
    console.log('1. URL ou Clé invalide ? Vérifiez chaque caractère.');
    console.log('2. Politiques RLS actives sur Supabase ?');

  } else {
    console.log('\x1b[32m%s\x1b[0m', 'CONNEXION RÉUSSIE !'); // En vert
    console.log('Données récupérées (1 client) :', data);
    console.log('\n--- DIAGNOSTIC ---');
    console.log('Vos clés Supabase sont CORRECTES.');
    console.log('Le problème vient de la configuration de Vercel ou des Politiques RLS de Supabase.');
  }
}

testConnection();

import { createClient } from '@supabase/supabase-js';

// Récupérer les variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Vérifier que les variables existent
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes:');
  console.error('  VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('  VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  
  if (import.meta.env.DEV) {
    console.warn('⚠️ Utilisation de valeurs par défaut pour le développement');
  } else {
    throw new Error(
      'Les variables d\'environnement Supabase sont manquantes. ' +
      'Vérifiez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans votre fichier .env'
    );
  }
}

// Créer le client Supabase
export const supabase = createClient(
  supabaseUrl as string || 'https://fake-url.supabase.co',
  supabaseAnonKey as string || 'fake-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'nida-auth',
    },
  }
);

// Optionnel : Exporter une fonction de vérification pour le débogage
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('❌ Erreur de connexion Supabase:', error.message);
      return false;
    }
    console.log('✅ Connexion Supabase établie');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion Supabase:', error);
    return false;
  }
};
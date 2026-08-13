import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // `.vite` et `dev-dist` contiennent des dépendances pré-empaquetées : les
  // analyser produisait des erreurs venant de code tiers, sans rapport avec le
  // projet. `supabase/functions` est du Deno, hors de cette configuration.
  { ignores: ['dist', 'dev-dist', '.vite', 'public', 'supabase/functions'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Un préfixe `_` marque une valeur volontairement écartée — typiquement
      // les champs retirés par déstructuration.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  }
);

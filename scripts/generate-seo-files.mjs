/**
 * Génère robots.txt et sitemap.xml avant la construction.
 *
 * Ces deux fichiers exigent des URL absolues : ils ne peuvent donc pas être
 * écrits une fois pour toutes sans connaître le domaine. Il est lu depuis
 * `VITE_SITE_URL`, à renseigner dans les variables d'environnement Vercel.
 *
 * Les pages listées sont celles ouvertes au public. L'administration, l'espace
 * cliente et les écrans d'authentification en sont écartés : ils n'ont aucun
 * intérêt en recherche et ne doivent pas être explorés.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = resolve(racine, 'public');

const site = (process.env.VITE_SITE_URL ?? '').trim().replace(/\/+$/, '');

if (!site) {
  console.warn(
    '\n⚠️  VITE_SITE_URL n\'est pas définie.\n' +
      '   robots.txt et sitemap.xml ne sont pas générés : un plan de site\n' +
      '   contenant de mauvaises URL nuit davantage que son absence.\n' +
      '   Renseignez-la dans Vercel → Settings → Environment Variables,\n' +
      '   par exemple https://www.harrys-studio.fr\n'
  );
  process.exit(0);
}

/** `changefreq` et `priority` reflètent le rythme réel de mise à jour. */
const pages = [
  { chemin: '/', priorite: '1.0', frequence: 'weekly' },
  { chemin: '/prestations', priorite: '0.9', frequence: 'weekly' },
  { chemin: '/reservation', priorite: '0.9', frequence: 'monthly' },
  { chemin: '/galerie', priorite: '0.8', frequence: 'weekly' },
  { chemin: '/avis', priorite: '0.8', frequence: 'weekly' },
  { chemin: '/disponibilites', priorite: '0.7', frequence: 'daily' },
  { chemin: '/contact', priorite: '0.7', frequence: 'monthly' },
  { chemin: '/mentions-legales', priorite: '0.2', frequence: 'yearly' },
  { chemin: '/confidentialite', priorite: '0.2', frequence: 'yearly' },
  { chemin: '/conditions', priorite: '0.2', frequence: 'yearly' },
];

const aujourdhui = new Date().toISOString().slice(0, 10);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${site}${p.chemin}</loc>
    <lastmod>${aujourdhui}</lastmod>
    <changefreq>${p.frequence}</changefreq>
    <priority>${p.priorite}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`.replace('www.sitemap.org', 'www.sitemaps.org');

const robots = `User-agent: *
Allow: /

# Espaces privés : aucun intérêt en recherche, et ne doivent pas être explorés.
Disallow: /admin
Disallow: /mon-espace
Disallow: /connexion
Disallow: /mot-de-passe-oublie
Disallow: /reinitialisation

Sitemap: ${site}/sitemap.xml
`;

mkdirSync(publicDir, { recursive: true });
writeFileSync(resolve(publicDir, 'sitemap.xml'), sitemap, 'utf-8');
writeFileSync(resolve(publicDir, 'robots.txt'), robots, 'utf-8');

console.log(`✓ robots.txt et sitemap.xml générés pour ${site} (${pages.length} pages)`);

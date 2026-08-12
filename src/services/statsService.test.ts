import { describe, it, expect } from 'vitest';
import {
  rowRevenue,
  rowServiceNames,
  parseLocalDate,
  buildDashboardStats,
  buildRevenueByMonth,
  buildServicePopularity,
  type AppointmentStatsRow,
} from './statsService';

/**
 * Les prestations vivent dans le JSONB `services`. Les colonnes héritées
 * `price` et `service_name` ont été reprises dans ce JSONB puis supprimées de
 * la table.
 */
const jsonbRow = (over: Partial<AppointmentStatsRow> = {}): AppointmentStatsRow => ({
  date: '2026-08-12',
  status: 'completed',
  services: [{ id: 's1', name: 'Pose gel', price: 60, duration: 120 }],
  ...over,
});

describe('rowRevenue', () => {
  it('additionne les prix du JSONB', () => {
    const row = jsonbRow({
      services: [
        { id: 'a', name: 'A', price: 60, duration: 60 },
        { id: 'b', name: 'B', price: 25, duration: 30 },
      ],
    });
    expect(rowRevenue(row)).toBe(85);
  });

  // C'est précisément le bug d'origine : `0 + null` vaut 0 en JavaScript, si
  // bien que le chiffre d'affaires tombait à zéro sans lever d'erreur.
  it('renvoie 0 plutôt que NaN quand les prestations sont absentes', () => {
    expect(rowRevenue(jsonbRow({ services: null }))).toBe(0);
    expect(rowRevenue(jsonbRow({ services: [] }))).toBe(0);
  });
});

describe('rowServiceNames', () => {
  it('liste chaque prestation du JSONB', () => {
    const row = jsonbRow({
      services: [
        { id: 'a', name: 'Pose gel', price: 60, duration: 60 },
        { id: 'b', name: 'Beauté des pieds', price: 25, duration: 45 },
      ],
    });
    expect(rowServiceNames(row)).toEqual(['Pose gel', 'Beauté des pieds']);
  });

  it('renvoie une liste vide quand rien n’est exploitable', () => {
    expect(rowServiceNames(jsonbRow({ services: null }))).toEqual([]);
  });
});

describe('parseLocalDate', () => {
  // `new Date('2026-08-31')` est interprété en UTC et peut basculer de mois
  // selon le fuseau, ce qui faussait les agrégats de fin de mois.
  it('interprète la date dans le fuseau local', () => {
    const d = parseLocalDate('2026-08-31');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7); // août
    expect(d.getDate()).toBe(31);
  });
});

describe('buildRevenueByMonth', () => {
  it('renvoie douze mois', () => {
    expect(buildRevenueByMonth([], 2026)).toHaveLength(12);
  });

  it('ventile les montants sur le bon mois', () => {
    const rows = [
      jsonbRow({ date: '2026-01-15' }),
      jsonbRow({ date: '2026-08-02' }),
    ];
    const result = buildRevenueByMonth(rows, 2026);
    expect(result[0]).toEqual({ label: 'Jan', value: 60 });
    expect(result[7]).toEqual({ label: 'Août', value: 60 });
  });

  // Le graphique porte douze cases « Jan » à « Déc » : sans borne d'année,
  // janvier 2025 et janvier 2026 s'additionnaient dans la même barre.
  it("ne mélange pas deux années dans la même case", () => {
    const rows = [
      jsonbRow({ date: '2025-01-15' }),
      jsonbRow({ date: '2026-01-20' }),
    ];
    expect(buildRevenueByMonth(rows, 2026)[0].value).toBe(60);
    expect(buildRevenueByMonth(rows, 2025)[0].value).toBe(60);
  });

  it('exclut les rendez-vous annulés', () => {
    const rows = [jsonbRow({ date: '2026-03-01', status: 'cancelled' })];
    expect(buildRevenueByMonth(rows, 2026)[2].value).toBe(0);
  });
});

describe('buildServicePopularity', () => {
  it('compte chaque prestation, pas chaque rendez-vous', () => {
    const rows = [
      jsonbRow({
        services: [
          { id: 'a', name: 'Pose gel', price: 60, duration: 60 },
          { id: 'b', name: 'Manucure', price: 25, duration: 30 },
        ],
      }),
      jsonbRow({ services: [{ id: 'a', name: 'Pose gel', price: 60, duration: 60 }] }),
    ];
    const result = buildServicePopularity(rows);
    expect(result[0]).toMatchObject({ name: 'Pose gel', count: 2 });
    expect(result[1]).toMatchObject({ name: 'Manucure', count: 1 });
  });

  it('renvoie un repère lisible en l’absence de données', () => {
    expect(buildServicePopularity([])).toEqual([
      { name: 'Aucune donnée', percentage: 100, count: 0 },
    ]);
  });
});

describe('buildDashboardStats', () => {
  const now = new Date(2026, 7, 12); // 12 août 2026

  it('calcule le chiffre du jour et du mois', () => {
    const rows = [
      jsonbRow({ date: '2026-08-12' }),
      jsonbRow({ date: '2026-08-03' }),
      jsonbRow({ date: '2026-07-30' }),
    ];
    const stats = buildDashboardStats(rows, 10, 0, now);
    expect(stats.dailyRevenue).toBe(60);
    expect(stats.monthlyRevenue).toBe(120);
  });

  it('compare la veille pour l’écart quotidien', () => {
    const rows = [
      jsonbRow({ date: '2026-08-12' }), // 60
      jsonbRow({ date: '2026-08-11', services: [{ id: 'x', name: 'X', price: 30, duration: 30 }] }),
    ];
    expect(buildDashboardStats(rows, 0, 0, now).dailyRevenueDelta).toBe('+100%');
  });

  it('affiche un écart négatif quand le chiffre recule', () => {
    const rows = [
      jsonbRow({ date: '2026-08-12', services: [{ id: 'x', name: 'X', price: 30, duration: 30 }] }),
      jsonbRow({ date: '2026-08-11' }), // 60
    ];
    expect(buildDashboardStats(rows, 0, 0, now).dailyRevenueDelta).toBe('-50%');
  });

  it('borne le mois précédent au même quantième', () => {
    const rows = [
      jsonbRow({ date: '2026-08-05' }), // mois en cours : 60
      jsonbRow({ date: '2026-07-05' }), // même période le mois d'avant : 60
      jsonbRow({ date: '2026-07-25' }), // au-delà du 12, ne doit pas compter
    ];
    expect(buildDashboardStats(rows, 0, 0, now).monthlyRevenueDelta).toBe('+0%');
  });

  it('exclut les annulations du chiffre d’affaires', () => {
    const rows = [
      jsonbRow({ date: '2026-08-12' }),
      jsonbRow({ date: '2026-08-12', status: 'cancelled' }),
    ];
    const stats = buildDashboardStats(rows, 0, 0, now);
    expect(stats.dailyRevenue).toBe(60);
    expect(stats.todayAppointmentsCount).toBe(1);
  });

  it('ne divise pas par zéro sans données', () => {
    const stats = buildDashboardStats([], 0, 0, now);
    expect(stats.averageBasket).toBe(0);
    expect(stats.cancellationRate).toBe(0);
    expect(stats.retentionRate).toBe(0);
    expect(stats.dailyRevenueDelta).toBe('+0%');
  });
});

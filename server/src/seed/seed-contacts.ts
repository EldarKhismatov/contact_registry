import type { Contact } from '../../../shared/src/index.js';

interface SeedRow {
  name: string;
  company: string;
  email: string;
  statusId: string;
  /** Сколько дней назад создана запись. */
  daysAgo: number;
}

const SEED_ROWS: SeedRow[] = [
  {
    name: 'Анна Ковалёва',
    company: 'ООО «Северный Ветер»',
    email: 'a.kovaleva@nordwind.ru',
    statusId: 'active',
    daysAgo: 2,
  },
  {
    name: 'Дмитрий Орлов',
    company: 'АО «Технопарк»',
    email: 'd.orlov@technopark.ru',
    statusId: 'in_progress',
    daysAgo: 5,
  },
  {
    name: 'Мария Соколова',
    company: 'ИП Соколова',
    email: '',
    statusId: 'new',
    daysAgo: 1,
  },
  {
    name: 'Игорь Лебедев',
    company: 'ООО «Гранит Софт»',
    email: 'i.lebedev@granit-soft.ru',
    statusId: 'approval',
    daysAgo: 9,
  },
  {
    name: 'Ольга Новикова',
    company: 'ООО «Северный Ветер»',
    email: 'o.novikova@nordwind.ru',
    statusId: 'on_hold',
    daysAgo: 14,
  },
  {
    name: 'Павел Виноградов',
    company: 'АО «Технопарк»',
    email: 'p.vinogradov@technopark.ru',
    statusId: 'blocked',
    daysAgo: 21,
  },
  {
    name: 'Екатерина Белова',
    company: 'ООО «Логистик Плюс»',
    email: 'e.belova@logistic-plus.ru',
    statusId: 'active',
    daysAgo: 28,
  },
  {
    name: 'Сергей Кузнецов',
    company: 'АО «Ромашка-Фарм»',
    email: 's.kuznetsov@romashka-pharm.ru',
    statusId: 'rejected',
    daysAgo: 35,
  },
  {
    name: 'Евгения Морозова',
    company: 'ООО «Логистик Плюс»',
    email: 'e.morozova@logistic-plus.ru',
    statusId: 'archived',
    daysAgo: 42,
  },
  {
    name: 'Артём Волков',
    company: 'ИП Волков',
    email: 'a.volkov@mail.ru',
    statusId: 'unknown',
    daysAgo: 56,
  },
  {
    name: 'Наталья Зайцева',
    company: 'АО «Ромашка-Фарм»',
    email: 'n.zaytseva@romashka-pharm.ru',
    statusId: 'new',
    daysAgo: 63,
  },
  {
    name: 'Роман Фёдоров',
    company: 'ООО «Гранит Софт»',
    email: 'r.fedorov@granit-soft.ru',
    statusId: 'deleted',
    daysAgo: 90,
  },
];

function isoDaysAgo(days: number, offsetMinutes = 0): string {
  const timestamp = Date.now() - days * 24 * 60 * 60 * 1000 - offsetMinutes * 60 * 1000;

  return new Date(timestamp).toISOString();
}

/** Стартовый набор данных, чтобы список не был пустым при первом запуске. */
export function createSeedContacts(): Contact[] {
  return SEED_ROWS.map((row, index) => {
    const createdAt = isoDaysAgo(row.daysAgo, index * 7);

    return {
      id: `seed-${index + 1}`,
      name: row.name,
      company: row.company,
      email: row.email,
      statusId: row.statusId,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

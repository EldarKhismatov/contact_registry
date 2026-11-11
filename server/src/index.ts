import { createApp } from './app.js';
import { config } from './config.js';
import { createContactsRepository } from './repositories/index.js';
import { createSeedContacts } from './seed/seed-contacts.js';

async function bootstrap(): Promise<void> {
  const repository = await createContactsRepository({
    storage: config.storage,
    dataFile: config.dataFile,
    seed: createSeedContacts(),
  });

  const app = createApp({ repository, allowedOrigins: config.allowedOrigins });

  app.listen(config.port, () => {
    console.log(`API готово: http://localhost:${config.port}/api`);
    console.log(`Хранилище: ${config.storage}${config.storage === 'json' ? ` (${config.dataFile})` : ''}`);
  });
}

bootstrap().catch((error: unknown) => {
  console.error('Не удалось запустить сервер:', error);
  process.exit(1);
});

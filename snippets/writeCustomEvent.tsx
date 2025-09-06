// @ts-ignore
import { writeCustomEvent } from '@builder/sdk';
import { Debug } from '../lib/debug.lib';

// Идентификатор события в ReFunnels
const CUSTOM_EVENT_ID = 'CLFyj1mLKk';

// Настройка дебага: глобальный уровень и префикс
Debug.configure({ level: 'info', prefix: '[events/writeCustomEvent]' });

const stringify = (data: unknown): string => {
  try { return JSON.stringify(data); } catch { return '[Unserializable]'; }
};

// POST обработчик для получения данных формы
app.post('/', async (ctx, req) => {
  try {
    const startedAt = Date.now();

    // Извлекаем user_id из cookie x-chtm-uid
    const headers = req?.headers || {};
    const rawCookie = headers.cookie || '';
    const userId = (() => {
      try {
        const pairs = rawCookie.split(';');
        for (const pair of pairs) {
          const [name, ...rest] = pair.trim().split('=');
          if (name === 'x-chtm-uid') return rest.join('=');
        }
        return undefined;
      } catch {
        return undefined;
      }
    })();

    if (userId) {
      Debug.info(ctx, `Найден user_id из cookie: ${userId}`);
    } else {
      Debug.warn(ctx, 'Cookie x-chtm-uid не найдено или пусто');
    }

    // Получаем данные из тела запроса
    const formData = req.body || {};
    Debug.info(ctx, `Старт обработки запроса. Body: ${stringify(formData)}`);

    // Преобразуем все значения в строки для customData
    const tilda_data: Record<string, string> = {};
    for (const [key, value] of Object.entries(formData)) {
      if (value !== null && value !== undefined) {
        tilda_data[key] = String(value);
      }
    }
    Debug.info(ctx, `Сформирована карта параметров (${Object.keys(tilda_data).length} шт).`);
    Debug.info(ctx, `tilda_data: ${stringify(tilda_data)}`);

    // Диагностика запроса
    const query = (req?.query || {}) as Record<string, string | string[] | undefined>;
    const params = req?.params || {};
    const userAgent = headers['user-agent'];
    const referrer = headers['referer'] || headers['referrer'];
    const xff = headers['x-forwarded-for'];

    Debug.info(ctx, `Request url: ${req?.url || ''}`);
    Debug.info(ctx, `Headers: ${stringify(headers)}`);
    Debug.info(ctx, `Cookies(raw): ${rawCookie}`);
    Debug.info(ctx, `Query: ${stringify(query)}`);
    Debug.info(ctx, `Params: ${stringify(params)}`);
    Debug.info(ctx, `UA: ${stringify(userAgent)} Referrer: ${stringify(referrer)} XFF: ${stringify(xff)}`);
    Debug.info(ctx, `UserId (from cookie): ${stringify(userId)}`);

    // Отправляем кастомное событие в билдер
    Debug.info(ctx, `Отправка writeCustomEvent. code: ${CUSTOM_EVENT_ID}`);
    await writeCustomEvent(ctx, CUSTOM_EVENT_ID, {
      customData: {
        uid: userId,
        ...tilda_data,
      },
    });

    Debug.info(ctx, `writeCustomEvent успешно выполнен за ${Date.now() - startedAt} мс`);
    return { success: true, message: 'Data processed successfully' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    Debug.error(ctx, `Ошибка обработки данных формы: ${message}`, 'WRITE_CUSTOM_EVENT_ERROR');

    if ((error as Error)?.stack) {
      Debug.error(ctx, `Stack: ${(error as Error).stack}`, 'STACK');
    }

    Debug.warn(
      ctx,
      `Body при ошибке: ${(() => { try { return JSON.stringify(req?.body); } catch { return '[Unserializable]'; } })()}`,
    );

    return { success: false, error: 'Failed to process data' };
  }
});

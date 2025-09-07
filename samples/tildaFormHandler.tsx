// @ts-ignore
import { writeCustomEvent } from '@builder/sdk';
import { Debug } from '../lib/debug.lib';

/** Идентификатор события в ReFunnels */
const CUSTOM_EVENT_ID = 'TildaFormHandler';

/** Глобальная настройка логгера */
Debug.configure({ level: 'info', prefix: '[events/TildaFormHandler]' });

/**
 * Безопасная сериализация данных в JSON строку для отладки.
 * В случае ошибки сериализации возвращает строку '[Unserializable]'.
 * @param data - Данные для сериализации (любого типа)
 * @returns JSON строка или '[Unserializable]' при ошибке
 */
const stringify = (data: unknown): string => {
  try { return JSON.stringify(data); } catch { return '[Unserializable]'; }
};

/**
 * Возвращает значение cookie по имени из строки cookies Tilda.
 * Строка может быть URL-кодирована; делаем ровно одну попытку декодирования.
 * @param cookieList Строка из поля COOKIES тела запроса Tilda
 * @param name Имя cookie (например, 'x-chtm-uid')
 */
const getCookieFromTilda = (cookieList: string, name: string): string | undefined => {
  const raw = (() => { try { return decodeURIComponent(cookieList); } catch { return cookieList; } })();
  const pairs = raw.split(';');
  for (const pair of pairs) {
    const [k, ...rest] = pair.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return undefined;
};

// POST обработчик для получения данных формы из Tilda
app.post('/', async (ctx, req) => {
  const startedAt = Date.now();

  try {
    Debug.info(ctx, `Старт обработки: ${req?.method || 'POST'} ${req?.url || '/'}`);

    // 1) Тело запроса в x-www-form-urlencoded (Tilda)
    const formData = (req?.body || {}) as Record<string, unknown>;

    // 2) Извлечение uid ИСКЛЮЧИТЕЛЬНО из поля COOKIES (специфика Tilda)
    const cookiesStr = String(formData['COOKIES'] ?? '');
    const userId = getCookieFromTilda(cookiesStr, 'x-chtm-uid');

    if (!userId) {
      throw Debug.throw(ctx, 'UID не найден: включите «Посылать Cookie» в Webhook Tilda и убедитесь, что в COOKIES присутствует x-chtm-uid', 'E_NO_UID');
    }
    Debug.info(ctx, `UID из COOKIES: ${userId}`);

    // 3) Приводим значения к строкам (по спецификации Tilda), исключая COOKIES
    const form_data: Record<string, string> = {};
    for (const [key, value] of Object.entries(formData)) {
      if (key !== 'COOKIES' && value !== null && value !== undefined) {
        form_data[key] = String(value);
      }
    }

    // 4) Мини-телеметрия
    const keys = Object.keys(form_data);
    const preview = keys.slice(0, 12).join(', ') + (keys.length > 12 ? ', …' : '');
    Debug.info(ctx, `Нормализовано полей: ${keys.length}${keys.length ? `; keys: ${preview}` : ''}`);

    // 5) Отправка события в ReFunnels
    Debug.info(ctx, `writeCustomEvent → ${CUSTOM_EVENT_ID}`);
    await writeCustomEvent(ctx, CUSTOM_EVENT_ID, { uid: userId, customData: { form_data } });

    Debug.info(ctx, `Готово за ${Date.now() - startedAt} мс`);
    return { success: true, message: 'Data processed successfully' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    Debug.error(ctx, `Ошибка обработки: ${message}`, 'WRITE_CUSTOM_EVENT_ERROR');
    if ((error as Error)?.stack) Debug.error(ctx, `Stack: ${(error as Error).stack}`, 'STACK');

    // Короткий дамп тела для расследования
    Debug.warn(ctx, `Body(raw): ${stringify(req?.body)}`);

    return { success: false, error: 'Failed to process data' };
  }
});

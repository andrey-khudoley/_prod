/**
 * Debug — логгер/ошибочник для Chatium.
 *
 * @example Инициализация
 * Debug.configure({ level: 'info', prefix: '[events/writeMetricEvent]' });
 *
 * @example Инфо/варн
 * Debug.info(ctx, 'Старт');
 * Debug.warn(ctx, 'Неполные данные');
 *
 * @example Ошибка без выброса
 * Debug.error(ctx, 'Не удалось записать событие', 'E_WRITE');
 *
 * @example Выброс ошибки
 * throw Debug.throw(ctx, 'Критическая ошибка', 'E_FATAL');
 */
export type DebugLevel = 'info' | 'warn' | 'error';

export class Debug extends Error {
  /** Префикс для серверных логов (должен быть в скобках, например: "[DEBUG]"). */
  static logPrefix: string = '[DEBUG]';

  /** Глобальный порог логирования. */
  private static globalLevel: DebugLevel = 'error';

  /** Установить глобальные параметры. */
  static configure(opts: { level?: DebugLevel; prefix?: string } = {}): void {
    if (opts.level) Debug.globalLevel = opts.level;
    if (opts.prefix) Debug.logPrefix = opts.prefix;
  }

  /** Установить глобальный уровень. */
  static setLevel(level: DebugLevel): void {
    Debug.globalLevel = level;
  }

  /** Установить префикс серверных логов. */
  static setLogPrefix(prefix: string): void {
    Debug.logPrefix = prefix;
  }

  /** Лог уровня `info`. */
  static info(ctx: RichUgcCtx, message: string): void {
    // eslint-disable-next-line no-new
    new Debug(ctx, message, 'info');
  }

  /** Лог уровня `warn`. */
  static warn(ctx: RichUgcCtx, message: string): void {
    // eslint-disable-next-line no-new
    new Debug(ctx, message, 'warn');
  }

  /** Лог уровня `error` без выброса. */
  static error(ctx: RichUgcCtx, message: string, code?: string): Debug {
    return new Debug(ctx, message, 'error', code);
  }

  /** Выброс ошибки. */
  static throw(ctx: RichUgcCtx, message: string, code?: string): never {
    throw new Debug(ctx, message, 'error', code);
  }

  /** Код ошибки (если ошибка выброшена). */
  code?: string;

  /** Конструктор: (ctx, message, level?, code?). */
  constructor(ctx: RichUgcCtx, message: string, level: DebugLevel = 'error', code?: string) {
    super(message);
    this.name = 'Debug';
    this.code = code;

    if (Debug.shouldLog(Debug.globalLevel, level)) {
      this.write(ctx, message, level, code);
    }
  }

  /** Проверка порога логирования. */
  private static shouldLog(configLevel: DebugLevel, level: DebugLevel): boolean {
    const order: DebugLevel[] = ['info', 'warn', 'error'];
    return order.indexOf(level) >= order.indexOf(configLevel);
  }

  /** Запись в `ctx.log` и `ctx.account.log`. */
  private write(ctx: RichUgcCtx, message: string, level: DebugLevel, code?: string): void {
    const ts = new Date().toISOString();
    const head = `[${level.toUpperCase()}][${ts}]${code ? `[${code}]` : ''}`;
    const line = `${head}: ${message}`;

    try { ctx.log(line); } catch {}
    try { ctx.account?.log?.(`${Debug.logPrefix}${line}`); } catch {}
  }
}

import { jsx } from '@app/html-jsx'

interface HtmlLayoutProps {
  title?: string
}

function HtmlLayout(props: HtmlLayoutProps, ...children: any) {
  return (
    <html>
      <head>{props.title && <title>{props.title}</title>}</head>
      <body>{children}</body>
    </html>
  )
}

// Список доступных модулей с функциями импорта
const modules = [
  { name: "@app/account", importer: () => import('@app/account') },
  { name: "@app/account/domain", importer: () => import('@app/account/domain') },
  { name: "@app/app/global", importer: () => import('@app/app/global') },
  { name: "@app/ui", importer: () => import('@app/ui') },
  { name: "@app/auth", importer: () => import('@app/auth') },
  { name: "@app/errors", importer: () => import('@app/errors') },
  { name: "@app/auth/provider", importer: () => import('@app/auth/provider') },
  { name: "@app/jobs", importer: () => import('@app/jobs') },
  { name: "@app/ui/styles", importer: () => import('@app/ui/styles') },
  { name: "@app/feed", importer: () => import('@app/feed') },
  { name: "@app/heap", importer: () => import('@app/heap') },
  { name: "@app/mobile-app", importer: () => import('@app/mobile-app') },
  { name: "@app/i18n", importer: () => import('@app/i18n') },
  { name: "@app/iap", importer: () => import('@app/iap') },
  { name: "@app/nanoid", importer: () => import('@app/nanoid') },
  { name: "@app/request", importer: () => import('@app/request') },
  { name: "@app/responsive", importer: () => import('@app/responsive') },
  { name: "@app/socket", importer: () => import('@app/socket') },
  { name: "@app/sync", importer: () => import('@app/sync') },
  { name: "@app/storage", importer: () => import('@app/storage') },
  { name: "@app/inbox", importer: () => import('@app/inbox') },
  { name: "@app/users", importer: () => import('@app/users') },
  { name: "@app/app", importer: () => import('@app/app') },
  { name: "@app/html", importer: () => import('@app/html') },
  { name: "@app/form-storage", importer: () => import('@app/form-storage') },
  { name: "@app/hooks", importer: () => import('@app/hooks') },
  { name: "@app/solid-js", importer: () => import('@app/solid-js') },
  { name: "@app/solid-js/store", importer: () => import('@app/solid-js/store') },
  { name: "@app/solid-js/web", importer: () => import('@app/solid-js/web') },
  { name: "@app/isolated-eval", importer: () => import('@app/isolated-eval') },
  { name: "@app/metric", importer: () => import('@app/metric') },
  { name: "@app/ugc", importer: () => import('@app/ugc') },
  { name: "@getcourse/sdk", importer: () => import('@getcourse/sdk') },
  { name: "@npm/date-fns", importer: () => import('@npm/date-fns') },
  { name: "@npm/date-fns-tz", importer: () => import('@npm/date-fns-tz') },
  { name: "@npm/date-fns/locale", importer: () => import('@npm/date-fns/locale') },
  { name: "@solid/solid-router", importer: () => import('@solid/solid-router') },
  { name: "@solid/solid-flow", importer: () => import('@solid/solid-flow') },
  { name: "@solid/ui", importer: () => import('@solid/ui') },
  { name: "@rapidapi/youtube", importer: () => import('@rapidapi/youtube') },
  { name: "@templates/sdk", importer: () => import('@templates/sdk') },
  { name: "@chatium/json", importer: () => import('@chatium/json') },
  { name: "@chatium/storage", importer: () => import('@chatium/storage') },
  { name: "@builder/sdk", importer: () => import('@builder/sdk') }
]

app.html('/', async (ctx, req) => {
  const moduleName = req.query.module
  const methodName = req.query.method

  if (moduleName) {
    try {
      const module = await importModule(moduleName)
      if (methodName) {
        const method = module[methodName]
        if (method) {
          return (
            <HtmlLayout title={`Информация о методе ${methodName} модуля ${moduleName}`}>
              <h1>Информация о методе {methodName} модуля {moduleName}</h1>
              {displayMethodInfo(method, methodName)}
            </HtmlLayout>
          )
        } else {
          return (
            <HtmlLayout title={`Ошибка`}>
              <h1>Метод {methodName} не найден в модуле {moduleName}</h1>
              {listMethods(module, moduleName)}
            </HtmlLayout>
          )
        }
      } else {
        return (
          <HtmlLayout title={`Структура модуля ${moduleName}`}>
            <h1>Структура модуля {moduleName}</h1>
            {listMethods(module, moduleName)}
          </HtmlLayout>
        )
      }
    } catch (error) {
      return (
        <HtmlLayout title="Ошибка">
          <h1>Ошибка загрузки модуля</h1>
          <p>{error.message}</p>
          <h2>Список доступных модулей</h2>
          <ul>
            {modules.map((mod) => (
              <li key={mod.name}>
                <a href={`?module=${encodeURIComponent(mod.name)}`}>{mod.name}</a>
              </li>
            ))}
          </ul>
        </HtmlLayout>
      )
    }
  } else {
    return (
      <HtmlLayout title="Список модулей">
        <h1>Список доступных модулей</h1>
        <ul>
          {modules.map((mod) => (
            <li key={mod.name}>
              <a href={`?module=${encodeURIComponent(mod.name)}`}>{mod.name}</a>
            </li>
          ))}
        </ul>
      </HtmlLayout>
    )
  }
})

async function importModule(moduleName: string) {
  const moduleEntry = modules.find(mod => mod.name === moduleName)
  if (!moduleEntry) {
    throw new Error(`Модуль ${moduleName} не найден или недоступен`)
  }
  try {
    const module = await moduleEntry.importer()
    return module
  } catch (error) {
    throw new Error(`Ошибка при импорте модуля ${moduleName}: ${error.message}`)
  }
}

function listMethods(module: any, moduleName: string) {
  const methods = Object.keys(module)
  return (
    <div>
      <h2>Методы модуля:</h2>
      <ul>
        {methods.length > 0 ? (
          methods.map((method) => (
            <li key={method}>
              <a href={`?module=${encodeURIComponent(moduleName)}&method=${encodeURIComponent(method)}`}>
                {method}: {typeof module[method]}
              </a>
            </li>
          ))
        ) : (
          <li>Модуль не содержит экспортируемых методов</li>
        )}
      </ul>
    </div>
  )
}

function displayMethodInfo(method: any, methodName: string) {
  return (
    <div>
      <h2>Детали метода {methodName}:</h2>
      <p>Тип: {typeof method}</p>
      {typeof method === 'function' ? (
        <pre>{method.toString()}</pre>
      ) : (
        <pre>{JSON.stringify(method, null, 2)}</pre>
      )}
    </div>
  )
}

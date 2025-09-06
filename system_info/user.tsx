import { requireAnyUser } from '@app/auth'
import { jsx } from '@app/html-jsx'
import { getGcUserData, GetGcUserDataParams } from '@getcourse/sdk'

interface HtmlLayoutProps {
  title?: string
}

function HtmlLayout(props: HtmlLayoutProps, ...children: any[]) {
  return (
    <html>
      <head>{props.title && <title>{props.title}</title>}</head>
      <body>{children}</body>
    </html>
  )
}

// Безопасный вывод любого объекта как <pre>JSON</pre>
function PreJson(props: { data: unknown; spaces?: number }) {
  const { data, spaces = 2 } = props
  let text = ''
  try {
    text = JSON.stringify(data, null, spaces)
  } catch {
    text = 'Ошибка: Некорректный JSON'
  }
  return <pre>{text}</pre>
}

interface CtmUser {
  id: string
  confirmedEmail?: string
  [k: string]: unknown
}

/** Извлекает числовой GC id из строки вида "565681:265475720" */
function extractNumericGcId(rawId: unknown): number | null {
  if (typeof rawId !== 'string') return null
  const part = rawId.split(':').pop()
  if (!part) return null
  const n = Number(part)
  return Number.isFinite(n) ? n : null
}

app.html('/', async (ctx: any) => {
  const ctmUser = (await requireAnyUser(ctx)) as CtmUser

  // Готовим параметры для getGcUserData:
  // 1) пробуем GC id из хвоста после ":", 2) если нет — используем email
  let params: GetGcUserDataParams | null = null

  const gcId = extractNumericGcId(ctmUser.id)
  if (gcId) {
    params = { id: gcId }
  } else if (ctmUser.confirmedEmail) {
    params = { email: ctmUser.confirmedEmail }
  }

  if (!params) {
    return (
      <HtmlLayout title="GC user: не удалось определить идентификатор">
        <h1>Не удалось определить пользователя GetCourse</h1>
        <p>
          Ожидался формат <code>ctx.user.id = "accountId:gcUserId"</code> или наличие{' '}
          <code>confirmedEmail</code> у пользователя.
        </p>
        <h2>Текущий Chatium user</h2>
        <PreJson data={ctmUser} />
      </HtmlLayout>
    )
  }

  try {
    const gcData = await getGcUserData(ctx, params)

    if (!gcData) {
      return (
        <HtmlLayout title="getGcUserData: пустой ответ">
          <h1>getGcUserData вернул null</h1>
          <p>Проверьте корректность переданных параметров.</p>
          <h2>Параметры вызова</h2>
          <PreJson data={params} />
          <h2>Текущий Chatium user (для справки)</h2>
          <PreJson data={ctmUser} />
        </HtmlLayout>
      )
    }

    return (
      <HtmlLayout title="Данные пользователя из GetCourse">
        <h1>getGcUserData</h1>
        <p>
          Параметры вызова:{' '}
          <code>{'id' in params ? `id=${params.id}` : `email=${params.email}`}</code>
        </p>
        <PreJson data={gcData} />
        <hr />
        <h2>Текущий Chatium user (для справки)</h2>
        <PreJson data={ctmUser} />
      </HtmlLayout>
    )
  } catch (error: any) {
    return (
      <HtmlLayout title="getGcUserData: ошибка">
        <h1>Ошибка при вызове getGcUserData</h1>
        <PreJson data={{ message: error?.message, stack: error?.stack, params }} />
        <h2>Текущий Chatium user (для справки)</h2>
        <PreJson data={ctmUser} />
      </HtmlLayout>
    )
  }
})

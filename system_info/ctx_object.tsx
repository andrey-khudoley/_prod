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

app.html('/', async ctx => {
  const date = new Date().toISOString().slice(0, 19).replace('T', ' ')

  return (
    <HtmlLayout title={'Заголовок страницы'}>
      <h1>Структура контекста</h1>
      <p>{jsonToPreHtml(ctx)}</p>
    </HtmlLayout>
  )
})

function jsonToPreHtml(json: Record<string, unknown>, spaces = 2) {
    try {
        const jsonString = JSON.stringify(json, null, spaces);
        return `<pre>${jsonString}</pre>`;
    } catch (error) {
        return "<pre>Ошибка: Некорректный JSON</pre>";
    }
}
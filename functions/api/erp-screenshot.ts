export const onRequestPost: PagesFunction = async ({ request }) => {
  const { url, selector, token } = await request.json() as any

  const resp = await fetch('https://erp-server-xsji.onrender.com/screenshot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, selector, token }),
  })

  const data = await resp.json()
  return Response.json(data)
}

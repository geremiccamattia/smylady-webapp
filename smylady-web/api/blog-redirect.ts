export const config = {
  runtime: 'edge',
}

export default function handler(request: Request) {
  const url = new URL(request.url)
  const blogPath = url.pathname.replace('/blog', '') || '/'
  return Response.redirect(`https://blog.shareyourparty.de${blogPath}${url.search}`, 301)
}

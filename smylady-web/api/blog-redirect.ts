import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const path = req.url?.replace('/blog', '') || '/'
  res.redirect(301, `https://blog.shareyourparty.de${path}`)
}

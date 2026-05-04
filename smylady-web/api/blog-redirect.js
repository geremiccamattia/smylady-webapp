export default function handler(req, res) {
  const path = req.url?.replace('/blog', '') || '/'
  res.redirect(301, `https://blog.shareyourparty.de${path}`)
}

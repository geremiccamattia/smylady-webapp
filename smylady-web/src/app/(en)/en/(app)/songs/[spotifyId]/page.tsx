import SongDetail from '@/views/SongDetail'

interface Props {
  params: Promise<{ spotifyId: string }>
}

export default async function SongPageEN({ params }: Props) {
  const { spotifyId } = await params
  return <SongDetail spotifyId={spotifyId} />
}

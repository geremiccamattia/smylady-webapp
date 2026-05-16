import type { Metadata } from 'next'
import UserProfileClient from '@/views/UserProfile'

interface Props {
  params: Promise<{ userId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params
  // Optional: User-Daten fetchen für dynamischen Titel
  // const user = await usersService.getPublicProfile(userId)
  // return { title: user.name }
  return { title: 'Organizer Profil' }
}

export default async function UserProfilePage({ params }: Props) {
  const { userId } = await params
  return <UserProfileClient userId={userId} />
}

import type { Metadata } from 'next'
import PostDetailClient from '@/views/PostDetail'

interface Props {
  params: Promise<{ postId: string }>
}

export const metadata: Metadata = { title: 'Post' }

export default async function PostDetailPage({ params }: Props) {
  const { postId } = await params
  return <PostDetailClient postId={postId} />
}

import { Suspense } from 'react'
import UserList from '@/views/UserList'

export default function UserListPage() {
  return (
    <Suspense>
      <UserList />
    </Suspense>
  )
}

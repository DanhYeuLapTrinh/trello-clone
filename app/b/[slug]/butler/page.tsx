import { checkBoardPermission } from '@/features/boards/queries'
import { notFound } from 'next/navigation'

export default async function BoardButlerPage({ params }: { params: { slug: string } }) {
  const { slug } = await params

  const canCreateButler = await checkBoardPermission(slug)

  if (!canCreateButler) {
    return notFound()
  }

  return <div>To be implemented</div>
}

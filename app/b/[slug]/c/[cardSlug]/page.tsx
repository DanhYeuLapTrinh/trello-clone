export default async function CardDetailPage({ params }: { params: Promise<{ cardSlug: string }> }) {
  const { cardSlug } = await params

  return (
    <div>
      <p>{cardSlug}</p>
      <p>To be implemented</p>
    </div>
  )
}

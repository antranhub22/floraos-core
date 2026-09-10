import { ComingSoon } from "@/components/layout/coming-soon"

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ComingSoon title={`Job #${id}`} />
}

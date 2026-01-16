import Container from '@/components/layout/Container'
import WeddingPrepTable from '@/components/wedding-prep/WeddingPrepTable'

export default function WeddingPrepPage() {
  return (
    <Container maxWidth="full" className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">결혼 준비</h1>
      </div>

      <WeddingPrepTable />
    </Container>
  )
}

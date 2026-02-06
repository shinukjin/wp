import Container from '@/components/layout/Container'
import RealEstateTable from '@/components/real-estate/RealEstateTable'

export default function RealEstatePage() {
  return (
    <Container maxWidth="full" className="py-4 sm:py-6 lg:py-8">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">부동산</h1>
      </div>

      <RealEstateTable />
    </Container>
  )
}

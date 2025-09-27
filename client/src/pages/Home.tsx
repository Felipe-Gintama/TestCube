import React from 'react'
import Card from '../components/Card'
import { useTestCases } from '../modules/testCases/useTestCases'

const Home: React.FC = () => {
  const { cases, loading, error } = useTestCases()

  if (loading) return <p>Ładowanie...</p>
  if (error) return <p>Błąd: {error}</p>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test Cases</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cases.map(tc => (
          <Card key={tc.id} title={tc.title} description={tc.description} />
        ))}
      </div>
    </div>
  )
}

export default Home

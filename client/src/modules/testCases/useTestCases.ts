import { useState, useEffect } from 'react'
import { fetchTestCases } from './testCaseAPI'

export const useTestCases = () => {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTestCases()
      .then(setCases)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return { cases, loading, error }
}

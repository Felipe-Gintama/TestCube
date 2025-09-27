export const fetchTestCases = async () => {
  const res = await fetch('http://localhost:4000/testcases')
  if (!res.ok) throw new Error('Błąd pobierania test cases')
  return res.json()
}

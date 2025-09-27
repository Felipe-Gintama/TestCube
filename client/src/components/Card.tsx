import React from 'react'

interface CardProps {
  title: string
  description?: string
}

const Card: React.FC<CardProps> = ({ title, description }) => {
  return (
    <div className="border rounded p-4 shadow hover:shadow-lg transition">
      <h2 className="font-bold text-lg">{title}</h2>
      {description && <p className="mt-2 text-gray-600">{description}</p>}
    </div>
  )
}

export default Card

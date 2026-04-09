export const categories = [
  { id: 1, name: "Home Services", emoji: "🏠", color: "#3B82F6", gradient: "linear-gradient(135deg, #3B82F6, #2563EB)" },
  { id: 2, name: "Beauty & Care", emoji: "💆", color: "#EC4899", gradient: "linear-gradient(135deg, #EC4899, #DB2777)" },
  { id: 3, name: "Education", emoji: "📚", color: "#3B82F6", gradient: "linear-gradient(135deg, #3B82F6, #2563EB)" },
  { id: 4, name: "Healthcare", emoji: "🏥", color: "#22C55E", gradient: "linear-gradient(135deg, #22C55E, #16A34A)" },
  { id: 5, name: "Transport", emoji: "🚗", color: "#F59E0B", gradient: "linear-gradient(135deg, #F59E0B, #D97706)" },
  { id: 6, name: "Events & Media", emoji: "🎉", color: "#8B5CF6", gradient: "linear-gradient(135deg, #8B5CF6, #7C3AED)" },
  { id: 7, name: "Arts", emoji: "🎨", color: "#EC4899", gradient: "linear-gradient(135deg, #EC4899, #DB2777)" },
  { id: 8, name: "Food & Kitchen", emoji: "🍽️", color: "#F59E0B", gradient: "linear-gradient(135deg, #F59E0B, #D97706)" },
  { id: 9, name: "NRI Services", emoji: "✈️", color: "#14B8A6", gradient: "linear-gradient(135deg, #14B8A6, #0D9488)" },
  { id: 10, name: "Others", emoji: "✨", color: "#6B7280", gradient: "linear-gradient(135deg, #6B7280, #4B5563)" },
]

export function getCategoryByProvider(categoryName: string) {
  const cat = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
  return cat || categories[categories.length - 1]
}

"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Search, MapPin, Star } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { supabase } from "@/lib/supabase"

function getEmoji(category: string, serviceType: string): string {
  const c = (category + " " + serviceType).toLowerCase()
  if (c.includes("plumb")) return "🔧"
  if (c.includes("snake")) return "🐍"
  if (c.includes("coconut") || c.includes("tree")) return "🌴"
  if (c.includes("electric")) return "⚡"
  if (c.includes("mehndi") || c.includes("mehandi")) return "🌿"
  if (c.includes("beauty") || c.includes("hair")) return "💄"
  if (c.includes("tutor") || c.includes("teach")) return "📚"
  if (c.includes("driver") || c.includes("transport")) return "🚗"
  if (c.includes("calligraph") || c.includes("art")) return "🎨"
  if (c.includes("cook") || c.includes("food")) return "🍽️"
  return "🌟"
}

interface Provider {
  id: string
  full_name: string
  category: string
  services: string[]
  experience_years: number
  hourly_rate: number
  price_type?: string
  price_unit?: string
  profile_photo: string | null
  latitude: number
  longitude: number
}

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, mounted } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const category = searchParams.get("category")

  useEffect(() => {
    fetchProviders()
  }, [category])

  const fetchProviders = async () => {
    setLoading(true)
    let query = supabase.from("providers").select("*")

    if (category) {
      query = query.eq("category", category)
    }

    const { data } = await query
    setProviders(data || [])
    setLoading(false)
  }

  const filteredProviders = providers.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.services.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (!mounted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#080F1E" }}
      >
        <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: theme.bg,
        fontFamily: "var(--font-dm-sans), sans-serif",
        maxWidth: "430px",
        margin: "0 auto",
      }}
    >
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          backgroundColor: theme.headerBg,
          borderBottom: `1px solid ${theme.borderLight}`,
        }}
      >
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 transition-colors"
            style={{ color: theme.text, borderRadius: "12px" }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder="Search services or providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            className="flex-1 px-4 py-3 text-[14px] focus:outline-none"
            style={{
              backgroundColor: theme.input,
              color: theme.text,
              border: `1px solid ${theme.inputBorder}`,
              borderRadius: "12px",
            }}
          />
        </div>
      </header>

      <main className="px-4 py-6">
        {category && (
          <div className="mb-4">
            <p className="text-[13px]" style={{ color: theme.sub }}>
              Showing results for <span className="font-semibold" style={{ color: theme.text }}>{category}</span>
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[14px]" style={{ color: theme.sub }}>
              No providers found
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProviders.map((provider) => (
              <button
                key={provider.id}
                onClick={() => router.push(`/provider/${provider.id}`)}
                className="w-full p-4 flex gap-4 text-left transition-all"
                style={{
                  backgroundColor: theme.card,
                  border: `1px solid ${theme.cardBorder}`,
                  borderRadius: "16px",
                }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: theme.input }}
                >
                  {provider.profile_photo ? (
                    <img
                      src={provider.profile_photo}
                      alt={provider.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">{getEmoji(provider.category || "", provider.services?.[0] || "")}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-[15px] font-semibold mb-1" style={{ color: theme.text }}>
                    {provider.full_name}
                  </h3>
                  <p className="text-[13px] mb-2" style={{ color: theme.sub }}>
                    {provider.services[0] || provider.category}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px]" style={{ color: theme.sub }}>
                      {provider.experience_years} yrs exp
                    </span>
                    <span className="text-[12px] font-semibold" style={{ color: theme.accent }}>
                      {provider.price_type === 'quote' ? 'Get Quote' : provider.hourly_rate ? `₹${provider.hourly_rate}/${provider.price_unit || 'hr'}` : 'Contact'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#080F1E" }}
      >
        <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}

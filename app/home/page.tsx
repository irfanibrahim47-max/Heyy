"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, Search, ArrowRight, Chrome as Home, Bookmark, User, MapPin } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { supabase } from "@/lib/supabase"
import { categories as allCategories, getCategoryByProvider } from "@/lib/categories"

interface Category {
  emoji: string
  name: string
  count: number
  color: string
}

interface ProviderData {
  id: string
  name: string
  cat: string
  emoji: string
  gradient: string
  rating: number
  price: string
  available: boolean
  reviews?: number
}

function getServiceTypeEmoji(serviceType: string): string {
  const s = serviceType.toLowerCase()
  if (s.includes("plumb")) return "🔧"
  if (s.includes("coconut") || s.includes("tree") || s.includes("climb")) return "🌴"
  if (s.includes("clean")) return "🧹"
  if (s.includes("electric")) return "⚡"
  if (s.includes("beauty") || s.includes("hair") || s.includes("salon")) return "💄"
  if (s.includes("tutor") || s.includes("teach")) return "📚"
  if (s.includes("driver") || s.includes("transport")) return "🚗"
  return "🌟"
}

export default function HomePage() {
  const router = useRouter()
  const [activeNav, setActiveNav] = useState("Home")
  const { theme, isDark, mounted } = useTheme()
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [topRatedProviders, setTopRatedProviders] = useState<ProviderData[]>([])
  const [availableTodayProviders, setAvailableTodayProviders] = useState<ProviderData[]>([])
  const [loadingProviders, setLoadingProviders] = useState(true)

  // ── User session ────────────────────────────────────────────────────────────
  const [userName, setUserName] = useState("")
  const [userDistrict, setUserDistrict] = useState("Kerala")

  useEffect(() => {
    // ── Auth guard — redirect to login if not logged in ──
    const userId = localStorage.getItem("heyy_user_id")
    if (!userId) {
      router.replace("/")
      return
    }

    // ── Load user info from localStorage ──
    const name = localStorage.getItem("heyy_user_name") || ""
    const district = localStorage.getItem("heyy_user_district") || "Kerala"
    setUserName(name)
    setUserDistrict(district)

    // ── Fetch categories & providers ──
    async function fetchCategories() {
      const { data: providerData } = await supabase
        .from('providers')
        .select('category')

      const countsByDisplayName = new Map<string, number>()
      ;(providerData || []).forEach((p: { category: string }) => {
        const displayName = getCategoryByProvider(p.category || "").name
        countsByDisplayName.set(displayName, (countsByDisplayName.get(displayName) || 0) + 1)
      })

      const mapped: Category[] = allCategories.map((cat) => ({
        emoji: cat.emoji,
        name: cat.name,
        count: countsByDisplayName.get(cat.name) || 0,
        color: cat.color,
      }))

      setCategories(mapped)
      setLoadingCategories(false)
    }

    async function fetchProviders() {
      const { data } = await supabase
        .from('providers')
        .select('*')
        .eq('is_available', true)
        .order('rating', { ascending: false })

      const mapProvider = (p: any): ProviderData => ({
        id: p.id,
        name: p.full_name,
        cat: p.service_type,
        emoji: getServiceTypeEmoji(p.service_type || ""),
        gradient: getCategoryByProvider(p.category || "").gradient,
        rating: p.rating || 0,
        price: p.price_type === 'quote' ? 'Get Quote' : p.hourly_rate ? `₹${p.hourly_rate}/${p.price_unit || 'hr'}` : "Call",
        available: p.is_available,
        reviews: 0,
      })

      const all = (data || []).map(mapProvider)
      setTopRatedProviders(all.slice(0, 10))
      setAvailableTodayProviders(all)
      setLoadingProviders(false)
    }

    fetchCategories()
    fetchProviders()
  }, [])

  // ── Get first name only for greeting ──
  const firstName = userName ? userName.split(" ")[0] : ""

  const handleNavClick = (label: string) => {
    setActiveNav(label)
    switch (label) {
      case "Home": router.push("/home"); break
      case "Search": router.push("/search"); break
      case "Bookings": router.push("/bookings"); break
      case "Profile": router.push("/profile"); break
    }
  }

  const handleProviderClick = (providerId: string) => router.push(`/provider/${providerId}`)
  const handleSearchClick = () => router.push("/search")
  const handleCategoryClick = (categoryName: string) => router.push(`/search?category=${encodeURIComponent(categoryName)}`)

  if (!mounted) {
    return (
      <div style={{ minHeight: "100vh", background: "#080F1E", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#94A3B8" }}>Loading...</div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen transition-colors duration-500"
      style={{ background: theme.bg, fontFamily: "var(--font-dm-sans), sans-serif" }}
    >
      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeUp 0.5s ease forwards; }
      `}</style>

      <div style={{ maxWidth: 430, margin: "0 auto", position: "relative", paddingBottom: 96 }}>

        {/* ── Header ── */}
        <header
          className="sticky top-0 z-50 transition-colors duration-300"
          style={{
            background: theme.headerBg,
            backdropFilter: "blur(20px)",
            borderBottom: `1px solid ${theme.cardBorder}`,
            padding: "12px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span
                style={{
                  display: "block",
                  fontSize: 20, fontWeight: 800, color: theme.accent,
                  fontFamily: "var(--font-syne), sans-serif",
                  lineHeight: 1.1,
                }}
              >Heyy 🌴</span>
              {firstName ? (
                <span style={{ fontSize: 12, color: theme.sub, marginTop: 1, display: "block" }}>
                  Hi, <span style={{ color: theme.text, fontWeight: 600 }}>{firstName}</span> 👋
                </span>
              ) : null}
            </div>

            <div
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px",
                background: theme.elevated, borderRadius: 12,
              }}
            >
              <MapPin size={13} style={{ color: theme.accent }} />
              <span style={{ fontSize: 12, color: theme.sub }}>{userDistrict}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => alert("No new notifications")} style={{ color: theme.sub }}>
                <Bell size={22} />
              </button>
              <button
                onClick={() => router.push("/profile")}
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: theme.elevated,
                  border: `1.5px solid ${theme.cardBorder}`,
                  cursor: "pointer",
                }}
              >
                {/* Show initials if name exists */}
                {firstName ? (
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: theme.accent,
                    fontFamily: "var(--font-syne), sans-serif",
                  }}>
                    {firstName[0].toUpperCase()}
                  </span>
                ) : (
                  <User size={18} style={{ color: theme.sub }} />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ── Search ── */}
        <div className="pt-5 animate-fade-up" style={{ animationDelay: "0s", paddingLeft: 16, paddingRight: 16 }}>
          <button
            onClick={handleSearchClick}
            className="w-full flex items-center h-14 px-4 transition-all duration-300 cursor-pointer"
            style={{ background: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: 12 }}
          >
            <Search size={18} className="mr-3 flex-shrink-0" style={{ color: theme.accent }} />
            <span className="flex-1 text-left text-[15px]" style={{ color: theme.sub }}>
              Search plumber, tutor, driver...
            </span>
            <span
              className="flex-shrink-0 px-3 py-1.5 text-xs font-bold text-white"
              style={{ background: theme.accent, borderRadius: 12 }}
            >
              Search
            </span>
          </button>
        </div>

        {/* ── Categories ── */}
        <section className="pt-6 animate-fade-up" style={{ animationDelay: "0.1s", paddingLeft: 16, paddingRight: 16 }}>
          <h2 className="text-base font-bold mb-3" style={{ color: theme.text, fontFamily: "var(--font-syne), sans-serif" }}>
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {loadingCategories ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="relative p-5 overflow-hidden animate-pulse"
                  style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 16 }}>
                  <div className="w-12 h-12 rounded-full mb-3" style={{ background: theme.elevated }} />
                  <div className="h-4 w-24 rounded mb-2" style={{ background: theme.elevated }} />
                  <div className="h-3 w-16 rounded" style={{ background: theme.elevated }} />
                </div>
              ))
            ) : (
              categories.slice(0, 10).map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => handleCategoryClick(cat.name)}
                  className="group relative p-5 cursor-pointer transition-all duration-[250ms] hover:-translate-y-1 overflow-hidden"
                  style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 16 }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = cat.color }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.cardBorder }}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                    style={{ background: `${cat.color}26` }}>
                    <span className="text-2xl">{cat.emoji}</span>
                  </div>
                  <p className="text-[15px] font-bold" style={{ color: theme.text, fontFamily: "var(--font-syne), sans-serif" }}>
                    {cat.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: theme.sub }}>{cat.count} providers</p>
                  <div className="absolute bottom-4 right-4 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: theme.elevated }}>
                    <ArrowRight size={14} style={{ color: theme.sub }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Top Rated ── */}
        <section className="pt-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-base font-bold mb-3"
            style={{ color: theme.text, fontFamily: "var(--font-syne), sans-serif", paddingLeft: 16, paddingRight: 16 }}>
            Top Rated Near You
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", paddingLeft: 16, paddingRight: 16 }}>
            {loadingProviders ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="flex-shrink-0 w-[175px] p-4 animate-pulse"
                  style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 16 }}>
                  <div className="w-[52px] h-[52px] rounded-full mb-3" style={{ background: theme.elevated }} />
                  <div className="h-4 w-24 rounded mb-2" style={{ background: theme.elevated }} />
                  <div className="h-3 w-16 rounded" style={{ background: theme.elevated }} />
                </div>
              ))
            ) : topRatedProviders.length > 0 ? (
              topRatedProviders.map((provider) => (
                <div
                  key={provider.id}
                  onClick={() => handleProviderClick(provider.id)}
                  className="flex-shrink-0 w-[175px] p-4 transition-all duration-300 cursor-pointer hover:-translate-y-1"
                  style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 16 }}
                >
                  <div className="relative mb-3">
                    <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
                      style={{ background: `${getCategoryByProvider(provider.cat || "").color}22`, border: `1px solid ${getCategoryByProvider(provider.cat || "").color}44` }}>
                      <span className="text-2xl">{provider.emoji}</span>
                    </div>
                    {provider.available && (
                      <div className="absolute -top-1 -right-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ background: `${theme.success}26`, color: theme.success }}>
                        Available
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-bold" style={{ color: theme.text, fontFamily: "var(--font-syne), sans-serif" }}>
                    {provider.name}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: theme.sub }}>{provider.cat}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs" style={{ color: theme.warning }}>&#9733; {provider.rating}</span>
                    <span className="text-[13px] font-bold" style={{ color: theme.accent }}>{provider.price}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm" style={{ color: theme.sub }}>No providers found yet</p>
            )}
          </div>
        </section>

        {/* ── Available Today ── */}
        <section className="pt-6 animate-fade-up" style={{ animationDelay: "0.3s", paddingLeft: 16, paddingRight: 16 }}>
          <h2 className="text-base font-bold mb-3"
            style={{ color: theme.text, fontFamily: "var(--font-syne), sans-serif" }}>
            Available Today
          </h2>
          <div className="flex flex-col gap-3">
            {loadingProviders ? (
              [1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 animate-pulse"
                  style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 16 }}>
                  <div className="w-[52px] h-[52px] rounded-full flex-shrink-0" style={{ background: theme.elevated }} />
                  <div className="flex-1">
                    <div className="h-4 w-32 rounded mb-2" style={{ background: theme.elevated }} />
                    <div className="h-3 w-20 rounded" style={{ background: theme.elevated }} />
                  </div>
                </div>
              ))
            ) : availableTodayProviders.length > 0 ? (
              availableTodayProviders.map((provider) => (
                <div
                  key={provider.id}
                  onClick={() => handleProviderClick(provider.id)}
                  className="flex items-center gap-4 p-4 transition-all duration-300 cursor-pointer hover:-translate-y-1"
                  style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 16 }}
                >
                  <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${getCategoryByProvider(provider.cat || "").color}22`, border: `1px solid ${getCategoryByProvider(provider.cat || "").color}44` }}>
                    <span className="text-2xl">{provider.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold" style={{ color: theme.text, fontFamily: "var(--font-syne), sans-serif" }}>
                      {provider.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: theme.sub }}>{provider.cat}</p>
                    <p className="text-xs mt-1" style={{ color: theme.warning }}>
                      &#9733; {provider.rating} ({provider.reviews || 0})
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-bold" style={{ color: theme.accent }}>{provider.price}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/book/${provider.id}`) }}
                      className="px-3 py-1.5 text-[11px] font-bold text-white"
                      style={{ background: theme.accent, borderRadius: 12, border: "none", cursor: "pointer" }}
                    >
                      Book
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm py-4 text-center" style={{ color: theme.sub }}>No providers found yet</p>
            )}
          </div>
        </section>
      </div>

      {/* ── Bottom Nav ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: theme.navBg,
          backdropFilter: "blur(20px)",
          borderTop: `1px solid ${theme.cardBorder}`,
          paddingBottom: "env(safe-area-inset-bottom)",
          height: 72,
        }}
      >
        <div style={{ maxWidth: 430, width: "100%", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-around", height: "100%" }}>
          {[
            { icon: Home, label: "Home" },
            { icon: Search, label: "Search" },
            { icon: Bookmark, label: "Bookings" },
            { icon: User, label: "Profile" },
          ].map((item) => {
            const isActive = activeNav === item.label
            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.label)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 16px", background: "none", border: "none", cursor: "pointer" }}
              >
                <item.icon size={22} style={{ color: isActive ? theme.accent : theme.sub }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: isActive ? theme.accent : theme.sub }}>{item.label}</span>
                {isActive && <div style={{ width: 4, height: 4, borderRadius: "50%", background: theme.accent }} />}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
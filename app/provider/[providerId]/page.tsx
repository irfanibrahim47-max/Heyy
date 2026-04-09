"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Share2, Heart, Star, MapPin, Clock, Shield, CheckCircle as CheckCircle2, MessageCircle, Calendar, ChevronRight, Zap, Timer, Camera, Award, Image as ImageIcon } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { supabase } from "@/lib/supabase"

function getEmoji(category: string, serviceType: string): string {
  const c = (category + " " + serviceType).toLowerCase()
  if (c.includes("plumb")) return "🔧"
  if (c.includes("snake")) return "🐍"
  if (c.includes("coconut") || c.includes("tree")) return "🌴"
  if (c.includes("electric")) return "⚡"
  if (c.includes("clean")) return "🧹"
  if (c.includes("mehndi") || c.includes("mehandi")) return "🌿"
  if (c.includes("beauty") || c.includes("hair") || c.includes("salon")) return "💄"
  if (c.includes("tutor") || c.includes("teach")) return "📚"
  if (c.includes("driver") || c.includes("transport")) return "🚗"
  if (c.includes("cook") || c.includes("chef") || c.includes("food")) return "🍽️"
  if (c.includes("photo") || c.includes("video")) return "📸"
  if (c.includes("art") || c.includes("music") || c.includes("dance")) return "🎨"
  if (c.includes("calligraph")) return "✍️"
  return "🌟"
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string; next: string; nextAt: number }> = {
  "Bronze":   { label: "Bronze",   color: "#CD7F32", bg: "rgba(205,127,50,0.12)",  icon: "🥉", next: "Silver",   nextAt: 11 },
  "Silver":   { label: "Silver",   color: "#9CA3AF", bg: "rgba(156,163,175,0.12)", icon: "🥈", next: "Gold",     nextAt: 51 },
  "Gold":     { label: "Gold",     color: "#F59E0B", bg: "rgba(245,158,11,0.12)",  icon: "🥇", next: "Platinum", nextAt: 201 },
  "Platinum": { label: "Platinum", color: "#3B82F6", bg: "rgba(59,130,246,0.12)",  icon: "💎", next: "",         nextAt: 0 },
}

function getStarTier(totalBookings: number): string {
  if (totalBookings > 200) return "Platinum"
  if (totalBookings > 50) return "Gold"
  if (totalBookings > 10) return "Silver"
  return "Bronze"
}

function isInstantBooking(provider: any): boolean {
  return provider?.is_verified === true && (provider?.rating || 0) >= 4.5 && (provider?.total_reviews || 0) > 0
}

export default function ProviderProfilePage() {
  const router = useRouter()
  const params = useParams()
  const providerId = params.providerId as string
  const { theme, mounted } = useTheme()
  const [activeTab, setActiveTab] = useState("about")
  const [isLiked, setIsLiked] = useState(false)
  const [provider, setProvider] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProvider() {
      setLoading(true)
      const { data: providerData, error } = await supabase
        .from("providers")
        .select("*")
        .eq("id", providerId)
        .single()

      if (error || !providerData) { setLoading(false); return }
      setProvider(providerData)

      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false })

      setReviews(reviewData || [])

      // Collect portfolio photos from customer reviews
      const photos: string[] = []
      ;(reviewData || []).forEach((r: any) => {
        if (r.photos && Array.isArray(r.photos)) photos.push(...r.photos)
      })
      setPortfolioPhotos(photos.slice(0, 9))
      setLoading(false)
    }
    if (providerId) fetchProvider()
  }, [providerId])

  if (!mounted || loading) {
    return (
      <div style={{ maxWidth: "430px", margin: "0 auto", backgroundColor: "#080F1E", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "32px", height: "32px", border: "2px solid #3B82F6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!provider) {
    return (
      <div style={{ maxWidth: "430px", margin: "0 auto", backgroundColor: "#080F1E", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "white", marginBottom: "16px" }}>Provider not found</p>
        <button onClick={() => router.push("/search")} style={{ padding: "12px 24px", backgroundColor: "#3B82F6", color: "white", border: "none", borderRadius: "12px", cursor: "pointer" }}>Back to Search</button>
      </div>
    )
  }

  const emoji = getEmoji(provider.category || "", provider.service_type || "")
  const languages = Array.isArray(provider.languages) ? provider.languages : []
  const totalBookings = provider.total_bookings || 0
  const tierKey = getStarTier(totalBookings)
  const tier = TIER_CONFIG[tierKey]
  const instant = isInstantBooking(provider)
  const priceUnit = provider.price_unit || "hr"
  const tabs = [
    { id: "about", label: "About" },
    { id: "portfolio", label: `Portfolio${portfolioPhotos.length > 0 ? ` (${portfolioPhotos.length})` : ""}` },
    { id: "reviews", label: `Reviews (${reviews.length})` },
  ]

  return (
    <div className="min-h-screen pb-28" style={{ maxWidth: "430px", margin: "0 auto", backgroundColor: theme.bg, fontFamily: "var(--font-dm-sans), sans-serif" }}>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ backgroundColor: theme.headerBg, borderBottom: `1px solid ${theme.borderLight}` }}>
        <div className="flex items-center justify-between py-4">
          <button onClick={() => router.back()} style={{ color: theme.text, background: "none", border: "none", cursor: "pointer", padding: "8px", borderRadius: "12px" }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.text, fontSize: "18px", fontWeight: 700, margin: 0 }}>Provider Profile</h1>
          <div className="flex gap-2">
            <button style={{ color: theme.sub, background: "none", border: "none", cursor: "pointer", padding: "8px" }}>
              <Share2 className="w-5 h-5" />
            </button>
            <button onClick={() => setIsLiked(!isLiked)} style={{ color: isLiked ? "#EF4444" : theme.sub, background: "none", border: "none", cursor: "pointer", padding: "8px" }}>
              <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Profile card */}
      <div style={{ padding: "16px" }}>
        <div style={{ backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "20px", overflow: "hidden", boxShadow: theme.shadow }}>

          {/* Hero */}
          <div style={{ position: "relative", height: "100px", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${theme.accent}22 0%, transparent 100%), ${theme.card}` }}>
            <span style={{ fontSize: "56px" }}>{emoji}</span>
            {provider.is_available && (
              <span style={{ position: "absolute", top: "12px", right: "12px", fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "999px", backgroundColor: theme.pill, color: "#22C55E" }}>
                Available Today
              </span>
            )}
          </div>

          <div style={{ padding: "16px 20px 20px" }}>

            {/* Name + verified */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.text, fontSize: "22px", fontWeight: 700, margin: 0 }}>
                {provider.full_name}
              </h2>
              {provider.is_verified && (
                <CheckCircle2 className="w-5 h-5" style={{ color: theme.accent, fill: `${theme.accent}33` }} />
              )}
            </div>

            <p style={{ color: theme.sub, fontSize: "13px", margin: "0 0 14px" }}>
              {provider.service_type} · {provider.category}
            </p>

            {/* ⭐ KEY BADGES — Star tier + Booking mode */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>

              {/* Star tier badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", backgroundColor: tier.bg, borderRadius: "999px", border: `1px solid ${tier.color}44` }}>
                <span style={{ fontSize: "14px" }}>{tier.icon}</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: tier.color }}>{tier.label} Provider</span>
              </div>

              {/* Booking mode badge — MOST IMPORTANT for conversion */}
              {instant ? (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", backgroundColor: "rgba(34,197,94,0.12)", borderRadius: "999px", border: "1px solid rgba(34,197,94,0.3)" }}>
                  <Zap size={12} style={{ color: "#22C55E", fill: "#22C55E" }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#22C55E" }}>⚡ Instant Confirm</span>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", backgroundColor: "rgba(245,158,11,0.12)", borderRadius: "999px", border: "1px solid rgba(245,158,11,0.3)" }}>
                  <Timer size={12} style={{ color: "#F59E0B" }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#F59E0B" }}>Responds in 1 hour</span>
                </div>
              )}
            </div>

            {/* Verification trust signal */}
            {provider.is_verified ? (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 14px", backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "12px", marginBottom: "14px" }}>
                <Shield size={16} style={{ color: "#22C55E", flexShrink: 0, marginTop: "1px" }} />
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "#22C55E", margin: "0 0 2px" }}>Identity Verified ✓</p>
                  <p style={{ fontSize: "11px", color: theme.sub, margin: 0, lineHeight: 1.5 }}>Aadhaar checked · Background screened · Approved by Heyy team</p>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 14px", backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "12px", marginBottom: "14px" }}>
                <Clock size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: "1px" }} />
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "#F59E0B", margin: "0 0 2px" }}>Verification in Progress</p>
                  <p style={{ fontSize: "11px", color: theme.sub, margin: 0, lineHeight: 1.5 }}>Our team is reviewing this profile · Usually completed within 24–48 hours</p>
                </div>
              </div>
            )}

            {/* Rating + location + response time */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {provider.rating > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Star className="w-4 h-4" style={{ color: "#F59E0B", fill: "#F59E0B" }} />
                    <span style={{ fontSize: "14px", fontWeight: 600, color: theme.text }}>{provider.rating?.toFixed(1)}</span>
                    <span style={{ fontSize: "12px", color: theme.sub }}>({provider.total_reviews} reviews)</span>
                  </div>
                ) : (
                  <span style={{ fontSize: "12px", fontWeight: 600, color: theme.accent }}>✨ New Provider</span>
                )}
                {provider.district && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <MapPin className="w-3.5 h-3.5" style={{ color: theme.sub }} />
                    <span style={{ fontSize: "12px", color: theme.sub }}>{provider.district}</span>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={12} style={{ color: theme.sub }} />
                <span style={{ fontSize: "11px", color: theme.sub }}>
                  {instant ? "Usually responds instantly" : "Usually responds within 1 hour"}
                </span>
              </div>
            </div>

            {/* Tier progress — gamification */}
            {tier.next && (
              <div style={{ padding: "10px 14px", backgroundColor: theme.input, borderRadius: "10px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: theme.sub }}>Progress to {tier.icon.replace(tier.icon, TIER_CONFIG[tier.next]?.icon || "")} {tier.next}</span>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: tier.color }}>{totalBookings}/{tier.nextAt} bookings</span>
                </div>
                <div style={{ height: "4px", backgroundColor: theme.cardBorder, borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, (totalBookings / tier.nextAt) * 100)}%`, backgroundColor: tier.color, borderRadius: "4px", transition: "width 0.3s" }} />
                </div>
              </div>
            )}

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", paddingTop: "16px", borderTop: `1px solid ${theme.borderLight}` }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: theme.text, margin: 0 }}>{totalBookings}</p>
                <p style={{ fontSize: "10px", color: theme.sub, margin: "2px 0 0" }}>Jobs Done</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: theme.text, margin: 0 }}>{provider.experience_years || 0}</p>
                <p style={{ fontSize: "10px", color: theme.sub, margin: "2px 0 0" }}>Yrs Exp</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: tier.color, margin: 0 }}>
                  {provider.rating > 0 ? provider.rating?.toFixed(1) : "New"}
                </p>
                <p style={{ fontSize: "10px", color: theme.sub, margin: "2px 0 0" }}>Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", gap: "4px", padding: "4px", backgroundColor: theme.input, borderRadius: "12px" }}>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ flex: 1, padding: "10px 4px", fontSize: "12px", fontWeight: 500, backgroundColor: activeTab === tab.id ? theme.card : "transparent", color: activeTab === tab.id ? theme.text : theme.sub, border: "none", borderRadius: "10px", cursor: "pointer", boxShadow: activeTab === tab.id ? "0 2px 8px rgba(0,0,0,0.2)" : "none" }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: "16px" }}>

        {/* ABOUT */}
        {activeTab === "about" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* Chat before booking CTA */}
            <div style={{ padding: "14px 16px", backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 600, color: theme.text, margin: "0 0 2px" }}>Have a question?</p>
                <p style={{ fontSize: "11px", color: theme.sub, margin: 0 }}>Chat with {provider.full_name?.split(" ")[0]} before booking</p>
              </div>
              <button
                onClick={() => router.push(`/chat/${providerId}`)}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, color: "white", backgroundColor: theme.accent, border: "none", borderRadius: "10px", cursor: "pointer" }}
              >
                <MessageCircle size={14} />
                Chat
              </button>
            </div>

            {/* Cancellation policy */}
            <div style={{ padding: "14px 16px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "14px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: theme.text, margin: "0 0 10px" }}>📋 Cancellation Policy</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22C55E", flexShrink: 0, marginTop: "5px" }} />
                  <p style={{ fontSize: "12px", color: theme.sub, margin: 0, lineHeight: 1.5 }}>Cancel <strong style={{ color: theme.text }}>before 2 hours</strong> — Full refund</p>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#F59E0B", flexShrink: 0, marginTop: "5px" }} />
                  <p style={{ fontSize: "12px", color: theme.sub, margin: 0, lineHeight: 1.5 }}>Cancel <strong style={{ color: theme.text }}>after 2 hours</strong> — 90% refund</p>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#EF4444", flexShrink: 0, marginTop: "5px" }} />
                  <p style={{ fontSize: "12px", color: theme.sub, margin: 0, lineHeight: 1.5 }}><strong style={{ color: theme.text }}>No show</strong> — No refund</p>
                </div>
              </div>
            </div>

            {/* About */}
            {(provider.about || provider.description) && (
              <div style={{ padding: "16px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "14px" }}>
                <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "14px", fontWeight: 700, color: theme.text, margin: "0 0 8px" }}>About</p>
                <p style={{ fontSize: "13px", color: theme.sub, lineHeight: 1.7, margin: 0 }}>{provider.about || provider.description}</p>
              </div>
            )}

            {/* Service details */}
            <div style={{ padding: "16px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "14px" }}>
              <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "14px", fontWeight: 700, color: theme.text, margin: "0 0 12px" }}>Service Details</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {provider.district && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <MapPin className="w-4 h-4" style={{ color: theme.sub }} />
                    <div>
                      <p style={{ fontSize: "13px", color: theme.text, margin: 0 }}>{provider.district}{provider.serves_all_kerala ? " · All Kerala" : ""}</p>
                      <p style={{ fontSize: "11px", color: theme.sub, margin: "1px 0 0" }}>Service Area</p>
                    </div>
                  </div>
                )}
                {(provider.working_hours_start && provider.working_hours_end) && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Clock className="w-4 h-4" style={{ color: theme.sub }} />
                    <div>
                      <p style={{ fontSize: "13px", color: theme.text, margin: 0 }}>{provider.working_hours_start} – {provider.working_hours_end}</p>
                      <p style={{ fontSize: "11px", color: theme.sub, margin: "1px 0 0" }}>Working Hours</p>
                    </div>
                  </div>
                )}
                {languages.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <MessageCircle className="w-4 h-4" style={{ color: theme.sub }} />
                    <div>
                      <p style={{ fontSize: "13px", color: theme.text, margin: 0 }}>{languages.join(", ")}</p>
                      <p style={{ fontSize: "11px", color: theme.sub, margin: "1px 0 0" }}>Languages</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PORTFOLIO */}
        {activeTab === "portfolio" && (
          <div>
            {portfolioPhotos.length > 0 ? (
              <div>
                <p style={{ fontSize: "13px", color: theme.sub, margin: "0 0 12px" }}>Photos shared by customers after completed bookings</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px" }}>
                  {portfolioPhotos.map((photo, i) => (
                    <div key={i} style={{ aspectRatio: "1", borderRadius: "8px", overflow: "hidden", backgroundColor: theme.input }}>
                      <img src={photo} alt={`Work ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ padding: "48px 16px", textAlign: "center" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: theme.input, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Camera size={28} style={{ color: theme.sub }} />
                </div>
                <p style={{ fontSize: "16px", fontWeight: 600, color: theme.text, margin: "0 0 8px" }}>No photos yet</p>
                <p style={{ fontSize: "13px", color: theme.sub, lineHeight: 1.6, margin: 0 }}>
                  Photos will appear here after customers complete bookings and share their experience. Book this provider to be the first!
                </p>
              </div>
            )}
          </div>
        )}

        {/* REVIEWS */}
        {activeTab === "reviews" && (
          <div>
            {reviews.length === 0 ? (
              <div style={{ padding: "48px 16px", textAlign: "center" }}>
                <p style={{ fontSize: "40px", margin: "0 0 12px" }}>⭐</p>
                <p style={{ fontSize: "16px", fontWeight: 600, color: theme.text, margin: "0 0 8px" }}>No reviews yet</p>
                <p style={{ fontSize: "13px", color: theme.sub, margin: 0 }}>Be the first to review after booking!</p>
              </div>
            ) : (
              <div>
                {/* Rating summary */}
                <div style={{ padding: "16px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "20px" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "36px", fontWeight: 700, color: theme.text, margin: 0 }}>{provider.rating?.toFixed(1)}</p>
                    <div style={{ display: "flex", gap: "2px", justifyContent: "center", margin: "4px 0" }}>
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={12} style={{ color: i <= Math.floor(provider.rating) ? "#F59E0B" : theme.sub, fill: i <= Math.floor(provider.rating) ? "#F59E0B" : "transparent" }} />
                      ))}
                    </div>
                    <p style={{ fontSize: "11px", color: theme.sub, margin: 0 }}>{reviews.length} reviews</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    {[5,4,3,2,1].map(star => {
                      const count = reviews.filter(r => Math.round(r.rating) === star).length
                      const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                      return (
                        <div key={star} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "10px", color: theme.sub, width: "8px" }}>{star}</span>
                          <div style={{ flex: 1, height: "4px", backgroundColor: theme.input, borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, backgroundColor: "#F59E0B", borderRadius: "4px" }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Review list */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {reviews.map((review, i) => (
                    <div key={review.id || i} style={{ padding: "14px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 600, color: "white", flexShrink: 0 }}>
                          {review.reviewer_name ? review.reviewer_name[0].toUpperCase() : "C"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: theme.text, margin: 0 }}>{review.reviewer_name || "Customer"}</p>
                          <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} size={10} style={{ color: i <= review.rating ? "#F59E0B" : theme.sub, fill: i <= review.rating ? "#F59E0B" : "transparent" }} />
                            ))}
                            <span style={{ fontSize: "10px", color: theme.sub, marginLeft: "4px" }}>
                              {review.created_at ? new Date(review.created_at).toLocaleDateString("en-IN") : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <p style={{ fontSize: "12px", color: theme.sub, lineHeight: 1.6, margin: "0 0 8px" }}>{review.comment}</p>
                      )}
                      {/* Customer photos */}
                      {review.photos && review.photos.length > 0 && (
                        <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                          {review.photos.slice(0, 4).map((photo: string, pi: number) => (
                            <div key={pi} style={{ width: "60px", height: "60px", borderRadius: "8px", overflow: "hidden", backgroundColor: theme.input }}>
                              <img src={photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar — Chat + Book Now (NO call button) */}
      <div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl" style={{ backgroundColor: theme.headerBg, borderTop: `1px solid ${theme.borderLight}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", maxWidth: "430px", margin: "0 auto" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
              <span style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.accent, fontSize: "22px", fontWeight: 800 }}>
                {provider.price_type === "quote" ? "Get Quote" : `₹${provider.hourly_rate || provider.daily_rate || "—"}`}
              </span>
              {provider.price_type !== "quote" && (
                <span style={{ color: theme.sub, fontSize: "12px" }}>/{priceUnit}</span>
              )}
            </div>
            {provider.daily_rate && provider.hourly_rate && (
              <p style={{ fontSize: "11px", color: theme.sub, margin: 0 }}>₹{provider.daily_rate}/day also available</p>
            )}
          </div>

          {/* Chat button */}
          <button
            onClick={() => router.push(`/chat/${providerId}`)}
            style={{ padding: "12px 16px", backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text, borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 500 }}
          >
            <MessageCircle size={18} style={{ color: theme.accent }} />
            Chat
          </button>

          {/* Book Now button */}
          <button
            onClick={() => router.push(`/book/${providerId}`)}
            style={{ padding: "12px 20px", fontSize: "14px", fontWeight: 600, color: "white", backgroundColor: theme.accent, border: "none", borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: `0 4px 16px ${theme.accent}4D` }}
          >
            <Calendar size={16} />
            {instant ? "⚡ Book Now" : "Book Now"}
          </button>
        </div>

        {/* Booking mode explanation */}
        <div style={{ textAlign: "center", paddingBottom: "12px" }}>
          <p style={{ fontSize: "10px", color: theme.sub, margin: 0 }}>
            {instant
              ? "⚡ Instant confirmation — no waiting"
              : "⏱ Provider has 1 hour to confirm · Auto-cancelled if no response"}
          </p>
        </div>
      </div>

    </div>
  )
}

























































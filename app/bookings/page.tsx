"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Clock, MapPin, Star, Phone, MessageCircle, CheckCircle2 } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { supabase } from "@/lib/supabase"

function getEmoji(serviceType: string): string {
  const s = (serviceType || "").toLowerCase()
  if (s.includes("plumb")) return "🔧"
  if (s.includes("snake")) return "🐍"
  if (s.includes("coconut") || s.includes("tree")) return "🌴"
  if (s.includes("electric")) return "⚡"
  if (s.includes("mehndi") || s.includes("mehandi")) return "🌿"
  if (s.includes("beauty") || s.includes("hair")) return "💄"
  if (s.includes("tutor") || s.includes("teach")) return "📚"
  if (s.includes("driver") || s.includes("transport")) return "🚗"
  if (s.includes("calligraph") || s.includes("art")) return "🎨"
  if (s.includes("cook") || s.includes("food")) return "🍽️"
  return "🌟"
}

const tabs = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
]

export default function MyBookingsPage() {
  const router = useRouter()
  const { theme, mounted } = useTheme()
  const [activeTab, setActiveTab] = useState("all")
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBookings() {
      // Get phone from localStorage
      const phone = localStorage.getItem('heyy_user_phone')
      if (!phone) {
        setLoading(false)
        return
      }

      // Get customer id from users table
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phone)
        .single()

      if (!userData?.id) {
        setLoading(false)
        return
      }

      // Fetch only THIS customer's bookings
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          providers (
            full_name,
            service_type,
            category,
            phone,
            is_verified,
            price_type,
            price_unit
          )
        `)
        .eq('customer_id', userData.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching bookings:", error)
        setLoading(false)
        return
      }

      setBookings(data || [])
      setLoading(false)
    }

    fetchBookings()
  }, [])

  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === "all") return true
    if (activeTab === "upcoming") return booking.booking_status === "upcoming" || booking.booking_status === "in_progress"
    return booking.booking_status === activeTab
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return { label: "Upcoming", bg: "rgba(59,130,246,0.1)", color: theme.accent }
      case "in_progress":
        return { label: "In Progress", bg: "rgba(245,158,11,0.1)", color: theme.warning }
      case "completed":
        return { label: "Completed", bg: "rgba(34,197,94,0.1)", color: theme.success }
      case "cancelled":
        return { label: "Cancelled", bg: "rgba(239,68,68,0.1)", color: theme.error }
      default:
        return { label: "Upcoming", bg: "rgba(59,130,246,0.1)", color: theme.accent }
    }
  }

  if (!mounted) return <div style={{ minHeight: "100vh", maxWidth: "430px", margin: "0 auto", backgroundColor: "#080F1E" }} />

  return (
    <div className="min-h-screen pb-8" style={{ backgroundColor: theme.bg, fontFamily: "var(--font-dm-sans), sans-serif", maxWidth: "430px", margin: "0 auto" }}>

      <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ backgroundColor: theme.headerBg, borderBottom: `1px solid ${theme.borderLight}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px" }}>
          <button onClick={() => router.push("/home")} style={{ color: theme.text, background: "none", border: "none", cursor: "pointer", padding: "8px", borderRadius: "12px" }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.text, fontSize: "18px", fontWeight: 700, margin: 0 }}>My Bookings</h1>
          <div style={{ width: "36px" }} />
        </div>
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ display: "flex", gap: "4px", padding: "4px", backgroundColor: theme.input, borderRadius: "12px" }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ flex: 1, padding: "8px 4px", fontSize: "12px", fontWeight: 500, backgroundColor: activeTab === tab.id ? theme.card : "transparent", color: activeTab === tab.id ? theme.text : theme.sub, border: "none", borderRadius: "10px", cursor: "pointer", boxShadow: activeTab === tab.id ? theme.shadow : "none" }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {loading ? (
        <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: "180px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "16px", opacity: 0.5 }} className="animate-pulse" />
          ))}
        </div>
      ) : filteredBookings.length > 0 ? (
        <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredBookings.map((booking) => {
            const provider = booking.providers
            const statusBadge = getStatusBadge(booking.booking_status || "upcoming")
            const emoji = getEmoji(provider?.service_type || "")
            const priceType = provider?.price_type || "hourly"
            const priceUnit = provider?.price_unit || "hr"
            const duration = priceType === "hourly"
              ? `${booking.duration_hours || 1} hour${(booking.duration_hours || 1) > 1 ? "s" : ""}`
              : priceType === "daily"
              ? `${booking.duration_days || 1} day${(booking.duration_days || 1) > 1 ? "s" : ""}`
              : `${booking.duration_hours || 1} ${priceUnit}`

            return (
              <div key={booking.id} style={{ backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "16px", overflow: "hidden" }}>
                <div style={{ padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <p style={{ fontSize: "11px", color: theme.sub, margin: 0 }}>{booking.booking_id}</p>
                      <span style={{ fontSize: "9px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", backgroundColor: statusBadge.bg, color: statusBadge.color }}>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <div style={{ width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: theme.input, borderRadius: "12px", flexShrink: 0 }}>
                      <span style={{ fontSize: "22px" }}>{emoji}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <h3 style={{ fontSize: "14px", fontWeight: 700, color: theme.text, margin: 0 }}>{provider?.full_name || "Provider"}</h3>
                        {provider?.is_verified && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: theme.accent }} />}
                      </div>
                      <p style={{ fontSize: "11px", color: theme.sub, margin: "2px 0 0" }}>{booking.service_name || provider?.service_type}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: theme.sub }}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{booking.booking_date} {booking.time_slot && `• ${booking.time_slot}`}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: theme.sub }}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{duration}</span>
                    </div>
                    {booking.address && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: theme.sub }}>
                        <MapPin className="w-3.5 h-3.5" />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{booking.address}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "16px", borderTop: `1px solid ${theme.borderLight}` }}>
                    <div>
                      <p style={{ fontSize: "10px", color: theme.sub, margin: "0 0 2px" }}>Amount Paid</p>
                      <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "16px", fontWeight: 700, color: theme.accent, margin: 0 }}>₹{booking.total_amount || booking.amount}</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {(booking.booking_status === "upcoming" || booking.booking_status === "in_progress" || !booking.booking_status) && (
                        <>
                          {provider?.phone && (
                            <button onClick={() => window.location.href = `tel:${provider.phone}`}
                              style={{ padding: "10px", backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text, borderRadius: "12px", cursor: "pointer" }}>
                              <Phone className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => router.push(`/chat/${booking.provider_id}`)}
                            style={{ padding: "10px", backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text, borderRadius: "12px", cursor: "pointer" }}>
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {booking.booking_status === "completed" && (
                        <button onClick={() => router.push(`/review/${booking.provider_id}`)}
                          style={{ padding: "10px 16px", fontSize: "12px", fontWeight: 600, color: "white", backgroundColor: theme.accent, border: "none", borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                          <Star className="w-3.5 h-3.5" />
                          Review
                        </button>
                      )}
                      {booking.booking_status === "cancelled" && (
                        <button onClick={() => router.push(`/provider/${booking.provider_id}`)}
                          style={{ padding: "10px 16px", fontSize: "12px", fontWeight: 600, color: "white", backgroundColor: theme.accent, border: "none", borderRadius: "12px", cursor: "pointer" }}>
                          Rebook
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 16px", textAlign: "center" }}>
          <span style={{ fontSize: "48px", marginBottom: "16px" }}>📋</span>
          <h3 style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.text, fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>No bookings yet</h3>
          <p style={{ color: theme.sub, fontSize: "14px", margin: "0 0 24px" }}>
            {activeTab !== "all" ? `No ${activeTab} bookings` : "Book a service to get started"}
          </p>
          <button onClick={() => router.push("/search")}
            style={{ padding: "12px 24px", fontSize: "14px", fontWeight: 600, color: "white", backgroundColor: theme.accent, border: "none", borderRadius: "12px", cursor: "pointer", boxShadow: `0 4px 16px ${theme.accent}4D` }}>
            Find Services
          </button>
        </div>
      )}
    </div>
  )
}

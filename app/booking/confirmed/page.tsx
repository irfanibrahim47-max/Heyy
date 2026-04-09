"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle as CheckCircle2, Calendar, MapPin, Phone, MessageCircle, Share2, Chrome as Home, FileText } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { supabase } from "@/lib/supabase"

function generateBookingId() {
  const num = Math.floor(Math.random() * 900000) + 100000
  return `HEY${new Date().getFullYear()}${num}`
}

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

function BookingConfirmedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, mounted } = useTheme()
  const [provider, setProvider] = useState<any>(null)
  const [bookingId] = useState(generateBookingId())

  const providerId = searchParams.get("providerId") || ""
  const amount = searchParams.get("amount") || "0"
  const date = searchParams.get("date") || ""
  const time = searchParams.get("time") || ""
  const duration = searchParams.get("duration") || "1"
  const type = searchParams.get("type") || "hourly"

  useEffect(() => {
    async function fetchProvider() {
      if (!providerId) return
      const { data } = await supabase
        .from("providers")
        .select("full_name, service_type, category, phone, is_verified, price_type, price_unit")
        .eq("id", providerId)
        .single()
      if (data) setProvider(data)
    }
    fetchProvider()
  }, [providerId])

  useEffect(() => {
    async function saveBooking() {
      if (!providerId || !amount) return
      await supabase.from("bookings").insert({
        booking_id: bookingId,
        provider_id: providerId,
        customer_id: localStorage.getItem("heyy_user_id"), // ✅ FIXED
        booking_date: date,
        time_slot: time,
        duration_hours: parseInt(duration),
        amount: parseInt(amount),
        total_amount: parseInt(amount),
        payment_status: "paid",
        booking_status: "upcoming",
        service_name: provider?.service_type,
        service_category: provider?.category,
      })
    }
    if (provider) saveBooking()
  }, [provider])

  const priceType = provider?.price_type || type
  const priceUnit = provider?.price_unit || (type === "daily" ? "day" : "hr")

  const durationLabel = priceType === "hourly"
    ? `${duration} hour${Number(duration) > 1 ? "s" : ""}`
    : priceType === "daily"
    ? `${duration} day${Number(duration) > 1 ? "s" : ""}`
    : `${duration} ${priceUnit}`

  const durationTitle = (priceType === "hourly" || priceType === "daily") ? "Duration" : "Quantity"

  if (!mounted) return <div style={{ minHeight: "100vh", maxWidth: "430px", margin: "0 auto", backgroundColor: "#080F1E" }} />

  return (
    <div
      className="min-h-screen pb-32"
      style={{ backgroundColor: theme.bg, fontFamily: "var(--font-dm-sans), sans-serif", maxWidth: "430px", margin: "0 auto" }}
    >
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Success header */}
      <div style={{ padding: "48px 16px 24px", textAlign: "center" }}>
        <div style={{ width: "80px", height: "80px", margin: "0 auto 20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(16,185,129,0.15)", boxShadow: "0 0 40px rgba(16,185,129,0.3)", animation: "popIn 0.5s ease-out" }}>
          <CheckCircle2 className="w-10 h-10 text-[#10B981]" />
        </div>
        <h1 style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.text, fontSize: "24px", fontWeight: 700, margin: "0 0 8px", animation: "fadeUp 0.5s ease-out 0.1s both" }}>
          Booking Confirmed!
        </h1>
        <p style={{ color: theme.sub, fontSize: "14px", margin: 0, animation: "fadeUp 0.5s ease-out 0.2s both" }}>
          Your service has been successfully booked
        </p>
      </div>

      {/* Booking card */}
      <div style={{ padding: "0 16px 20px", animation: "fadeUp 0.5s ease-out 0.3s both" }}>
        <div style={{ padding: "16px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "16px" }}>

          {/* Booking ID */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <p style={{ fontSize: "10px", fontWeight: 500, color: theme.sub, margin: "0 0 2px" }}>Booking ID</p>
              <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "14px", fontWeight: 700, color: theme.accent, margin: 0 }}>{bookingId}</p>
            </div>
            <button style={{ padding: "8px", backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.sub, borderRadius: "12px", cursor: "pointer" }}>
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Provider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "16px", marginBottom: "16px", borderBottom: `1px solid ${theme.borderLight}` }}>
            <div style={{ width: "56px", height: "56px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: theme.input, borderRadius: "12px", flexShrink: 0 }}>
              <span style={{ fontSize: "28px" }}>{provider ? getEmoji(provider.category || "", provider.service_type || "") : "🌟"}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: theme.text, margin: 0 }}>{provider?.full_name || "Loading..."}</h3>
                {provider?.is_verified && <CheckCircle2 className="w-4 h-4" style={{ color: theme.accent }} />}
              </div>
              <p style={{ fontSize: "12px", color: theme.sub, margin: "2px 0 0" }}>{provider?.service_type || "—"}</p>
            </div>
          </div>

          {/* Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <Calendar className="w-4 h-4" style={{ color: theme.sub, marginTop: "2px", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: "13px", color: theme.text, margin: 0 }}>{date} {time}</p>
                <p style={{ fontSize: "11px", color: theme.sub, margin: "2px 0 0" }}>{durationTitle}: {durationLabel}</p>
              </div>
            </div>
          </div>

          {/* Total */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${theme.borderLight}` }}>
            <div>
              <p style={{ fontSize: "11px", color: theme.sub, margin: "0 0 2px" }}>Total Paid</p>
              <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", fontWeight: 700, color: "#10B981", margin: 0 }}>₹{amount}</p>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 600, padding: "6px 12px", borderRadius: "20px", backgroundColor: "rgba(16,185,129,0.1)", color: "#10B981" }}>
              Payment Successful
            </span>
          </div>
        </div>
      </div>

      {/* Contact provider */}
      <div style={{ padding: "0 16px 20px", animation: "fadeUp 0.5s ease-out 0.4s both" }}>
        <h3 style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.text, fontSize: "14px", fontWeight: 700, margin: "0 0 12px" }}>Contact Provider</h3>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => provider?.phone && (window.location.href = `tel:${provider.phone}`)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, color: theme.text, borderRadius: "12px", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}
          >
            <Phone className="w-4 h-4" style={{ color: "#10B981" }} />
            Call
          </button>
          <button
            onClick={() => router.push(`/chat/${providerId}`)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, color: theme.text, borderRadius: "12px", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}
          >
            <MessageCircle className="w-4 h-4" style={{ color: theme.accent }} />
            Chat
          </button>
        </div>
      </div>

      {/* What's next */}
      <div style={{ padding: "0 16px 20px", animation: "fadeUp 0.5s ease-out 0.5s both" }}>
        <h3 style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.text, fontSize: "14px", fontWeight: 700, margin: "0 0 12px" }}>What's Next?</h3>
        <div style={{ padding: "16px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {[
            { num: 1, title: "Confirmation SMS", sub: "You'll receive booking details on your phone" },
            { num: 2, title: "Provider Arrival", sub: `${provider?.full_name || "Provider"} will arrive at the scheduled time` },
            { num: 3, title: "Rate & Review", sub: "Rate the provider after service is completed" },
          ].map((item) => (
            <div key={item.num} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, backgroundColor: theme.accent, color: "#fff", flexShrink: 0 }}>{item.num}</div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 500, color: theme.text, margin: 0 }}>{item.title}</p>
                <p style={{ fontSize: "11px", color: theme.sub, margin: "2px 0 0" }}>{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl" style={{ backgroundColor: theme.headerBg, borderTop: `1px solid ${theme.borderLight}`, padding: "16px" }}>
        <div style={{ display: "flex", gap: "12px", maxWidth: "430px", margin: "0 auto" }}>
          <button
            onClick={() => router.push("/home")}
            style={{ flex: 1, padding: "16px", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, color: theme.text, borderRadius: "12px", cursor: "pointer" }}
          >
            <Home className="w-4 h-4" />
            Home
          </button>
          <button
            onClick={() => router.push("/bookings")}
            style={{ flex: 1, padding: "16px", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: theme.accent, color: "white", border: "none", borderRadius: "12px", cursor: "pointer", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}
          >
            <FileText className="w-4 h-4" />
            View My Bookings
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BookingConfirmedPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#080F1E" }} />}>
      <BookingConfirmedContent />
    </Suspense>
  )
}
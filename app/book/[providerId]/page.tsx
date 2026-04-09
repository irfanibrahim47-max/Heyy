"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Calendar, Clock, MapPin, Users, FileText, CheckCircle2 } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { supabase } from "@/lib/supabase"

// ── Time slots grouped by period ──────────────────────────────────────────────
const TIME_GROUPS = [
  {
    label: "Early Morning",
    emoji: "🌅",
    slots: ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00"],
    display: ["12:00 AM", "1:00 AM", "2:00 AM", "3:00 AM", "4:00 AM", "5:00 AM"],
  },
  {
    label: "Morning",
    emoji: "🌤️",
    slots: ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00"],
    display: ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM"],
  },
  {
    label: "Afternoon",
    emoji: "☀️",
    slots: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
    display: ["12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"],
  },
  {
    label: "Evening",
    emoji: "🌆",
    slots: ["18:00", "19:00", "20:00", "21:00", "22:00", "23:00"],
    display: ["6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM"],
  },
]

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
  if (c.includes("clean")) return "🧹"
  if (c.includes("cook") || c.includes("food")) return "🍽️"
  return "🌟"
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

function getMinDate(): string {
  return new Date().toISOString().split("T")[0]
}

export default function BookingPage() {
  const router = useRouter()
  const params = useParams()
  const { theme, mounted } = useTheme()

  const [provider, setProvider] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [duration, setDuration] = useState(1)
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    async function fetchProvider() {
      if (!params.providerId) return
      setLoading(true)
      const { data } = await supabase
        .from("providers")
        .select("*")
        .eq("id", params.providerId)
        .maybeSingle()
      setProvider(data)

      // Pre-fill address from user profile
      const userId = localStorage.getItem("heyy_user_id")
      if (userId) {
        const { data: userData } = await supabase
          .from("users")
          .select("address, landmark, village, district")
          .eq("id", userId)
          .single()
        if (userData?.address) {
          const parts = [userData.address, userData.landmark, userData.village, userData.district].filter(Boolean)
          setAddress(parts.join(", "))
        }
      }
      setLoading(false)
    }
    fetchProvider()
  }, [params.providerId])

  const getUnitPrice = (): number => {
    if (!provider) return 0
    if (provider.price_type === "fixed") return provider.fixed_price || 0
    if (provider.price_type === "quote") return 0
    return provider.hourly_rate || 0
  }

  const getTotal = (): number => {
    const price = getUnitPrice()
    if (provider?.price_type === "fixed" || provider?.price_type === "quote") return price
    return price * duration
  }

  const getPriceLabel = (): string => {
    if (!provider) return ""
    if (provider.price_type === "fixed") return `₹${provider.fixed_price} fixed`
    if (provider.price_type === "quote") return "Get Quote"
    return `₹${provider.hourly_rate}/${provider.price_unit || "hr"}`
  }

  const getDurationLabel = (): string => {
    if (!provider) return "hours"
    if (provider.price_type === "daily") return duration === 1 ? "day" : "days"
    return duration === 1 ? "hour" : "hours"
  }

  // Find display label for selected time
  const getTimeDisplay = (): string => {
    for (const group of TIME_GROUPS) {
      const idx = group.slots.indexOf(selectedTime)
      if (idx !== -1) return group.display[idx]
    }
    return selectedTime
  }

  const isFormValid = selectedDate && selectedTime && address.trim()

  const handleProceedToPayment = () => {
    if (!isFormValid) return
    const userId = localStorage.getItem("heyy_user_id") || ""
    const amount = getTotal()
    const priceType = provider?.price_type || "hourly"
    router.push(
      `/payment?providerId=${params.providerId}&amount=${amount}&date=${selectedDate}&time=${encodeURIComponent(getTimeDisplay())}&duration=${duration}&type=${priceType}&address=${encodeURIComponent(address)}&notes=${encodeURIComponent(notes)}&customerId=${userId}`
    )
  }

  if (!mounted || loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#080F1E", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme.bg, fontFamily: "var(--font-dm-sans), sans-serif", maxWidth: "430px", margin: "0 auto", paddingBottom: "120px" }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: theme.headerBg, borderBottom: `1px solid ${theme.borderLight}`, backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", padding: "16px" }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", color: theme.text, padding: "4px 8px 4px 0" }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", fontWeight: 700, color: theme.text, margin: 0 }}>
            Book Service
          </h1>
        </div>
      </header>

      <div style={{ padding: "16px" }}>

        {/* ── Provider Card ── */}
        {provider && (
          <div style={{ padding: "16px", marginBottom: "20px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "16px", display: "flex", gap: "14px", alignItems: "center" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg, #3B82F6, #2563EB)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {provider.profile_photo ? (
                <img src={provider.profile_photo} alt={provider.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "26px" }}>{getEmoji(provider.category || "", provider.service_type || "")}</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "15px", fontWeight: 700, color: theme.text, margin: 0 }}>
                  {provider.full_name}
                </h3>
                {provider.is_verified && <CheckCircle2 size={14} style={{ color: theme.accent }} />}
              </div>
              <p style={{ fontSize: "12px", color: theme.sub, margin: "0 0 4px" }}>{provider.service_type || provider.category}</p>
              <span style={{ fontSize: "14px", fontWeight: 700, color: theme.accent }}>{getPriceLabel()}</span>
            </div>
          </div>
        )}

        {/* ── Date ── */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: theme.sub, marginBottom: "10px", fontFamily: "var(--font-syne), sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            <Calendar size={13} /> Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            min={getMinDate()}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: "100%", padding: "14px 16px", fontSize: "14px", backgroundColor: theme.input, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", outline: "none", boxSizing: "border-box" }}
          />
          {selectedDate && (
            <p style={{ fontSize: "12px", color: theme.accent, marginTop: "6px", fontWeight: 500 }}>
              📅 {formatDate(selectedDate)}
            </p>
          )}
        </div>

        {/* ── Time — Urban Company Style ── */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: theme.sub, fontFamily: "var(--font-syne), sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              <Clock size={13} /> Select Time
            </label>
            {selectedTime && (
              <span style={{ fontSize: "12px", fontWeight: 600, color: theme.accent, backgroundColor: `${theme.accent}15`, padding: "3px 10px", borderRadius: "20px" }}>
                {getTimeDisplay()}
              </span>
            )}
          </div>

          {/* Groups */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {TIME_GROUPS.map((group) => (
              <div key={group.label}>
                {/* Group label */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "14px" }}>{group.emoji}</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: theme.sub }}>{group.label}</span>
                </div>

                {/* Horizontal scroll slots */}
                <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}>
                  {group.slots.map((slot, idx) => {
                    const isSelected = selectedTime === slot
                    return (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        style={{
                          flexShrink: 0,
                          padding: "10px 16px",
                          fontSize: "13px",
                          fontWeight: isSelected ? 600 : 400,
                          borderRadius: "10px",
                          border: isSelected ? "none" : `1px solid ${theme.inputBorder}`,
                          backgroundColor: isSelected ? theme.accent : theme.input,
                          color: isSelected ? "#fff" : theme.sub,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          whiteSpace: "nowrap",
                          boxShadow: isSelected ? "0 4px 12px rgba(59,130,246,0.35)" : "none",
                        }}
                      >
                        {group.display[idx]}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Duration ── */}
        {provider && provider.price_type !== "fixed" && provider.price_type !== "quote" && (
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: theme.sub, marginBottom: "12px", fontFamily: "var(--font-syne), sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              <Users size={13} /> {provider.price_type === "daily" ? "Number of Days" : "Duration (Hours)"}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <button
                onClick={() => setDuration(d => Math.max(1, d - 1))}
                style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, color: theme.text, fontSize: "22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >−</button>
              <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "22px", fontWeight: 700, color: theme.text, minWidth: "40px", textAlign: "center" }}>
                {duration}
              </span>
              <button
                onClick={() => setDuration(d => d + 1)}
                style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: theme.accent, border: "none", color: "#fff", fontSize: "22px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >+</button>
              <span style={{ fontSize: "13px", color: theme.sub }}>{getDurationLabel()}</span>
            </div>
          </div>
        )}

        {/* ── Address ── */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: theme.sub, marginBottom: "10px", fontFamily: "var(--font-syne), sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            <MapPin size={13} /> Service Address
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your complete address where service is needed"
            style={{ width: "100%", padding: "14px 16px", fontSize: "14px", minHeight: "100px", resize: "none", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1.5, backgroundColor: theme.input, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px" }}
          />
        </div>

        {/* ── Notes ── */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: theme.sub, marginBottom: "10px", fontFamily: "var(--font-syne), sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            <FileText size={13} /> Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requirements or instructions..."
            style={{ width: "100%", padding: "14px 16px", fontSize: "14px", minHeight: "80px", resize: "none", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1.5, backgroundColor: theme.input, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px" }}
          />
        </div>

        {/* ── Price Summary ── */}
        {provider && provider.price_type !== "quote" && (
          <div style={{ padding: "16px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "16px" }}>
            <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "13px", fontWeight: 700, color: theme.text, margin: "0 0 12px" }}>Price Summary</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", color: theme.sub }}>
                  {provider.price_type === "fixed"
                    ? "Fixed price"
                    : `₹${getUnitPrice()} × ${duration} ${getDurationLabel()}`}
                </span>
                <span style={{ fontSize: "13px", color: theme.text }}>₹{getTotal()}</span>
              </div>
              <div style={{ height: "1px", backgroundColor: theme.borderLight }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "14px", fontWeight: 700, color: theme.text }}>Total</span>
                <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: theme.accent }}>₹{getTotal()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Button ── */}
      <div className="fixed bottom-0 left-0 right-0" style={{ backgroundColor: theme.headerBg, borderTop: `1px solid ${theme.borderLight}`, padding: "16px", backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: "430px", margin: "0 auto" }}>
          {!selectedDate && (
            <p style={{ fontSize: "12px", color: theme.sub, textAlign: "center", marginBottom: "8px" }}>
              Please select a date and time to continue
            </p>
          )}
          <button
            onClick={handleProceedToPayment}
            disabled={!isFormValid}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "15px",
              fontWeight: 600,
              color: isFormValid ? "white" : theme.sub,
              background: isFormValid ? "linear-gradient(135deg, #3B82F6, #2563EB)" : theme.input,
              border: "none",
              borderRadius: "12px",
              cursor: isFormValid ? "pointer" : "not-allowed",
              boxShadow: isFormValid ? "0 4px 20px rgba(59,130,246,0.4)" : "none",
              transition: "all 0.2s",
            }}
          >
            {provider?.price_type === "quote"
              ? "Request Quote →"
              : isFormValid
              ? `Proceed to Payment · ₹${getTotal()} →`
              : "Select date, time & address"}
          </button>
        </div>
      </div>
    </div>
  )
}

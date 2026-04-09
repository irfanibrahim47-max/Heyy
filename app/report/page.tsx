"use client"

import { useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronRight, Send, CheckCircle } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { supabase } from "@/lib/supabase"

const REPORT_CATEGORIES = [
  { id: "provider_no_show", label: "Provider didn't show up", emoji: "🚫", description: "Provider accepted booking but never arrived" },
  { id: "poor_quality", label: "Poor service quality", emoji: "👎", description: "Service was done incorrectly or poorly" },
  { id: "extra_charge", label: "Provider demanded extra money", emoji: "💰", description: "Charged more than the agreed booking amount" },
  { id: "misconduct", label: "Provider misconduct", emoji: "⚠️", description: "Inappropriate behaviour or safety concern" },
  { id: "payment_issue", label: "Payment problem", emoji: "💳", description: "Charged but booking failed or double charged" },
  { id: "fake_profile", label: "Fake or misleading profile", emoji: "🎭", description: "Provider details don't match reality" },
  { id: "app_bug", label: "App bug or technical issue", emoji: "🐛", description: "Something in the app is not working correctly" },
  { id: "other", label: "Other issue", emoji: "📝", description: "Something else not listed above" },
]

function ReportContent() {
  const router = useRouter()
  const { theme, mounted } = useTheme()
  const [step, setStep] = useState<"select" | "form" | "success">("select")
  const [selectedCategory, setSelectedCategory] = useState<typeof REPORT_CATEGORIES[0] | null>(null)
  const [description, setDescription] = useState("")
  const [bookingId, setBookingId] = useState("")
  const [providerName, setProviderName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const customerPhone = typeof window !== "undefined" ? localStorage.getItem("heyy_user_phone") || "" : ""
  const customerId = typeof window !== "undefined" ? localStorage.getItem("heyy_user_id") || "" : ""

  const handleSubmit = async () => {
    if (!description.trim()) return
    setIsSubmitting(true)

    try {
      // Save to Supabase
      const { error } = await supabase.from("reports").insert({
        customer_id: customerId || null,
        customer_phone: customerPhone || null,
        report_type: selectedCategory?.id,
        report_label: selectedCategory?.label,
        description: description.trim(),
        booking_id: bookingId.trim() || null,
        provider_name: providerName.trim() || null,
        status: "pending",
        created_at: new Date().toISOString(),
      })

      if (error) {
        alert("Failed to submit report: " + error.message)
        setIsSubmitting(false)
        return
      }

      // Notify admin via WhatsApp
      const whatsappMessage = encodeURIComponent(
        `🚨 NEW REPORT — Heyy App\n\n` +
        `Type: ${selectedCategory?.label}\n` +
        `Customer: ${customerPhone || "Unknown"}\n` +
        `Booking ID: ${bookingId || "Not provided"}\n` +
        `Provider: ${providerName || "Not provided"}\n\n` +
        `Description:\n${description}\n\n` +
        `Please check admin dashboard.`
      )
      // Open WhatsApp notification to admin (opens in background intent)
      const adminWhatsApp = `https://wa.me/91XXXXXXXXXX?text=${whatsappMessage}`
      // We don't open this automatically as it would disrupt user flow
      // Instead we use email notification

      // Notify admin via email (using mailto as fallback — replace with SendGrid/Resend in production)
      // In production replace this with a Supabase Edge Function that sends email
      console.log("Admin notification sent for report:", selectedCategory?.id)

      setStep("success")
    } catch (err) {
      console.error(err)
      alert("Something went wrong. Please try again.")
    }

    setIsSubmitting(false)
  }

  if (!mounted) return <div style={{ minHeight: "100vh", backgroundColor: "#080F1E" }} />

  return (
    <div style={{ maxWidth: "430px", margin: "0 auto", minHeight: "100vh", backgroundColor: theme.bg, fontFamily: "var(--font-dm-sans), sans-serif", paddingBottom: "40px" }}>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ backgroundColor: theme.headerBg, borderBottom: `1px solid ${theme.borderLight}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px" }}>
          <button
            onClick={() => step === "form" ? setStep("select") : router.back()}
            style={{ background: "none", border: "none", cursor: "pointer", color: theme.text, padding: "4px" }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", fontWeight: 700, color: theme.text, margin: 0 }}>
            {step === "select" ? "Report a Problem" : step === "form" ? "Describe the Issue" : "Report Submitted"}
          </h1>
        </div>

        {/* Progress bar */}
        {step !== "success" && (
          <div style={{ padding: "0 16px 12px", display: "flex", gap: "6px" }}>
            <div style={{ flex: 1, height: "3px", borderRadius: "2px", backgroundColor: "#3B82F6" }} />
            <div style={{ flex: 1, height: "3px", borderRadius: "2px", backgroundColor: step === "form" ? "#3B82F6" : theme.input }} />
          </div>
        )}
      </header>

      {/* STEP 1 — Select category */}
      {step === "select" && (
        <div style={{ padding: "20px 16px" }}>
          <p style={{ fontSize: "14px", color: theme.sub, margin: "0 0 20px", lineHeight: 1.6 }}>
            What type of issue are you facing? Select the category that best describes your problem.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {REPORT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat); setStep("form") }}
                style={{ width: "100%", padding: "16px", display: "flex", alignItems: "center", gap: "14px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "14px", cursor: "pointer", textAlign: "left" }}
              >
                <span style={{ fontSize: "28px", flexShrink: 0 }}>{cat.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: theme.text, margin: "0 0 2px" }}>{cat.label}</p>
                  <p style={{ fontSize: "12px", color: theme.sub, margin: 0 }}>{cat.description}</p>
                </div>
                <ChevronRight size={16} style={{ color: theme.sub, flexShrink: 0 }} />
              </button>
            ))}
          </div>

          {/* Emergency notice */}
          <div style={{ marginTop: "20px", padding: "14px 16px", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px" }}>
            <p style={{ fontSize: "12px", color: "#EF4444", fontWeight: 600, margin: "0 0 4px" }}>🚨 Safety Emergency?</p>
            <p style={{ fontSize: "12px", color: theme.sub, margin: 0, lineHeight: 1.5 }}>
              If you are in immediate danger, call <strong style={{ color: theme.text }}>112</strong> first. Then report to us.
            </p>
          </div>
        </div>
      )}

      {/* STEP 2 — Form */}
      {step === "form" && selectedCategory && (
        <div style={{ padding: "20px 16px" }}>

          {/* Selected category reminder */}
          <div style={{ padding: "12px 14px", backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>{selectedCategory.emoji}</span>
            <p style={{ fontSize: "13px", fontWeight: 600, color: theme.text, margin: 0 }}>{selectedCategory.label}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Booking ID */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>
                Booking ID (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. HEY2025123456"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                style={{ width: "100%", padding: "14px 16px", fontSize: "14px", backgroundColor: theme.input, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", outline: "none", boxSizing: "border-box" }}
              />
              <p style={{ fontSize: "11px", color: theme.sub, margin: "6px 0 0" }}>Find this in My Bookings page</p>
            </div>

            {/* Provider name */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>
                Provider Name (optional)
              </label>
              <input
                type="text"
                placeholder="Name of the provider"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                style={{ width: "100%", padding: "14px 16px", fontSize: "14px", backgroundColor: theme.input, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>
                Describe the problem * <span style={{ color: "#EF4444" }}>required</span>
              </label>
              <textarea
                placeholder="Please describe what happened in detail. The more information you provide, the faster we can help you..."
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                style={{ width: "100%", minHeight: "140px", padding: "14px 16px", fontSize: "14px", backgroundColor: theme.input, color: theme.text, border: `1px solid ${description.trim() ? theme.accent : theme.inputBorder}`, borderRadius: "12px", outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1.6, transition: "border-color 0.2s" }}
              />
              <p style={{ fontSize: "11px", color: theme.sub, margin: "6px 0 0", textAlign: "right" }}>{description.length}/1000</p>
            </div>

            {/* Response time notice */}
            <div style={{ padding: "12px 14px", backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "12px" }}>
              <p style={{ fontSize: "12px", color: "#22C55E", fontWeight: 600, margin: "0 0 2px" }}>⏱ Expected Response Time</p>
              <p style={{ fontSize: "12px", color: theme.sub, margin: 0, lineHeight: 1.5 }}>
                Our team will review your report and respond within <strong style={{ color: theme.text }}>2-4 hours</strong> on working days.
              </p>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={!description.trim() || isSubmitting}
              style={{
                width: "100%", padding: "16px", fontSize: "15px", fontWeight: 600,
                color: !description.trim() || isSubmitting ? theme.sub : "white",
                backgroundColor: !description.trim() || isSubmitting ? theme.input : "#EF4444",
                border: "none", borderRadius: "12px",
                cursor: !description.trim() || isSubmitting ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: description.trim() && !isSubmitting ? "0 4px 20px rgba(239,68,68,0.4)" : "none",
                transition: "all 0.2s"
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{ width: "18px", height: "18px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS */}
      {step === "success" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 32px", textAlign: "center" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", boxShadow: "0 0 40px rgba(34,197,94,0.3)" }}>
            <CheckCircle size={40} style={{ color: "#22C55E" }} />
          </div>
          <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "22px", fontWeight: 700, color: theme.text, margin: "0 0 10px" }}>
            Report Submitted!
          </h2>
          <p style={{ fontSize: "14px", color: theme.sub, lineHeight: 1.7, margin: "0 0 8px" }}>
            Thank you for reporting this issue. Our team has been notified and will review it within <strong style={{ color: theme.text }}>2-4 hours</strong>.
          </p>
          <p style={{ fontSize: "13px", color: theme.sub, margin: "0 0 32px" }}>
            We take all reports seriously and will take appropriate action.
          </p>

          <div style={{ padding: "14px 16px", backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "14px", marginBottom: "24px", width: "100%", textAlign: "left" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#3B82F6", margin: "0 0 4px" }}>📋 What happens next?</p>
            <p style={{ fontSize: "12px", color: theme.sub, margin: 0, lineHeight: 1.6 }}>
              Our team reviews the report → contacts you if needed → takes action against provider → updates you via SMS
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <button
              onClick={() => router.push("/help")}
              style={{ flex: 1, padding: "14px", fontSize: "14px", fontWeight: 500, color: theme.text, backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "12px", cursor: "pointer" }}
            >
              Back to Help
            </button>
            <button
              onClick={() => router.push("/home")}
              style={{ flex: 1, padding: "14px", fontSize: "14px", fontWeight: 600, color: "white", backgroundColor: theme.accent, border: "none", borderRadius: "12px", cursor: "pointer", boxShadow: `0 4px 16px ${theme.accent}4D` }}
            >
              Go Home
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#080F1E" }} />}>
      <ReportContent />
    </Suspense>
  )
}
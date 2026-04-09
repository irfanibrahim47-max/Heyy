"use client"

import { useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Send, CheckCircle, ChevronRight } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { supabase } from "@/lib/supabase"

const REFUND_REASONS = [
  { id: "provider_cancelled", label: "Provider cancelled my booking", emoji: "❌" },
  { id: "provider_no_show", label: "Provider didn't show up", emoji: "🚫" },
  { id: "poor_quality", label: "Service quality was unacceptable", emoji: "👎" },
  { id: "wrong_charge", label: "I was charged incorrectly", emoji: "💰" },
  { id: "double_charge", label: "I was charged twice", emoji: "💳" },
  { id: "cancelled_in_time", label: "I cancelled before 2 hours", emoji: "⏰" },
  { id: "other", label: "Other reason", emoji: "📝" },
]

function RefundContent() {
  const router = useRouter()
  const { theme, mounted } = useTheme()
  const [step, setStep] = useState<"select" | "form" | "success">("select")
  const [selectedReason, setSelectedReason] = useState<typeof REFUND_REASONS[0] | null>(null)
  const [bookingId, setBookingId] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [upiId, setUpiId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const customerPhone = typeof window !== "undefined" ? localStorage.getItem("heyy_user_phone") || "" : ""
  const customerId = typeof window !== "undefined" ? localStorage.getItem("heyy_user_id") || "" : ""

  const handleSubmit = async () => {
    if (!bookingId.trim() || !description.trim()) return
    setIsSubmitting(true)

    try {
      const { error } = await supabase.from("refund_requests").insert({
        customer_id: customerId || null,
        customer_phone: customerPhone || null,
        booking_id: bookingId.trim(),
        reason: selectedReason?.label,
        reason_id: selectedReason?.id,
        description: description.trim(),
        amount: parseFloat(amount) || null,
        upi_id: upiId.trim() || null,
        status: "pending",
        created_at: new Date().toISOString(),
      })

      if (error) {
        alert("Failed to submit refund request: " + error.message)
        setIsSubmitting(false)
        return
      }

      console.log("Refund request saved, admin notified")
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
            {step === "select" ? "Request Refund" : step === "form" ? "Refund Details" : "Request Submitted"}
          </h1>
        </div>
        {step !== "success" && (
          <div style={{ padding: "0 16px 12px", display: "flex", gap: "6px" }}>
            <div style={{ flex: 1, height: "3px", borderRadius: "2px", backgroundColor: "#F59E0B" }} />
            <div style={{ flex: 1, height: "3px", borderRadius: "2px", backgroundColor: step === "form" ? "#F59E0B" : theme.input }} />
          </div>
        )}
      </header>

      {/* Refund policy banner */}
      {step === "select" && (
        <div style={{ margin: "16px 16px 0", padding: "14px 16px", backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "14px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#F59E0B", margin: "0 0 6px" }}>📋 Refund Policy</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#22C55E", flexShrink: 0 }} />
              <p style={{ fontSize: "12px", color: theme.sub, margin: 0 }}>Cancel <strong style={{ color: theme.text }}>before 2 hours</strong> → Full refund</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#F59E0B", flexShrink: 0 }} />
              <p style={{ fontSize: "12px", color: theme.sub, margin: 0 }}>Cancel <strong style={{ color: theme.text }}>after 2 hours</strong> → 90% refund</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#EF4444", flexShrink: 0 }} />
              <p style={{ fontSize: "12px", color: theme.sub, margin: 0 }}><strong style={{ color: theme.text }}>No show</strong> → No refund</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1 — Select reason */}
      {step === "select" && (
        <div style={{ padding: "16px" }}>
          <p style={{ fontSize: "14px", color: theme.sub, margin: "0 0 16px", lineHeight: 1.6 }}>
            Why are you requesting a refund?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {REFUND_REASONS.map((reason) => (
              <button
                key={reason.id}
                onClick={() => { setSelectedReason(reason); setStep("form") }}
                style={{ width: "100%", padding: "16px", display: "flex", alignItems: "center", gap: "14px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "14px", cursor: "pointer", textAlign: "left" }}
              >
                <span style={{ fontSize: "24px", flexShrink: 0 }}>{reason.emoji}</span>
                <p style={{ fontSize: "14px", fontWeight: 500, color: theme.text, margin: 0, flex: 1 }}>{reason.label}</p>
                <ChevronRight size={16} style={{ color: theme.sub, flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2 — Form */}
      {step === "form" && selectedReason && (
        <div style={{ padding: "20px 16px" }}>

          <div style={{ padding: "12px 14px", backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>{selectedReason.emoji}</span>
            <p style={{ fontSize: "13px", fontWeight: 600, color: theme.text, margin: 0 }}>{selectedReason.label}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>
                Booking ID * <span style={{ color: "#EF4444" }}>required</span>
              </label>
              <input
                type="text"
                placeholder="e.g. HEY2025123456"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                style={{ width: "100%", padding: "14px 16px", fontSize: "14px", backgroundColor: theme.input, color: theme.text, border: `1px solid ${bookingId.trim() ? theme.accent : theme.inputBorder}`, borderRadius: "12px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
              />
              <p style={{ fontSize: "11px", color: theme.sub, margin: "6px 0 0" }}>Find this in My Bookings page</p>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>
                Refund Amount (₹)
              </label>
              <input
                type="number"
                placeholder="Amount you paid"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ width: "100%", padding: "14px 16px", fontSize: "14px", backgroundColor: theme.input, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>
                Your UPI ID (for refund)
              </label>
              <input
                type="text"
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                style={{ width: "100%", padding: "14px 16px", fontSize: "14px", backgroundColor: theme.input, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", outline: "none", boxSizing: "border-box" }}
              />
              <p style={{ fontSize: "11px", color: theme.sub, margin: "6px 0 0" }}>Refund will be sent to this UPI ID</p>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>
                Additional Details * <span style={{ color: "#EF4444" }}>required</span>
              </label>
              <textarea
                placeholder="Describe what happened and why you deserve a refund..."
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 800))}
                style={{ width: "100%", minHeight: "120px", padding: "14px 16px", fontSize: "14px", backgroundColor: theme.input, color: theme.text, border: `1px solid ${description.trim() ? theme.accent : theme.inputBorder}`, borderRadius: "12px", outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1.6, transition: "border-color 0.2s" }}
              />
              <p style={{ fontSize: "11px", color: theme.sub, margin: "6px 0 0", textAlign: "right" }}>{description.length}/800</p>
            </div>

            <div style={{ padding: "12px 14px", backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px" }}>
              <p style={{ fontSize: "12px", color: "#3B82F6", fontWeight: 600, margin: "0 0 2px" }}>⏱ Refund Timeline</p>
              <p style={{ fontSize: "12px", color: theme.sub, margin: 0, lineHeight: 1.5 }}>
                After approval: UPI — instant, Card — 5-7 days, Net Banking — 3-5 days
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!bookingId.trim() || !description.trim() || isSubmitting}
              style={{
                width: "100%", padding: "16px", fontSize: "15px", fontWeight: 600,
                color: (!bookingId.trim() || !description.trim() || isSubmitting) ? theme.sub : "white",
                backgroundColor: (!bookingId.trim() || !description.trim() || isSubmitting) ? theme.input : "#F59E0B",
                border: "none", borderRadius: "12px",
                cursor: (!bookingId.trim() || !description.trim() || isSubmitting) ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: (bookingId.trim() && description.trim() && !isSubmitting) ? "0 4px 20px rgba(245,158,11,0.4)" : "none",
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
                  Submit Refund Request
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS */}
      {step === "success" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 32px", textAlign: "center" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", boxShadow: "0 0 40px rgba(245,158,11,0.3)" }}>
            <CheckCircle size={40} style={{ color: "#F59E0B" }} />
          </div>
          <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "22px", fontWeight: 700, color: theme.text, margin: "0 0 10px" }}>
            Refund Request Submitted!
          </h2>
          <p style={{ fontSize: "14px", color: theme.sub, lineHeight: 1.7, margin: "0 0 8px" }}>
            Our team will review your request and process the refund within <strong style={{ color: theme.text }}>24-48 hours</strong>.
          </p>
          <p style={{ fontSize: "13px", color: theme.sub, margin: "0 0 32px" }}>
            You will receive an SMS update once the refund is processed.
          </p>

          <div style={{ padding: "14px 16px", backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "14px", marginBottom: "24px", width: "100%", textAlign: "left" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#F59E0B", margin: "0 0 4px" }}>📋 Next Steps</p>
            <p style={{ fontSize: "12px", color: theme.sub, margin: 0, lineHeight: 1.6 }}>
              Team reviews request → verifies booking → approves refund → money sent to your UPI ID
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

export default function RefundPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#080F1E" }} />}>
      <RefundContent />
    </Suspense>
  )
}
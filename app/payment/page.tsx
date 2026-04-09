"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, CreditCard, Smartphone, Building2, Wallet, Clock, Banknote, ChevronRight, Shield } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { supabase } from "@/lib/supabase"

const paymentMethods = [
  { id: "upi", name: "UPI", description: "Google Pay, PhonePe, Paytm", icon: Smartphone, popular: true },
  { id: "card", name: "Credit / Debit Card", description: "Visa, Mastercard, Rupay", icon: CreditCard, popular: false },
  { id: "netbanking", name: "Net Banking", description: "All major banks supported", icon: Building2, popular: false },
  { id: "wallet", name: "Wallet", description: "Paytm, Amazon Pay, Mobikwik", icon: Wallet, popular: false },
  { id: "emi", name: "EMI", description: "No cost EMI available", icon: Clock, popular: false },
  { id: "cash", name: "Pay on Service", description: "Cash after service completion", icon: Banknote, popular: false },
]

const upiApps = [
  { id: "gpay", name: "Google Pay", color: "#4285F4" },
  { id: "phonepe", name: "PhonePe", color: "#5F259F" },
  { id: "paytm", name: "Paytm", color: "#00BAF2" },
  { id: "bhim", name: "BHIM", color: "#00796B" },
]

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, mounted } = useTheme()
  const [selectedMethod, setSelectedMethod] = useState("upi")
  const [upiId, setUpiId] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [provider, setProvider] = useState<any>(null)

  // Read booking details from URL params
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
        .select("full_name, service_type, price_unit, price_type")
        .eq("id", providerId)
        .single()
      if (data) setProvider(data)
    }
    fetchProvider()
  }, [providerId])

  const providerPriceType = provider?.price_type || type
  const priceUnit = provider?.price_unit || 'hr'
  const durationLabel = providerPriceType === 'hourly'
    ? `${duration} hour${Number(duration) > 1 ? 's' : ''}`
    : providerPriceType === 'daily'
    ? `${duration} day${Number(duration) > 1 ? 's' : ''}`
    : `${duration} ${priceUnit}`

  const durationTitle = (providerPriceType === 'hourly' || providerPriceType === 'daily') ? 'Duration' : 'Quantity'

  const handlePayment = () => {
    setIsProcessing(true)
    setTimeout(() => {
      router.push(`/booking/confirmed?providerId=${providerId}&amount=${amount}&date=${date}&time=${time}`)
    }, 1500)
  }

  if (!mounted) return <div style={{ minHeight: "100vh", maxWidth: "430px", margin: "0 auto", backgroundColor: "#080F1E" }} />

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: theme.bg, fontFamily: "var(--font-dm-sans), sans-serif", maxWidth: "430px", margin: "0 auto" }}>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ backgroundColor: theme.headerBg, borderBottom: `1px solid ${theme.borderLight}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px" }}>
          <button onClick={() => router.back()} style={{ color: theme.text, background: "none", border: "none", cursor: "pointer", padding: "8px", borderRadius: "12px" }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.text, fontSize: "18px", fontWeight: 700, margin: 0 }}>Payment</h1>
          <div style={{ width: "36px" }} />
        </div>
      </header>

      {/* Booking Summary */}
      <div style={{ padding: "20px 16px 16px" }}>
        <div style={{ padding: "16px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <h3 style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.text, fontSize: "14px", fontWeight: 700, margin: 0 }}>Booking Summary</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: theme.sub }}>Service Provider</span>
              <span style={{ fontSize: "12px", fontWeight: 500, color: theme.text }}>{provider?.full_name || "Loading..."}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: theme.sub }}>Service</span>
              <span style={{ fontSize: "12px", fontWeight: 500, color: theme.text }}>{provider?.service_type || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: theme.sub }}>Date</span>
              <span style={{ fontSize: "12px", fontWeight: 500, color: theme.text }}>{date} {time}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: theme.sub }}>{durationTitle}</span>
              <span style={{ fontSize: "12px", fontWeight: 500, color: theme.text }}>{durationLabel}</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${theme.borderLight}` }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: theme.text }}>Total Amount</span>
            <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: theme.accent }}>₹{amount}</span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div style={{ padding: "0 16px 20px" }}>
        <h3 style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.text, fontSize: "14px", fontWeight: 700, margin: "0 0 16px" }}>Payment Method</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {paymentMethods.map((method) => {
            const Icon = method.icon
            const isSelected = selectedMethod === method.id
            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                style={{ width: "100%", padding: "16px", display: "flex", alignItems: "center", gap: "16px", backgroundColor: theme.card, border: `1px solid ${isSelected ? theme.accent : theme.cardBorder}`, boxShadow: isSelected ? `0 0 0 1px ${theme.accent}` : "none", borderRadius: "16px", cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: isSelected ? theme.accent : theme.input, borderRadius: "12px", flexShrink: 0 }}>
                  <Icon className="w-5 h-5" style={{ color: isSelected ? "#fff" : theme.sub }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: theme.text, margin: 0 }}>{method.name}</p>
                    {method.popular && (
                      <span style={{ fontSize: "9px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", backgroundColor: `${theme.success}1A`, color: theme.success }}>Popular</span>
                    )}
                  </div>
                  <p style={{ fontSize: "11px", color: theme.sub, margin: "2px 0 0" }}>{method.description}</p>
                </div>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${isSelected ? theme.accent : theme.inputBorder}`, backgroundColor: isSelected ? theme.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {isSelected && <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "white" }} />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* UPI Apps */}
      {selectedMethod === "upi" && (
        <div style={{ padding: "0 16px 20px" }}>
          <div style={{ padding: "16px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "16px" }}>
            <h4 style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.text, fontSize: "13px", fontWeight: 700, margin: "0 0 16px" }}>Select UPI App</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
              {upiApps.map((app) => (
                <button key={app.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "12px 0", background: "none", border: "none", cursor: "pointer", borderRadius: "12px" }}>
                  <div style={{ width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: app.color, borderRadius: "12px", color: "white", fontSize: "10px", fontWeight: 700 }}>
                    {app.name.charAt(0)}
                  </div>
                  <span style={{ fontSize: "10px", color: theme.sub }}>{app.name}</span>
                </button>
              ))}
            </div>
            <div style={{ position: "relative", textAlign: "center", margin: "16px 0" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: "1px", backgroundColor: theme.borderLight }} />
              <span style={{ position: "relative", fontSize: "11px", color: theme.sub, backgroundColor: theme.card, padding: "0 12px" }}>Or enter UPI ID</span>
            </div>
            <input
              type="text"
              placeholder="yourname@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              style={{ width: "100%", padding: "14px", fontSize: "13px", backgroundColor: theme.input, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>
      )}

      {/* Card Details */}
      {selectedMethod === "card" && (
        <div style={{ padding: "0 16px 20px" }}>
          <div style={{ padding: "16px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "16px" }}>
            <h4 style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.text, fontSize: "13px", fontWeight: 700, margin: "0 0 16px" }}>Card Details</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input type="text" placeholder="Card Number" style={{ width: "100%", padding: "14px", fontSize: "13px", backgroundColor: theme.input, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", outline: "none", boxSizing: "border-box" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <input type="text" placeholder="MM/YY" style={{ padding: "14px", fontSize: "13px", backgroundColor: theme.input, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", outline: "none" }} />
                <input type="text" placeholder="CVV" style={{ padding: "14px", fontSize: "13px", backgroundColor: theme.input, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", outline: "none" }} />
              </div>
              <input type="text" placeholder="Name on Card" style={{ width: "100%", padding: "14px", fontSize: "13px", backgroundColor: theme.input, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
        </div>
      )}

      {/* Security note */}
      <div style={{ padding: "0 16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", backgroundColor: `${theme.accent}1A`, border: `1px solid ${theme.accent}33`, borderRadius: "12px" }}>
          <Shield className="w-5 h-5" style={{ color: theme.accent, flexShrink: 0 }} />
          <p style={{ fontSize: "11px", color: theme.sub, margin: 0 }}>Your payment is secured with 256-bit encryption</p>
        </div>
      </div>

      {/* Pay button */}
      <div className="fixed bottom-0 left-0 right-0 backdrop-blur-xl" style={{ backgroundColor: theme.headerBg, borderTop: `1px solid ${theme.borderLight}`, padding: "16px" }}>
        <div style={{ maxWidth: "430px", margin: "0 auto" }}>
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            style={{ width: "100%", padding: "16px", fontSize: "14px", fontWeight: 600, color: "white", backgroundColor: theme.accent, border: "none", borderRadius: "12px", cursor: isProcessing ? "not-allowed" : "pointer", opacity: isProcessing ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: `0 4px 16px ${theme.accent}4D` }}
          >
            {isProcessing ? (
              <>
                <div style={{ width: "20px", height: "20px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Processing...
              </>
            ) : (
              <>
                Pay ₹{amount}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#080F1E" }} />}>
      <PaymentContent />
    </Suspense>
  )
}
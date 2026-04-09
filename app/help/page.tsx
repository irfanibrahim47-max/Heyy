"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronDown, ChevronUp, MessageCircle, Phone, Star, AlertCircle, RefreshCw, Search } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"

const faqs = [
  // BOOKING
  {
    category: "📅 Booking",
    questions: [
      {
        q: "How do I book a service?",
        a: "Go to Home or Search → find a provider → tap 'Book Now' → select your date, time and duration → enter your address → tap 'Proceed to Payment' → complete payment → booking confirmed!"
      },
      {
        q: "Can I book a service for someone else at a different address?",
        a: "Yes. When entering the service address during booking, simply enter the address where you want the service to be provided. It does not have to be your own address."
      },
      {
        q: "How far in advance can I book?",
        a: "You can book up to 14 days in advance. For same-day bookings, make sure the provider is marked 'Available Today'."
      },
      {
        q: "Can I book multiple services in one booking?",
        a: "Currently each booking is for one provider and one service. For multiple services, please make separate bookings."
      },
      {
        q: "What is the difference between hourly and daily booking?",
        a: "Hourly booking means you pay per hour — ideal for small tasks. Daily booking means the provider works a full day at your location — better value for large jobs. Some providers also offer per unit, per work, or per kg pricing based on their service type."
      },
      {
        q: "What does 'Get Quote' mean?",
        a: "Some providers like construction workers or interior designers offer custom pricing based on the scope of work. When you tap 'Book Now' on these providers, you will be connected with them directly to discuss the price before confirming."
      },
      {
        q: "How do I know if a provider is available today?",
        a: "Providers marked with a green 'Available Today' badge on their card are available for same-day booking. You can also use the 'Available Today' filter on the Search page."
      },
      {
        q: "Can I schedule a booking for a specific time?",
        a: "Yes. On the booking form, you can select any time slot from 8:00 AM to 6:00 PM in one-hour intervals."
      },
    ]
  },

  // PAYMENTS
  {
    category: "💳 Payments & Pricing",
    questions: [
      {
        q: "What payment methods are accepted?",
        a: "We accept UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, Wallets (Paytm, Amazon Pay), EMI, and Cash on Service completion."
      },
      {
        q: "Is it safe to pay on Heyy?",
        a: "Yes. All online payments are processed through Razorpay, which uses 256-bit SSL encryption — the same security standard used by banks. We never store your card details."
      },
      {
        q: "Can I pay cash after the service is done?",
        a: "Yes. Select 'Pay on Service' during checkout. You pay cash directly to the provider after the service is completed to your satisfaction."
      },
      {
        q: "Why is the amount shown different from what the provider charges?",
        a: "The total includes a small platform fee and GST (18%) on the platform fee as per Government of India regulations. The provider's share is the base amount. We are fully transparent — you can see the full breakdown on the payment screen."
      },
      {
        q: "What is TCS and why is it charged?",
        a: "TCS (Tax Collected at Source) of 1% is collected by us as required by Indian law for marketplace platforms. This can be claimed as a tax credit when you file your income tax return."
      },
      {
        q: "I was charged but the booking failed. What do I do?",
        a: "Don't worry. If payment was deducted but booking was not confirmed, the amount will be automatically refunded to your original payment method within 5-7 business days. If not received, please contact our support team with your transaction ID."
      },
      {
        q: "Can I get a receipt or invoice for my booking?",
        a: "Yes. After every completed booking, a payment receipt is available in My Bookings. Tap the booking → tap Share to download or send the receipt."
      },
    ]
  },

  // CANCELLATION & REFUNDS
  {
    category: "🔄 Cancellation & Refunds",
    questions: [
      {
        q: "Can I cancel a booking?",
        a: "Yes. Go to My Bookings → tap the booking → tap Cancel. Cancellations made more than 2 hours before the scheduled time get a full refund. Cancellations within 2 hours may incur a cancellation fee of 10% of the booking amount."
      },
      {
        q: "What if the provider cancels my booking?",
        a: "If a provider cancels, you will receive a full refund within 3-5 business days. We will also help you find a replacement provider immediately. Providers who frequently cancel are removed from our platform."
      },
      {
        q: "How long does a refund take?",
        a: "Refunds are processed within 24 hours from our end. Depending on your bank or payment method: UPI — instant to 24 hours, Credit/Debit Card — 5-7 business days, Net Banking — 3-5 business days, Wallets — instant."
      },
      {
        q: "The service was not done properly. Can I get a refund?",
        a: "Yes. If the service quality was unsatisfactory, report it within 24 hours of service completion. Go to Help & Support → Report a Problem → Service Quality Issue. Our team will review and process a refund or arrange a free redo service."
      },
      {
        q: "The provider did not show up. What do I do?",
        a: "If the provider does not arrive within 30 minutes of the scheduled time without notice, tap 'Report a Problem' → 'Provider Did Not Arrive'. You will receive a full refund and we will take action against the provider."
      },
    ]
  },

  // PROVIDERS
  {
    category: "👷 Service Providers",
    questions: [
      {
        q: "How are providers verified on Heyy?",
        a: "Every provider goes through a verification process: phone number verification via OTP, identity check (Aadhaar), and manual review by our team within 24-48 hours. Verified providers show a blue tick on their profile. We also monitor ratings and reviews continuously."
      },
      {
        q: "What does the blue tick mean on a provider's profile?",
        a: "The blue tick means the provider's identity has been verified by our team. Their Aadhaar has been checked and they have passed our background screening."
      },
      {
        q: "What does 'New Provider' mean?",
        a: "New Provider means this provider recently joined Heyy and has not received any customer ratings yet. This does not mean they are inexperienced — many skilled providers are new to our platform. Check their years of experience and service description."
      },
      {
        q: "Can I see a provider's previous work or portfolio?",
        a: "Yes. Go to the provider's profile → tap the Portfolio tab to see their previous work. You can also read customer reviews in the Reviews tab."
      },
      {
        q: "How do I contact a provider before booking?",
        a: "After booking, you can call or chat with the provider directly from the Booking Confirmed screen or from My Bookings. Direct contact before booking is not available to protect both parties."
      },
      {
        q: "The provider asked for extra money beyond the booking amount. What should I do?",
        a: "Do not pay any amount beyond what was agreed on the booking. If a provider demands extra payment unfairly, report it immediately through Help & Support → Report a Problem → Provider Demanded Extra Money. This is a serious violation of our policies."
      },
      {
        q: "Can I request a specific provider again?",
        a: "Yes. Search for their name or service, find their profile and book directly. You can also save providers as favourites by tapping the heart icon on their profile."
      },
    ]
  },

  // RATINGS & REVIEWS
  {
    category: "⭐ Ratings & Reviews",
    questions: [
      {
        q: "How does the rating system work?",
        a: "After a service is completed, customers can rate the provider from 1 to 5 stars and leave a written review. The provider's overall rating is the average of all their reviews. Ratings directly affect how prominently a provider appears in search results."
      },
      {
        q: "Can I edit or delete my review?",
        a: "You can edit your review within 24 hours of submitting it. Go to My Bookings → completed booking → Edit Review. After 24 hours, reviews cannot be changed to maintain authenticity."
      },
      {
        q: "I gave a wrong rating by mistake. Can it be corrected?",
        a: "Yes. Contact our support team within 24 hours with your booking ID and the correct rating you intended to give. We will update it for you."
      },
      {
        q: "Can providers see who left a review?",
        a: "Reviews show only the customer's first name and last initial (e.g., Irfan A.). Full names and contact details are never shared with providers."
      },
      {
        q: "What happens if a provider has consistently bad reviews?",
        a: "Providers with a rating below 3.0 are flagged for review by our team. If the low rating is confirmed as genuine, the provider is suspended or removed from the platform."
      },
    ]
  },

  // REGISTRATION AS PROVIDER
  {
    category: "💼 Becoming a Provider",
    questions: [
      {
        q: "How do I register as a service provider?",
        a: "Tap 'Service Provider' on the welcome screen → complete 4 steps: Personal Details, Service Category, Experience & Pricing, Service Area → submit. Our team reviews your profile within 24-48 hours and you receive an SMS once approved."
      },
      {
        q: "What documents do I need to register?",
        a: "You need a valid phone number for OTP verification and an Aadhaar card for identity verification. Additional certifications (if any) can be uploaded to build customer trust."
      },
      {
        q: "How long does provider approval take?",
        a: "Our team reviews every provider application within 24-48 hours. You will receive an SMS notification once your profile is approved and visible to customers."
      },
      {
        q: "How do I set my service area?",
        a: "During registration Step 4, you can choose 'My Nearby Area' (auto-detects your location, you set a radius from 5km to 50km) or 'Anywhere in Kerala' if you are willing to travel anywhere in the state."
      },
      {
        q: "What pricing types can I set?",
        a: "You can choose from 8 pricing types: Per Hour, Per Day, Per Unit (e.g. per tree, per room), Per Work (e.g. per hand, per event), Per Kg/Quantity, Per Km/Trip, Package (e.g. monthly), or Quote/Negotiable. Set the type that best fits your service."
      },
      {
        q: "Can I offer multiple services?",
        a: "Yes. During registration, you can select multiple services from your category. For example, a plumber can offer Pipe Repair, Tap Installation, and Bathroom Fitting all in one profile."
      },
      {
        q: "How do I receive bookings?",
        a: "Once approved, your profile appears in search results and category listings. Customers can book you directly. You will receive an SMS notification for every new booking. Check My Bookings regularly."
      },
      {
        q: "What commission does Heyy charge providers?",
        a: "Heyy charges a commission on each booking: 4% for bookings up to ₹1000, 3.8% for ₹1001-₹5000, 3.5% for ₹5001-₹20000, and 3% for bookings above ₹20000. GST of 18% applies on the commission amount."
      },
      {
        q: "When and how do I get paid?",
        a: "For online payments, your earnings (after commission) are transferred to your registered bank account within 2-3 business days after service completion. For cash payments, you collect directly from the customer."
      },
    ]
  },

  // ACCOUNT & APP
  {
    category: "📱 Account & App",
    questions: [
      {
        q: "How do I change my phone number?",
        a: "Go to Profile → Settings → Account → Change Phone Number. You will need to verify both your old and new number via OTP."
      },
      {
        q: "I forgot my account — how do I log in?",
        a: "Heyy uses phone number + OTP login — there is no password to forget. Simply enter your phone number on the welcome screen and we will send a new OTP."
      },
      {
        q: "How do I delete my account?",
        a: "Go to Profile → Settings → Account → Delete Account. Note: deleting your account will permanently remove all your booking history and you cannot recover it. Active bookings must be completed or cancelled first."
      },
      {
        q: "Is my personal data safe?",
        a: "Yes. We follow strict data privacy standards. Your personal information is encrypted and never sold to third parties. We only share your name and phone with a provider after a confirmed booking."
      },
      {
        q: "The app is showing wrong location. How do I fix it?",
        a: "Go to your phone Settings → Apps → Heyy → Permissions → Location → Allow. Then restart the app. If the issue continues, go to Profile → Settings → Location → and manually select your district."
      },
      {
        q: "Which districts in Kerala does Heyy cover?",
        a: "Heyy covers all 14 Kerala districts: Thiruvananthapuram, Kollam, Pathanamthitta, Alappuzha, Kottayam, Idukki, Ernakulam, Thrissur, Palakkad, Malappuram, Kozhikode, Wayanad, Kannur, and Kasaragod."
      },
      {
        q: "Is Heyy available outside Kerala?",
        a: "Currently Heyy operates only within Kerala. We plan to expand to other states after establishing a strong presence in Kerala. NRI customers abroad can book services for their families in Kerala using the NRI Services category."
      },
    ]
  },

  // SAFETY
  {
    category: "🛡️ Safety & Trust",
    questions: [
      {
        q: "What should I do if I feel unsafe during a service?",
        a: "Your safety is our top priority. If you feel unsafe at any point, end the service immediately and move to a safe location. Call emergency services (112) if needed. Then report the incident to us immediately via Help & Support → Emergency Report. We take all safety reports extremely seriously."
      },
      {
        q: "Are providers background checked?",
        a: "All providers go through Aadhaar-based identity verification before being approved. We also monitor ratings, reviews, and reports continuously. Providers with safety concerns are immediately suspended pending investigation."
      },
      {
        q: "What if a provider behaves inappropriately?",
        a: "Report it immediately. Go to Help & Support → Report a Problem → Provider Misconduct. Provide the booking ID and details. We will suspend the provider immediately and contact you within 1 hour. For serious incidents, we cooperate fully with law enforcement."
      },
      {
        q: "Should I share my full address with the provider before booking?",
        a: "Your address is only shared with the provider after payment is confirmed. Before booking, providers can only see your general district. Never share your personal address on chat before confirming a booking."
      },
    ]
  },
]

export default function HelpSupportPage() {
  const router = useRouter()
  const { theme, mounted } = useTheme()
  const [openCategory, setOpenCategory] = useState<string | null>("📅 Booking")
  const [openQuestion, setOpenQuestion] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  if (!mounted) return <div style={{ minHeight: "100vh", backgroundColor: "#080F1E" }} />

  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q =>
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0)

  return (
    <div style={{ maxWidth: "430px", margin: "0 auto", minHeight: "100vh", backgroundColor: theme.bg, fontFamily: "var(--font-dm-sans), sans-serif", paddingBottom: "40px" }}>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ backgroundColor: theme.headerBg, borderBottom: `1px solid ${theme.borderLight}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px" }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", color: theme.text, padding: "8px", borderRadius: "12px" }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", fontWeight: 700, color: theme.text, margin: 0 }}>Help & Support</h1>
          <div style={{ width: "36px" }} />
        </div>
      </header>

      {/* Contact options */}
      <div style={{ padding: "20px 16px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <button
            onClick={() => window.open("https://wa.me/919XXXXXXXXX?text=Hi, I need help with my Heyy booking", "_blank")}
            style={{ padding: "16px", backgroundColor: "#25D366", border: "none", borderRadius: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <MessageCircle size={20} color="white" />
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "white", margin: 0 }}>WhatsApp</p>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.8)", margin: 0 }}>Reply in 1 hour</p>
            </div>
          </button>
          <button
            onClick={() => window.location.href = "tel:+919XXXXXXXXX"}
            style={{ padding: "16px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <Phone size={20} style={{ color: theme.accent }} />
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: theme.text, margin: 0 }}>Call Us</p>
              <p style={{ fontSize: "10px", color: theme.sub, margin: 0 }}>8AM – 8PM</p>
            </div>
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
          <button
            onClick={() => router.push("/report")}
            style={{ padding: "16px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <AlertCircle size={20} style={{ color: "#EF4444" }} />
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: theme.text, margin: 0 }}>Report</p>
              <p style={{ fontSize: "10px", color: theme.sub, margin: 0 }}>Issue / Problem</p>
            </div>
          </button>
          <button
            onClick={() => router.push("/refund")}
            style={{ padding: "16px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
          >
            <RefreshCw size={20} style={{ color: "#F59E0B" }} />
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: theme.text, margin: 0 }}>Refund</p>
              <p style={{ fontSize: "10px", color: theme.sub, margin: 0 }}>Request / Track</p>
            </div>
          </button>
        </div>
      </div>

      {/* Rate the app */}
      <div style={{ margin: "0 16px 20px" }}>
        <div style={{ padding: "14px 16px", backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Star size={18} style={{ color: "#F59E0B", fill: "#F59E0B" }} />
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, color: theme.text, margin: 0 }}>Enjoying Heyy?</p>
              <p style={{ fontSize: "11px", color: theme.sub, margin: 0 }}>Rate us on Play Store</p>
            </div>
          </div>
          <button style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, color: "white", backgroundColor: theme.accent, border: "none", borderRadius: "10px", cursor: "pointer" }}>
            Rate ⭐
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: theme.sub }} />
          <input
            type="text"
            placeholder="Search your question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "12px 16px 12px 40px", fontSize: "14px", backgroundColor: theme.input, color: theme.text, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", outline: "none", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* FAQ */}
      <div style={{ padding: "0 16px" }}>
        <p style={{ fontSize: "12px", fontWeight: 500, color: theme.sub, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Frequently Asked Questions</p>

        {filteredFaqs.map((cat) => (
          <div key={cat.category} style={{ marginBottom: "12px" }}>
            <button
              onClick={() => setOpenCategory(openCategory === cat.category ? null : cat.category)}
              style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.card, border: `1px solid ${openCategory === cat.category ? theme.accent : theme.cardBorder}`, borderRadius: openCategory === cat.category ? "14px 14px 0 0" : "14px", cursor: "pointer" }}
            >
              <span style={{ fontSize: "14px", fontWeight: 600, color: theme.text }}>{cat.category}</span>
              {openCategory === cat.category ? <ChevronUp size={16} style={{ color: theme.accent }} /> : <ChevronDown size={16} style={{ color: theme.sub }} />}
            </button>

            {openCategory === cat.category && (
              <div style={{ border: `1px solid ${theme.accent}`, borderTop: "none", borderRadius: "0 0 14px 14px", overflow: "hidden" }}>
                {cat.questions.map((item, i) => (
                  <div key={i} style={{ borderTop: i > 0 ? `1px solid ${theme.borderLight}` : "none" }}>
                    <button
                      onClick={() => setOpenQuestion(openQuestion === `${cat.category}-${i}` ? null : `${cat.category}-${i}`)}
                      style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", backgroundColor: theme.card, border: "none", cursor: "pointer", textAlign: "left" }}
                    >
                      <span style={{ fontSize: "13px", fontWeight: 500, color: theme.text, flex: 1, lineHeight: 1.4 }}>{item.q}</span>
                      {openQuestion === `${cat.category}-${i}`
                        ? <ChevronUp size={14} style={{ color: theme.accent, flexShrink: 0, marginTop: "2px" }} />
                        : <ChevronDown size={14} style={{ color: theme.sub, flexShrink: 0, marginTop: "2px" }} />
                      }
                    </button>
                    {openQuestion === `${cat.category}-${i}` && (
                      <div style={{ padding: "0 16px 16px", backgroundColor: theme.bg }}>
                        <p style={{ fontSize: "13px", color: theme.sub, lineHeight: 1.7, margin: 0 }}>{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  )
}
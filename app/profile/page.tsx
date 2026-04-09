"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Chrome as Home, Search, Bookmark, User, ChevronRight, Settings, HelpCircle, LogOut, Camera, Phone, MapPin, Briefcase } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { supabase } from "@/lib/supabase"

export default function ProfilePage() {
  const router = useRouter()
  const [activeNav, setActiveNav] = useState("Profile")
  const { theme, mounted } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({ totalBookings: 0, totalSpent: 0, completedBookings: 0 })
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      const userId = localStorage.getItem("heyy_user_id")
      const userPhone = localStorage.getItem("heyy_user_phone")

      // ✅ FIXED: Auth guard for both registered and guest users
      if (!userId && !userPhone) {
        router.replace("/")
        return
      }

      // ✅ FIXED: Fetch by user_id first, fallback to phone for guest users
      if (userId) {
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single()
        if (userData) setUser(userData)
      } else if (userPhone) {
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("phone", userPhone)
          .single()
        if (userData) setUser(userData)
      }

      // ✅ FIXED: Fetch booking stats filtered by customer_id
      if (userId) {
        const { data: bookings } = await supabase
          .from("bookings")
          .select("total_amount, booking_status")
          .eq("customer_id", userId)

        if (bookings && bookings.length > 0) {
          const totalSpent = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
          const completed = bookings.filter(b => b.booking_status === "completed").length
          setStats({ totalBookings: bookings.length, totalSpent, completedBookings: completed })
        }
      }

      setLoading(false)
    }
    fetchUser()
  }, [])

  const handleNavClick = (label: string) => {
    setActiveNav(label)
    switch (label) {
      case "Home": router.push("/home"); break
      case "Search": router.push("/search"); break
      case "Bookings": router.push("/bookings"); break
      case "Profile": router.push("/profile"); break
    }
  }

  // ✅ FIXED: Logout clears all session data
  const handleLogout = () => {
    localStorage.removeItem("heyy_user_id")
    localStorage.removeItem("heyy_user_phone")
    localStorage.removeItem("heyy_user_name")
    router.replace("/")
  }

  const getInitials = () => {
    if (!user?.name || user.name === "User") return "U"
    return user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const phone = typeof window !== "undefined" ? localStorage.getItem("heyy_user_phone") : ""
  const displayPhone = phone ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : "+91 XXXXX XXXXX"

  if (!mounted) return <div style={{ minHeight: "100vh", background: "#080F1E" }} />

  return (
    <div className="min-h-screen" style={{ background: theme.bg, fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <div style={{ maxWidth: 430, margin: "0 auto", paddingBottom: "96px" }}>

        {/* Header */}
        <header className="sticky top-0 z-50" style={{ background: theme.headerBg, backdropFilter: "blur(20px)", borderBottom: `1px solid ${theme.cardBorder}`, padding: "16px", textAlign: "center" }}>
          <span style={{ fontSize: "18px", fontWeight: 700, color: theme.text, fontFamily: "var(--font-syne), sans-serif" }}>Profile</span>
        </header>

        {/* Profile card */}
        <div style={{ padding: "32px 16px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>

            {/* Avatar */}
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <div style={{ width: "96px", height: "96px", borderRadius: "50%", background: `linear-gradient(135deg, ${theme.accent}, #A78BFA)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "white", fontSize: "32px", fontWeight: 700 }}>{getInitials()}</span>
              </div>
              <button
                onClick={() => router.push("/settings")}
                style={{ position: "absolute", bottom: 0, right: 0, width: "28px", height: "28px", borderRadius: "50%", backgroundColor: theme.accent, border: `2px solid ${theme.bg}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <Camera size={12} color="white" />
              </button>
            </div>

            {/* Name */}
            <h2 style={{ color: theme.text, fontFamily: "var(--font-syne), sans-serif", fontSize: "22px", fontWeight: 700, margin: "0 0 4px" }}>
              {loading ? "Loading..." : user?.name || "Guest User"}
            </h2>

            {/* Phone */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Phone size={12} style={{ color: theme.sub }} />
              <p style={{ fontSize: "14px", color: theme.sub, margin: 0 }}>{displayPhone}</p>
            </div>

            {/* District */}
            {user?.district && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                <MapPin size={12} style={{ color: theme.sub }} />
                <p style={{ fontSize: "13px", color: theme.sub, margin: 0 }}>{user.district}, Kerala</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", margin: "24px 0" }}>
            <div style={{ padding: "16px 12px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "14px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "22px", fontWeight: 700, color: theme.accent, margin: "0 0 4px" }}>{stats.totalBookings}</p>
              <p style={{ fontSize: "11px", color: theme.sub, margin: 0 }}>Bookings</p>
            </div>
            <div style={{ padding: "16px 12px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "14px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "22px", fontWeight: 700, color: "#22C55E", margin: "0 0 4px" }}>{stats.completedBookings}</p>
              <p style={{ fontSize: "11px", color: theme.sub, margin: 0 }}>Completed</p>
            </div>
            <div style={{ padding: "16px 12px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "14px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", fontWeight: 700, color: "#F59E0B", margin: "0 0 4px" }}>₹{stats.totalSpent}</p>
              <p style={{ fontSize: "11px", color: theme.sub, margin: 0 }}>Spent</p>
            </div>
          </div>

          {/* Are you a provider? */}
          <div
            onClick={() => router.push("/provider/register")}
            style={{ padding: "16px", backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: "20px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Briefcase size={20} style={{ color: "#22C55E" }} />
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: theme.text, margin: 0 }}>Are you a service provider?</p>
                <p style={{ fontSize: "11px", color: theme.sub, margin: "2px 0 0" }}>Register and earn ₹800+ daily</p>
              </div>
            </div>
            <ChevronRight size={18} style={{ color: theme.sub }} />
          </div>

          {/* Menu */}
          <div style={{ backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "16px", overflow: "hidden" }}>
            <button onClick={() => router.push("/settings")}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "none", border: "none", borderBottom: `1px solid ${theme.cardBorder}`, cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.background = theme.elevated}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Settings size={20} style={{ color: theme.sub }} />
                <span style={{ fontSize: "15px", color: theme.text }}>Settings</span>
              </div>
              <ChevronRight size={18} style={{ color: theme.sub }} />
            </button>

            <button onClick={() => router.push("/help")}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "none", border: "none", borderBottom: `1px solid ${theme.cardBorder}`, cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.background = theme.elevated}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <HelpCircle size={20} style={{ color: theme.sub }} />
                <span style={{ fontSize: "15px", color: theme.text }}>Help & Support</span>
              </div>
              <ChevronRight size={18} style={{ color: theme.sub }} />
            </button>

            <button onClick={() => setShowLogoutModal(true)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "none", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.background = theme.elevated}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <LogOut size={20} style={{ color: "#EF4444" }} />
                <span style={{ fontSize: "15px", color: "#EF4444" }}>Logout</span>
              </div>
              <ChevronRight size={18} style={{ color: theme.sub }} />
            </button>
          </div>

          <p style={{ textAlign: "center", fontSize: "11px", color: theme.sub, margin: "20px 0 0" }}>
            Heyy v1.0.0 · Made with ❤️ in Kerala
          </p>
        </div>
      </div>

      {/* Logout modal */}
      {showLogoutModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
          <div style={{ width: "100%", maxWidth: "320px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "20px", padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>👋</div>
            <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", fontWeight: 700, color: theme.text, margin: "0 0 8px" }}>Logging out?</h3>
            <p style={{ fontSize: "13px", color: theme.sub, margin: "0 0 24px", lineHeight: 1.5 }}>You will need to verify your phone number again to log back in.</p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowLogoutModal(false)}
                style={{ flex: 1, padding: "14px", fontSize: "14px", fontWeight: 500, color: theme.text, backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleLogout}
                style={{ flex: 1, padding: "14px", fontSize: "14px", fontWeight: 600, color: "white", backgroundColor: "#EF4444", border: "none", borderRadius: "12px", cursor: "pointer" }}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: theme.navBg, backdropFilter: "blur(20px)", borderTop: `1px solid ${theme.cardBorder}`, height: 72 }}>
        <div style={{ maxWidth: 430, width: "100%", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-around", height: "100%" }}>
          {[{ icon: Home, label: "Home" }, { icon: Search, label: "Search" }, { icon: Bookmark, label: "Bookings" }, { icon: User, label: "Profile" }].map((item) => {
            const isActive = activeNav === item.label
            return (
              <button key={item.label} onClick={() => handleNavClick(item.label)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "8px 16px", background: "none", border: "none", cursor: "pointer" }}>
                <item.icon size={22} style={{ color: isActive ? theme.accent : theme.sub }} />
                <span style={{ fontSize: "11px", fontWeight: 500, color: isActive ? theme.accent : theme.sub }}>{item.label}</span>
                {isActive && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: theme.accent }} />}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
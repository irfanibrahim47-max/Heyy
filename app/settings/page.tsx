"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/use-theme";

// ─── Types ────────────────────────────────────────────────────────────────────
type Language = "English" | "Malayalam" | "Hindi";
type ThemeMode = "dark" | "light";

interface NotificationSettings {
  bookingUpdates: boolean;
  promotions: boolean;
  reminders: boolean;
  providerMessages: boolean;
}

// ─── Mock user state (replace with real Supabase/localStorage logic) ──────────
const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  bookingUpdates: true,
  promotions: false,
  reminders: true,
  providerMessages: true,
};

// ─── Icons (inline SVG — no extra deps) ──────────────────────────────────────
const Icons = {
  Back: () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  Sun: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="5" /><path strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  Moon: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
    </svg>
  ),
  Globe: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  ),
  Bell: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 00-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Lock: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="11" width="18" height="11" rx="2" /><path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  Trash: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  LogOut: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Info: () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  Close: () => (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

// ─── Toggle Switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, themeInput }: { checked: boolean; onChange: () => void; themeInput: string }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked ? "#3B82F6" : themeInput,
        border: "none",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.25s ease",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.25s ease",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{
      fontFamily: "'Syne', sans-serif",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: "#3B82F6",
      margin: "0 0 8px 4px",
    }}>{label}</p>
  );
}

// ─── Settings Row ──────────────────────────────────────────────────────────────
function Row({
  icon,
  label,
  sublabel,
  right,
  danger,
  onClick,
  themeText,
  themeSub,
  themeBorderLight,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
  themeText: string;
  themeSub: string;
  themeBorderLight: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 16px",
        background: "transparent",
        border: "none",
        cursor: onClick ? "pointer" : "default",
        textAlign: "left",
        borderBottom: `1px solid ${themeBorderLight}`,
      }}
    >
      <span style={{ color: danger ? "#F87171" : themeSub, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: "block",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14.5,
          fontWeight: 500,
          color: danger ? "#F87171" : themeText,
        }}>{label}</span>
        {sublabel && (
          <span style={{
            display: "block",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: themeSub,
            marginTop: 1,
          }}>{sublabel}</span>
        )}
      </span>
      {right !== undefined ? right : onClick ? (
        <span style={{ color: themeSub }}><Icons.ChevronRight /></span>
      ) : null}
    </button>
  );
}

// ─── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, themeCard, themeCardBorder }: { children: React.ReactNode; themeCard: string; themeCardBorder: string }) {
  return (
    <div style={{
      background: themeCard,
      borderRadius: 16,
      overflow: "hidden",
      border: `1px solid ${themeCardBorder}`,
    }}>
      {children}
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
function Modal({
  title,
  children,
  onClose,
  themeCard,
  themeText,
  themeSub,
  themeElevated,
  themeInputBorder,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  themeCard: string;
  themeText: string;
  themeSub: string;
  themeElevated: string;
  themeInputBorder: string;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 430,
          background: themeCard,
          borderRadius: "24px 24px 0 0",
          padding: "20px 20px 36px",
          border: `1px solid ${themeInputBorder}`,
          borderBottom: "none",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: themeText, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: themeElevated, border: "none", borderRadius: 8, padding: 6, cursor: "pointer", color: themeSub, display: "flex" }}>
            <Icons.Close />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Main Settings Page ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();
  const { theme, isDark, toggleTheme, mounted } = useTheme();

  // Theme mode
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  // Language
  const [language, setLanguage] = useState<Language>("English");
  // Notifications
  const [notifs, setNotifs] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  // Edit profile modal
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileName, setProfileName] = useState("Irfan Ibrahim");
  const [profilePhone, setProfilePhone] = useState("+91 98765 43210");
  const [profileEmail, setProfileEmail] = useState("irfan@example.com");
  // Language modal
  const [showLangModal, setShowLangModal] = useState(false);
  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  // Logout modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // Privacy & About modals
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  // Toast
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const toggleNotif = (key: keyof NotificationSettings) => {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleThemeToggle = (mode: ThemeMode) => {
    setThemeMode(mode);
    if ((mode === "dark" && !isDark) || (mode === "light" && isDark)) {
      toggleTheme();
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${theme.bg}; }
        input:focus { outline: none; }
        button { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{
        maxWidth: 430,
        margin: "0 auto",
        minHeight: "100vh",
        background: theme.bg,
        fontFamily: "'DM Sans', sans-serif",
        paddingBottom: 40,
        position: "relative",
      }}>

        {/* ── Header ── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 50,
          background: theme.headerBg,
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${theme.borderLight}`,
          padding: "16px 20px 14px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <button
            onClick={() => router.back()}
            style={{
              background: theme.elevated,
              border: "none", borderRadius: 10, padding: 8,
              cursor: "pointer", color: theme.sub,
              display: "flex",
            }}
          >
            <Icons.Back />
          </button>
          <div>
            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 20, fontWeight: 800,
              color: theme.text,
              letterSpacing: "-0.02em",
            }}>Settings</h1>
          </div>
        </div>

        <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* ── Appearance ── */}
          <div>
            <SectionLabel label="Appearance" />
            <Card themeCard={theme.card} themeCardBorder={theme.cardBorder}>
              {/* Theme toggle */}
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: theme.sub }}>
                  {isDark ? <Icons.Moon /> : <Icons.Sun />}
                </span>
                <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14.5, fontWeight: 500, color: theme.text }}>
                  {isDark ? "Dark Mode" : "Light Mode"}
                </span>
                {/* Theme pill switcher */}
                <div style={{
                  display: "flex",
                  background: theme.elevated,
                  borderRadius: 100, padding: 3, gap: 2,
                }}>
                  {(["dark", "light"] as ThemeMode[]).map(t => (
                    <button
                      key={t}
                      onClick={() => handleThemeToggle(t)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 100,
                        border: "none",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: (isDark && t === "dark") || (!isDark && t === "light") ? "#3B82F6" : "transparent",
                        color: (isDark && t === "dark") || (!isDark && t === "light") ? "#fff" : theme.sub,
                        transition: "all 0.2s ease",
                      }}
                    >
                      {t === "dark" ? "🌙 Dark" : "☀️ Light"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <button
                onClick={() => setShowLangModal(true)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "13px 16px", background: "transparent", border: "none",
                  borderTop: `1px solid ${theme.borderLight}`,
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{ color: theme.sub }}><Icons.Globe /></span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 14.5, fontWeight: 500, color: theme.text }}>Language</span>
                </span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3B82F6", fontWeight: 600 }}>{language}</span>
                <span style={{ color: theme.sub }}><Icons.ChevronRight /></span>
              </button>
            </Card>
          </div>

          {/* ── Notifications ── */}
          <div>
            <SectionLabel label="Notifications" />
            <Card themeCard={theme.card} themeCardBorder={theme.cardBorder}>
              {[
                { key: "bookingUpdates", label: "Booking Updates", sub: "Status changes, confirmations" },
                { key: "providerMessages", label: "Provider Messages", sub: "Chat & replies" },
                { key: "reminders", label: "Reminders", sub: "Upcoming booking alerts" },
                { key: "promotions", label: "Promotions & Offers", sub: "Deals and discounts" },
              ].map(({ key, label, sub }, i) => (
                <div
                  key={key}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "13px 16px",
                    borderTop: i > 0 ? `1px solid ${theme.borderLight}` : "none",
                  }}
                >
                  <span style={{ color: theme.sub }}><Icons.Bell /></span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 14.5, fontWeight: 500, color: theme.text }}>{label}</span>
                    <span style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: theme.sub, marginTop: 1 }}>{sub}</span>
                  </span>
                  <Toggle
                    checked={notifs[key as keyof NotificationSettings]}
                    onChange={() => toggleNotif(key as keyof NotificationSettings)}
                    themeInput={theme.input}
                  />
                </div>
              ))}
            </Card>
          </div>

          {/* ── Account ── */}
          <div>
            <SectionLabel label="Account" />
            <Card themeCard={theme.card} themeCardBorder={theme.cardBorder}>
              <Row icon={<Icons.User />} label="Edit Profile" sublabel="Name, phone, email" onClick={() => setShowEditProfile(true)} themeText={theme.text} themeSub={theme.sub} themeBorderLight={theme.borderLight} />
              <Row icon={<Icons.Lock />} label="Change Password" sublabel="Update your login PIN/password" onClick={() => setShowPasswordModal(true)} themeText={theme.text} themeSub={theme.sub} themeBorderLight={theme.borderLight} />
              <Row icon={<Icons.Shield />} label="Privacy Policy" onClick={() => setShowPrivacy(true)} themeText={theme.text} themeSub={theme.sub} themeBorderLight={theme.borderLight} />
              <Row icon={<Icons.Info />} label="About Heyy" sublabel="Version 1.0.0 · Kerala Local Services" onClick={() => setShowAbout(true)} themeText={theme.text} themeSub={theme.sub} themeBorderLight={theme.borderLight} />
            </Card>
          </div>

          {/* ── Danger Zone ── */}
          <div>
            <SectionLabel label="Account Actions" />
            <Card themeCard={theme.card} themeCardBorder={theme.cardBorder}>
              <Row
                icon={<Icons.LogOut />}
                label="Log Out"
                danger
                onClick={() => setShowLogoutModal(true)}
                themeText={theme.text}
                themeSub={theme.sub}
                themeBorderLight={theme.borderLight}
              />
              <Row
                icon={<Icons.Trash />}
                label="Delete Account"
                sublabel="Permanently remove your data"
                danger
                onClick={() => setShowDeleteModal(true)}
                themeText={theme.text}
                themeSub={theme.sub}
                themeBorderLight={theme.borderLight}
              />
            </Card>
          </div>

          {/* App version footer */}
          <p style={{
            textAlign: "center",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: theme.muted,
            paddingTop: 4,
          }}>
            Heyy · Kerala Local Services · v1.0.0<br />
            <span style={{ color: "#3B82F6", opacity: 0.6 }}>Real Services, Real People 🌴</span>
          </p>
        </div>

        {/* ── Toast ── */}
        {toast && (
          <div style={{
            position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
            background: theme.elevated,
            border: "1px solid rgba(59,130,246,0.3)",
            color: theme.text,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13.5, fontWeight: 500,
            padding: "10px 18px", borderRadius: 12,
            zIndex: 200, whiteSpace: "nowrap",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            animation: "fadeUp 0.25s ease",
          }}>
            {toast}
          </div>
        )}
      </div>

      {/* ── Language Modal ── */}
      {showLangModal && (
        <Modal title="Select Language" onClose={() => setShowLangModal(false)} themeCard={theme.card} themeText={theme.text} themeSub={theme.sub} themeElevated={theme.elevated} themeInputBorder={theme.inputBorder}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(["English", "Malayalam", "Hindi"] as Language[]).map(lang => (
              <button
                key={lang}
                onClick={() => { setLanguage(lang); setShowLangModal(false); showToast(`Language set to ${lang}`); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px",
                  background: language === lang ? "rgba(59,130,246,0.15)" : theme.card,
                  border: `1px solid ${language === lang ? "rgba(59,130,246,0.4)" : theme.cardBorder}`,
                  borderRadius: 12, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500,
                  color: language === lang ? "#3B82F6" : theme.text,
                }}
              >
                <span>
                  {lang === "English" ? "🇬🇧 English" : lang === "Malayalam" ? "🇮🇳 മലയാളം" : "🇮🇳 हिन्दी"}
                </span>
                {language === lang && (
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icons.Check />
                  </span>
                )}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* ── Edit Profile Modal ── */}
      {showEditProfile && (
        <Modal title="Edit Profile" onClose={() => setShowEditProfile(false)} themeCard={theme.card} themeText={theme.text} themeSub={theme.sub} themeElevated={theme.elevated} themeInputBorder={theme.inputBorder}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Full Name", value: profileName, onChange: setProfileName, type: "text" },
              { label: "Phone Number", value: profilePhone, onChange: setProfilePhone, type: "tel" },
              { label: "Email (optional)", value: profileEmail, onChange: setProfileEmail, type: "email" },
            ].map(({ label, value, onChange, type }) => (
              <div key={label}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: theme.sub, marginBottom: 6, marginLeft: 2 }}>{label}</p>
                <input
                  type={type}
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  style={{
                    width: "100%", padding: "12px 14px",
                    background: theme.input,
                    border: `1px solid ${theme.inputBorder}`,
                    borderRadius: 12, color: theme.text,
                    fontFamily: "'DM Sans', sans-serif", fontSize: 14.5,
                  }}
                />
              </div>
            ))}
            <button
              onClick={() => { setShowEditProfile(false); showToast("Profile updated ✓"); }}
              style={{
                marginTop: 4, width: "100%", padding: "14px",
                background: "#3B82F6", border: "none", borderRadius: 12,
                color: "#fff", fontFamily: "'Syne', sans-serif",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}
            >
              Save Changes
            </button>
          </div>
        </Modal>
      )}

      {/* ── Change Password Modal ── */}
      {showPasswordModal && (
        <Modal title="Change Password" onClose={() => setShowPasswordModal(false)} themeCard={theme.card} themeText={theme.text} themeSub={theme.sub} themeElevated={theme.elevated} themeInputBorder={theme.inputBorder}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Current Password", value: currentPw, onChange: setCurrentPw },
              { label: "New Password", value: newPw, onChange: setNewPw },
              { label: "Confirm New Password", value: confirmPw, onChange: setConfirmPw },
            ].map(({ label, value, onChange }) => (
              <div key={label}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: theme.sub, marginBottom: 6, marginLeft: 2 }}>{label}</p>
                <input
                  type="password"
                  value={value}
                  onChange={e => onChange(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%", padding: "12px 14px",
                    background: theme.input,
                    border: `1px solid ${theme.inputBorder}`,
                    borderRadius: 12, color: theme.text,
                    fontFamily: "'DM Sans', sans-serif", fontSize: 14.5,
                  }}
                />
              </div>
            ))}
            <button
              onClick={() => {
                if (newPw !== confirmPw) { showToast("Passwords don't match!"); return; }
                if (newPw.length < 6) { showToast("Password too short (min 6 chars)"); return; }
                setShowPasswordModal(false);
                setCurrentPw(""); setNewPw(""); setConfirmPw("");
                showToast("Password updated ✓");
              }}
              style={{
                marginTop: 4, width: "100%", padding: "14px",
                background: "#3B82F6", border: "none", borderRadius: 12,
                color: "#fff", fontFamily: "'Syne', sans-serif",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}
            >
              Update Password
            </button>
          </div>
        </Modal>
      )}

      {/* ── Logout Confirm Modal ── */}
      {showLogoutModal && (
        <Modal title="Log Out?" onClose={() => setShowLogoutModal(false)} themeCard={theme.card} themeText={theme.text} themeSub={theme.sub} themeElevated={theme.elevated} themeInputBorder={theme.inputBorder}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14.5, color: theme.sub, lineHeight: 1.6, marginBottom: 20 }}>
            You'll need to log in again to access your bookings and account.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setShowLogoutModal(false)}
              style={{
                flex: 1, padding: "13px",
                background: theme.elevated,
                border: `1px solid ${theme.inputBorder}`,
                borderRadius: 12, color: theme.text,
                fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >Cancel</button>
            <button
              onClick={() => {
                // Clear localStorage, redirect to login
                if (typeof window !== "undefined") {
                  localStorage.clear();
                  window.location.href = "/";
                }
              }}
              style={{
                flex: 1, padding: "13px",
                background: "rgba(248,113,113,0.15)",
                border: "1px solid rgba(248,113,113,0.3)",
                borderRadius: 12, color: "#F87171",
                fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >Log Out</button>
          </div>
        </Modal>
      )}

      {/* ── Delete Account Modal ── */}
      {showDeleteModal && (
        <Modal title="Delete Account" onClose={() => { setShowDeleteModal(false); setDeleteConfirm(""); }} themeCard={theme.card} themeText={theme.text} themeSub={theme.sub} themeElevated={theme.elevated} themeInputBorder={theme.inputBorder}>
          <div style={{
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
            borderRadius: 12, padding: "12px 14px", marginBottom: 16,
          }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: "#FCA5A5", lineHeight: 1.6 }}>
              ⚠️ This permanently deletes your account, bookings history, and all data. This cannot be undone.
            </p>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: theme.sub, marginBottom: 8 }}>
            Type <strong style={{ color: "#F87171" }}>DELETE</strong> to confirm:
          </p>
          <input
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            placeholder="Type DELETE here"
            style={{
              width: "100%", padding: "12px 14px", marginBottom: 14,
              background: theme.input,
              border: `1px solid ${deleteConfirm === "DELETE" ? "rgba(248,113,113,0.5)" : theme.inputBorder}`,
              borderRadius: 12, color: "#F87171",
              fontFamily: "'DM Sans', sans-serif", fontSize: 14.5,
            }}
          />
          <button
            disabled={deleteConfirm !== "DELETE"}
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.clear();
                window.location.href = "/";
              }
            }}
            style={{
              width: "100%", padding: "14px",
              background: deleteConfirm === "DELETE" ? "#EF4444" : theme.input,
              border: "none", borderRadius: 12,
              color: deleteConfirm === "DELETE" ? "#fff" : theme.sub,
              fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700,
              cursor: deleteConfirm === "DELETE" ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
            }}
          >
            Delete My Account
          </button>
        </Modal>
      )}

      {/* ── Privacy Policy Modal ── */}
      {showPrivacy && (
        <Modal title="Privacy Policy" onClose={() => setShowPrivacy(false)} themeCard={theme.card} themeText={theme.text} themeSub={theme.sub} themeElevated={theme.elevated} themeInputBorder={theme.inputBorder}>
          <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 4 }}>
            {[
              {
                heading: "1. Information We Collect",
                body: "We collect your phone number, name, location (district), and booking history to provide our services. We do not collect your phone contacts or location without permission.",
              },
              {
                heading: "2. How We Use Your Data",
                body: "Your data is used solely to connect you with service providers, process bookings, send OTP verification, and improve app experience. We never sell your data to third parties.",
              },
              {
                heading: "3. Payment Information",
                body: "Payments are processed securely via Razorpay. Heyy does not store your card or UPI details. All transactions are encrypted end-to-end.",
              },
              {
                heading: "4. Provider Data",
                body: "Service providers' phone numbers are hidden from customers until a booking is confirmed. Provider photos and service details are publicly visible on the platform.",
              },
              {
                heading: "5. Data Retention",
                body: "We retain your account data as long as your account is active. On account deletion, all personal data is permanently removed within 30 days.",
              },
              {
                heading: "6. Your Rights",
                body: "You can edit your profile, download your data, or delete your account at any time from Settings. For any data requests, contact us at privacy@heyy.in.",
              },
              {
                heading: "7. Cookies & Analytics",
                body: "We use minimal analytics to understand app usage patterns. No tracking cookies are used for advertising purposes.",
              },
              {
                heading: "8. Changes to Policy",
                body: "We may update this policy occasionally. You'll be notified in-app of any significant changes. Continued use of Heyy constitutes acceptance.",
              },
            ].map(({ heading, body }) => (
              <div key={heading} style={{ marginBottom: 18 }}>
                <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "#3B82F6", marginBottom: 4 }}>{heading}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: theme.sub, lineHeight: 1.7 }}>{body}</p>
              </div>
            ))}
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: theme.muted, textAlign: "center", marginTop: 8 }}>
              Last updated: January 2025 · privacy@heyy.in
            </p>
          </div>
        </Modal>
      )}

      {/* ── About Heyy Modal ── */}
      {showAbout && (
        <Modal title="About Heyy" onClose={() => setShowAbout(false)} themeCard={theme.card} themeText={theme.text} themeSub={theme.sub} themeElevated={theme.elevated} themeInputBorder={theme.inputBorder}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>

            {/* Logo */}
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: "linear-gradient(135deg, #3B82F6, #6366F1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, marginBottom: 12,
              boxShadow: "0 8px 24px rgba(59,130,246,0.35)",
            }}>🌴</div>

            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: theme.text, margin: "0 0 4px" }}>Heyy</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3B82F6", fontWeight: 600, margin: "0 0 4px" }}>Kerala Local Services Marketplace</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: theme.muted, margin: "0 0 20px" }}>Version 1.0.0 · Beta</p>

            {/* Tagline */}
            <div style={{
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: 12, padding: "12px 16px",
              marginBottom: 20, width: "100%", textAlign: "center",
            }}>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "#93C5FD", margin: 0, lineHeight: 1.5 }}>
                "Real Services, Real People" 🌴
              </p>
            </div>

            {/* Team */}
            <div style={{ width: "100%", marginBottom: 16 }}>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3B82F6", marginBottom: 10 }}>Built by</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: theme.card, borderRadius: 12, border: `1px solid ${theme.cardBorder}` }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👨‍💻</div>
                <div>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: theme.text, margin: 0 }}>Irfan Ibrahim</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: theme.sub, margin: "2px 0 0" }}>Founder & Developer · Kerala, India</p>
                </div>
              </div>
            </div>

            {/* Contact & Social */}
            <div style={{ width: "100%", marginBottom: 16 }}>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3B82F6", marginBottom: 10 }}>Contact & Social</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { icon: "✉️", label: "Email", value: "hello@heyy.in", href: "mailto:hello@heyy.in" },
                  { icon: "💬", label: "WhatsApp", value: "+91 94001 00000", href: "https://wa.me/9400100000" },
                  { icon: "📸", label: "Instagram", value: "@heyy.kerala", href: "https://instagram.com/heyy.kerala" },
                  { icon: "🐦", label: "Twitter / X", value: "@heyykerala", href: "https://twitter.com/heyykerala" },
                ].map(({ icon, label, value, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "11px 14px",
                      background: theme.card,
                      border: `1px solid ${theme.cardBorder}`,
                      borderRadius: 12, textDecoration: "none",
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{icon}</span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: theme.sub }}>{label}</span>
                      <span style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500, color: "#93C5FD" }}>{value}</span>
                    </span>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={theme.sub} strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: theme.muted, textAlign: "center" }}>
              Made with ❤️ in Kerala · © 2025 Heyy
            </p>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}
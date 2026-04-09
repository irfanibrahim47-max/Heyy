"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";

type Step =
  | "welcome"
  | "customer_choice"
  | "register_phone"
  | "register_otp"
  | "register_details"
  | "login"
  | "forgot_phone"
  | "forgot_otp"
  | "forgot_newpassword"
  | "guest_phone"
  | "guest_otp"
  | "provider_phone"
  | "provider_otp"
  | "provider_verified";

const DISTRICTS = [
  "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha",
  "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad",
  "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod",
];

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "heyy_salt_2025");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function OtpBoxes({ accent, theme, otpRefs, onComplete }: {
  accent: string;
  theme: any;
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onComplete: (otp: string) => void;
}) {
  const [localOtp, setLocalOtp] = useState(["", "", "", "", "", ""]);

  return (
    <div style={{ display: "flex", gap: "12px", justifyContent: "center", margin: "32px 16px 0" }}>
      {localOtp.map((digit, index) => (
        <input
          key={index}
          ref={el => { otpRefs.current[index] = el; }}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, "");
            const newOtp = [...localOtp];
            newOtp[index] = val.slice(-1);
            setLocalOtp(newOtp);
            if (val && index < 5) otpRefs.current[index + 1]?.focus();
            const joined = newOtp.join("");
            if (joined.length === 6) onComplete(joined);
          }}
          onKeyDown={e => {
            if (e.key === "Backspace" && !localOtp[index] && index > 0)
              otpRefs.current[index - 1]?.focus();
          }}
          style={{
            width: "48px", height: "56px",
            background: digit ? `${accent}14` : theme.input,
            border: `2px solid ${digit ? accent : theme.inputBorder}`,
            borderRadius: "12px", textAlign: "center",
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: "24px", fontWeight: 700, color: theme.text,
            outline: "none", transition: "border-color 0.2s, background 0.2s",
          }}
          onFocus={e => { e.target.style.borderColor = accent; e.target.style.background = `${accent}14`; }}
          onBlur={e => { if (!digit) { e.target.style.borderColor = theme.inputBorder; e.target.style.background = theme.input; } }}
        />
      ))}
    </div>
  );
}

export default function WelcomePage() {
  const router = useRouter();
  const { theme, isDark, mounted } = useTheme();
  const [step, setStep] = useState<Step>("welcome");
  const [animateIn, setAnimateIn] = useState(true);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ providerCount: 0, avgRating: 0, userCount: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // OTP
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Register
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPw, setRegConfirmPw] = useState("");
  const [regDistrict, setRegDistrict] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regLandmark, setRegLandmark] = useState("");
  const [regVillage, setRegVillage] = useState("");
  const [regPincode, setRegPincode] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [showRegPw, setShowRegPw] = useState(false);
  const [showRegConfirmPw, setShowRegConfirmPw] = useState(false);

  // Login
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Forgot password
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);

  const avatars = [
    { initials: "RK", gradient: "linear-gradient(135deg, #3B82F6, #2563EB)" },
    { initials: "PM", gradient: "linear-gradient(135deg, #22C55E, #16A34A)" },
    { initials: "AN", gradient: "linear-gradient(135deg, #F59E0B, #D97706)" },
    { initials: "SK", gradient: "linear-gradient(135deg, #EC4899, #DB2777)" },
    { initials: "DM", gradient: "linear-gradient(135deg, #8B5CF6, #7C3AED)" },
  ];

  useEffect(() => {
    async function fetchStats() {
      const [countRes, ratingRes, userCountRes] = await Promise.all([
        supabase.from("providers").select("*", { count: "exact", head: true }),
        supabase.from("providers").select("rating"),
        supabase.rpc("get_user_count"),
      ]);
      const providerCount = countRes.count || 0;
      const ratings = (ratingRes.data || [])
        .map((p: { rating: number | null }) => p.rating)
        .filter((r: number | null): r is number => r !== null && r > 0);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length : 0;
      const userCount = userCountRes.data ?? 0;
      setStats({ providerCount, avgRating, userCount });
      setStatsLoading(false);
    }
    fetchStats();
  }, []);

  useEffect(() => {
    const otpSteps = ["register_otp", "guest_otp", "provider_otp", "forgot_otp"];
    if (otpSteps.includes(step) && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => { if (prev <= 1) { setCanResend(true); return 0; } return prev - 1; });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, countdown]);

  const goTo = (newStep: Step, direction: "left" | "right" = "right") => {
    setSlideDirection(direction);
    setAnimateIn(false);
    setError("");
    setTimeout(() => { setStep(newStep); setAnimateIn(true); }, 150);
  };

  const resetOtp = () => { setOtp(["", "", "", "", "", ""]); setIsVerified(false); setCountdown(30); setCanResend(false); };

  const sendOtp = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    alert("Your OTP is: " + newOtp);
    resetOtp();
  };

  const getSlideAnimation = () => {
    if (slideDirection === "right") return animateIn ? "slideInRight 0.3s ease forwards" : "slideOutLeft 0.15s ease forwards";
    return animateIn ? "slideInLeft 0.3s ease forwards" : "slideOutRight 0.15s ease forwards";
  };

  const formatPhone = (phone: string) => phone.length <= 5 ? phone : `${phone.slice(0, 5)} ${phone.slice(5)}`;

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp]; newOtp[index] = value.slice(-1); setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleRegisterSendOtp = async () => {
    if (phoneNumber.length !== 10) { setError("Enter a valid 10-digit number"); return; }
    setLoading(true);
    const { data: existing } = await supabase.from("users").select("id").eq("phone", phoneNumber).single();
    if (existing) { setError("Phone already registered! Please login."); setLoading(false); return; }
    sendOtp();
    setLoading(false);
    goTo("register_otp");
  };

  const handleRegisterVerifyOtp = () => {
    if (otp.join("") !== generatedOtp) { setError("Wrong OTP! Try again."); return; }
    setIsVerified(true);
    setTimeout(() => goTo("register_details"), 800);
  };

  const handleRegisterSave = async () => {
    if (!regName.trim()) { setError("Enter your full name"); return; }
    if (!regUsername.trim() || regUsername.length < 3) { setError("Username must be at least 3 characters"); return; }
    if (!/^[a-z0-9_.]+$/.test(regUsername)) { setError("Username: only lowercase, numbers, _ and ."); return; }
    if (regPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (regPassword !== regConfirmPw) { setError("Passwords don't match!"); return; }
    if (!regDistrict) { setError("Please select your district"); return; }
    setLoading(true);
    const { data: existingUsername } = await supabase.from("users").select("id").eq("username", regUsername).single();
    if (existingUsername) { setError("Username already taken! Try another."); setLoading(false); return; }
    const passwordHash = await hashPassword(regPassword);
    const { data: newUser, error: insertError } = await supabase.from("users").insert({
      phone: phoneNumber, name: regName.trim(),
      username: regUsername.trim().toLowerCase(), password_hash: passwordHash,
      email: regEmail.trim() || null, district: regDistrict,
      address: regAddress.trim() || null, landmark: regLandmark.trim() || null,
      village: regVillage.trim() || null, pincode: regPincode.trim() || null,
      language: "English",
    }).select().single();
    if (insertError || !newUser) { setError("Registration failed. Please try again."); setLoading(false); return; }
    localStorage.setItem("heyy_user_id", newUser.id);
    localStorage.setItem("heyy_user_phone", newUser.phone);
    localStorage.setItem("heyy_user_name", newUser.name);
    setLoading(false);
    router.push("/home");
  };

  const handleLogin = async () => {
    if (!loginId.trim()) { setError("Enter username or phone"); return; }
    if (!loginPw.trim()) { setError("Enter your password"); return; }
    setLoading(true);
    const passwordHash = await hashPassword(loginPw);
    const isPhone = /^\d+$/.test(loginId.trim());
    const { data: user } = await supabase.from("users").select("*")
      .eq("password_hash", passwordHash)
      .eq(isPhone ? "phone" : "username", isPhone ? loginId.trim() : loginId.trim().toLowerCase())
      .single();
    if (!user) { setError("Wrong username/phone or password!"); setLoading(false); return; }
    localStorage.setItem("heyy_user_id", user.id);
    localStorage.setItem("heyy_user_phone", user.phone);
    localStorage.setItem("heyy_user_name", user.name || "");
    setLoading(false);
    router.push("/home");
  };

  const handleForgotSendOtp = async () => {
    if (phoneNumber.length !== 10) { setError("Enter a valid 10-digit number"); return; }
    setLoading(true);
    const { data: existing } = await supabase.from("users").select("id").eq("phone", phoneNumber).single();
    if (!existing) { setError("Phone not registered! Please register first."); setLoading(false); return; }
    sendOtp(); setLoading(false); goTo("forgot_otp");
  };

  const handleForgotVerifyOtp = () => {
    if (otp.join("") !== generatedOtp) { setError("Wrong OTP! Try again."); return; }
    setIsVerified(true);
    setTimeout(() => goTo("forgot_newpassword"), 800);
  };

  const handleForgotSavePassword = async () => {
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmNewPassword) { setError("Passwords don't match!"); return; }
    setLoading(true);
    const passwordHash = await hashPassword(newPassword);
    const { error: updateError } = await supabase.from("users").update({ password_hash: passwordHash }).eq("phone", phoneNumber);
    if (updateError) { setError("Failed to update password. Try again."); setLoading(false); return; }
    setLoading(false);
    goTo("login", "left");
  };

  const handleGuestSendOtp = async () => {
    if (phoneNumber.length !== 10) { setError("Enter a valid 10-digit number"); return; }
    setLoading(true); sendOtp(); setLoading(false); goTo("guest_otp");
  };

  const handleGuestVerifyOtp = async () => {
    if (otp.join("") !== generatedOtp) { setError("Wrong OTP! Try again."); return; }
    setIsVerified(true);
    const { data: existingUser } = await supabase.from("users").select("id, name").eq("phone", phoneNumber).maybeSingle();
    if (!existingUser) await supabase.from("users").insert({ phone: phoneNumber, name: "Guest" });
    localStorage.setItem("heyy_user_phone", phoneNumber);
    localStorage.setItem("heyy_user_name", existingUser?.name || "Guest");
    setTimeout(() => router.push("/home"), 800);
  };

  const handleProviderSendOtp = async () => {
    if (phoneNumber.length !== 10) { setError("Enter a valid 10-digit number"); return; }
    setLoading(true); sendOtp(); setLoading(false); goTo("provider_otp");
  };

  const handleProviderVerifyOtp = async () => {
    if (otp.join("") !== generatedOtp) { setError("Wrong OTP! Try again."); return; }
    setIsVerified(true);
    localStorage.setItem("heyy_user_phone", phoneNumber);
    setTimeout(() => goTo("provider_verified"), 800);
  };

  if (!mounted) return <div style={{ minHeight: "100vh", background: "#080F1E" }} />;

  // ── Shared styles ──────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "14px 16px",
    background: theme.input, border: `1px solid ${theme.inputBorder}`,
    borderRadius: "12px", color: theme.text,
    fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "15px",
    outline: "none", boxSizing: "border-box", transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontFamily: "var(--font-syne), sans-serif",
    fontSize: "13px", fontWeight: 700, color: theme.text, marginBottom: "8px",
  };

  const primaryBtn = (disabled?: boolean, green?: boolean): React.CSSProperties => ({
    width: "calc(100% - 32px)", margin: "16px 16px 0", padding: "16px",
    background: disabled ? (green ? "rgba(34,197,94,0.4)" : "rgba(59,130,246,0.4)") : green ? "linear-gradient(135deg, #22C55E, #16A34A)" : "linear-gradient(135deg, #3B82F6, #2563EB)",
    color: "white", fontFamily: "var(--font-syne), sans-serif", fontSize: "16px", fontWeight: 700,
    borderRadius: "12px", border: "none", cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: disabled ? "none" : green ? "0 4px 20px rgba(34,197,94,0.4)" : "0 4px 20px rgba(59,130,246,0.4)",
    opacity: disabled ? 0.6 : 1, transition: "all 0.2s ease",
  });

  const headerStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", position: "relative" };
  const backBtn: React.CSSProperties = { position: "absolute", left: "16px", background: "none", border: "none", cursor: "pointer", fontSize: "24px", color: theme.text, padding: "8px" };

  const PhoneInput = ({ accent }: { accent: string }) => (
    <div style={{ display: "flex", gap: "10px" }}>
      <div style={{ background: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", padding: "14px 16px", fontFamily: "var(--font-syne), sans-serif", fontSize: "15px", fontWeight: 700, color: theme.text, width: "80px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>+91 🇮🇳</div>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        defaultValue={phoneNumber}
        onBlur={e => {
          const v = e.target.value.replace(/\D/g, "").slice(0, 10);
          setPhoneNumber(v);
          setError("");
        }}
        onPaste={e => {
          const v = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 10);
          setPhoneNumber(v);
          e.preventDefault();
        }}
        maxLength={10}
        placeholder="98475 XXXXX"
        style={{ ...inputStyle, flex: 1 }}
        onFocus={e => { e.target.style.borderColor = accent; e.target.style.boxShadow = `0 0 0 3px ${accent}26`; }}
      />
    </div>
  );

  const ResendOtp = ({ onResend, accent }: { onResend: () => void; accent: string }) => (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      {canResend
        ? <p onClick={onResend} style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "13px", color: accent, cursor: "pointer", fontWeight: 600 }}>Resend OTP</p>
        : <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "13px", color: theme.sub }}>Resend OTP in 0:{countdown.toString().padStart(2, "0")}</p>
      }
    </div>
  );

  const ErrorMsg = () => error ? (
    <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "13px", color: "#EF4444", margin: "10px 16px 0" }}>⚠️ {error}</p>
  ) : null;

  return (
    <div style={{ maxWidth: "430px", margin: "0 auto" }}>
      <div style={{ minHeight: "100vh", background: theme.bg, fontFamily: "var(--font-dm-sans), sans-serif", position: "relative", overflow: "hidden" }}>
        <style jsx global>{`
          @keyframes logoEntrance { 0% { opacity: 0; transform: translateY(-30px) scale(0.8); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
          @keyframes sway { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
          @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
          @keyframes slideInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes slideInLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes slideOutLeft { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-40px); } }
          @keyframes slideOutRight { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(40px); } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          input::placeholder { color: ${isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}; }
          input:focus, select:focus { outline: none; }
        `}</style>

        {/* ══ WELCOME ══ */}
        {step === "welcome" && (
          <div style={{ animation: getSlideAnimation(), paddingBottom: "40px" }}>
            <div style={{ padding: "60px 16px 0", textAlign: "center" }}>
              <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "56px", fontWeight: 700, color: theme.accent, letterSpacing: "-2px", textShadow: "0 0 60px rgba(59,130,246,0.5)", margin: 0, animation: "logoEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>Heyy</h1>
              <div style={{ fontSize: "48px", marginTop: "8px", animation: "sway 2s ease-in-out infinite" }}>🌴</div>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "16px", color: theme.sub, marginTop: "12px" }}>Kerala&apos;s #1 Local Services</p>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "16px", color: theme.accent, fontWeight: 700, marginTop: "0" }}>Marketplace</p>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", background: theme.card, borderRadius: "16px", border: `1px solid ${theme.cardBorder}`, padding: "16px", margin: "32px 16px 0", boxShadow: theme.shadow }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                {statsLoading ? (
                  <div style={{ height: "28px", width: "48px", backgroundColor: "rgba(59,130,246,0.15)", borderRadius: "8px", animation: "pulse 1.5s ease-in-out infinite", margin: "0 auto" }} />
                ) : (
                  <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "24px", fontWeight: 700, color: theme.text, margin: 0 }}>{stats.providerCount}+</p>
                )}
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "11px", color: theme.sub, margin: 0 }}>Providers</p>
              </div>
              <div style={{ width: "1px", background: theme.cardBorder }} />
              <div style={{ flex: 1, textAlign: "center" }}>
                {statsLoading ? (
                  <div style={{ height: "28px", width: "48px", backgroundColor: "rgba(59,130,246,0.15)", borderRadius: "8px", animation: "pulse 1.5s ease-in-out infinite", margin: "0 auto" }} />
                ) : (
                  <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "24px", fontWeight: 700, color: theme.warning, margin: 0 }}>{stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)}★` : "—★"}</p>
                )}
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "11px", color: theme.sub, margin: 0 }}>Rating</p>
              </div>
              <div style={{ width: "1px", background: theme.cardBorder }} />
              <div style={{ flex: 1, textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "24px", fontWeight: 700, color: theme.success, margin: 0 }}>14 Districts</p>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "11px", color: theme.sub, margin: 0 }}>Kerala</p>
              </div>
            </div>

            {/* Ticker */}
            <div style={{ marginTop: "24px", overflow: "hidden", whiteSpace: "nowrap" }}>
              <div style={{ display: "inline-block", animation: "ticker 20s linear infinite" }}>
                <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "13px", color: theme.sub }}>
                  Thiruvananthapuram · Kollam · Pathanamthitta · Alappuzha · Kottayam · Idukki · Ernakulam · Thrissur · Palakkad · Malappuram · Kozhikode · Wayanad · Kannur · Kasaragod · Thiruvananthapuram · Kollam · Pathanamthitta · Alappuzha · Kottayam · Idukki · Ernakulam · Thrissur · Palakkad · Malappuram · Kozhikode · Wayanad · Kannur · Kasaragod ·{" "}
                </span>
              </div>
            </div>

            {/* I am a... */}
            <div style={{ marginTop: "32px", padding: "0 16px" }}>
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "22px", fontWeight: 700, color: theme.text, textAlign: "center", marginBottom: "20px" }}>I am a...</h2>

              {/* Customer */}
              <div onClick={() => { setPhoneNumber(""); goTo("customer_choice"); }}
                style={{ background: theme.card, border: `2px solid ${isDark ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.4)"}`, borderRadius: "16px", padding: "24px", cursor: "pointer", boxShadow: theme.shadow, display: "flex", alignItems: "center", marginBottom: "14px", transition: "all 0.25s ease", position: "relative" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.4)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ width: "80px", height: "80px", background: "rgba(59,130,246,0.12)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", flexShrink: 0 }}>🏠</div>
                <div style={{ flex: 1, paddingLeft: "16px" }}>
                  <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "22px", fontWeight: 700, color: theme.text, margin: 0 }}>Customer</p>
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "13px", color: theme.sub, marginTop: "4px" }}>Find & book trusted local services</p>
                  <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                    {["🔧 Plumber", "📚 Tutor", "🚗 Driver"].map(tag => (
                      <span key={tag} style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "11px", color: theme.pillText, background: theme.pill, borderRadius: "8px", padding: "3px 8px" }}>{tag}</span>
                    ))}
                  </div>
                </div>
                <div style={{ width: "32px", height: "32px", background: theme.accent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, position: "absolute", right: "16px", bottom: "16px" }}>→</div>
              </div>

              {/* Provider */}
              <div onClick={() => { setPhoneNumber(""); goTo("provider_phone"); }}
                style={{ background: isDark ? "linear-gradient(135deg, #0F1A2E, #162035)" : theme.card, border: `2px solid ${isDark ? "rgba(34,197,94,0.3)" : "rgba(34,197,94,0.4)"}`, borderRadius: "16px", padding: "24px", cursor: "pointer", display: "flex", alignItems: "center", transition: "all 0.25s ease", position: "relative" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = theme.success; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(34,197,94,0.3)" : "rgba(34,197,94,0.4)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ width: "80px", height: "80px", background: "rgba(34,197,94,0.12)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", flexShrink: 0 }}>💼</div>
                <div style={{ flex: 1, paddingLeft: "16px" }}>
                  <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "22px", fontWeight: 700, color: theme.text, margin: 0 }}>Service Provider</p>
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "13px", color: theme.sub, marginTop: "4px" }}>Grow your business with Heyy</p>
                  <div style={{ display: "inline-block", background: "rgba(34,197,94,0.12)", color: theme.success, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "12px", fontWeight: 700, borderRadius: "8px", padding: "4px 10px", marginTop: "10px" }}>💰 Earn ₹800+ daily</div>
                </div>
                <div style={{ width: "32px", height: "32px", background: theme.success, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, position: "absolute", right: "16px", bottom: "16px" }}>→</div>
              </div>
            </div>

            {/* Bottom */}
            <div style={{ textAlign: "center", marginTop: "24px", padding: "0 16px 40px" }}>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "12px", color: theme.sub, margin: 0 }}>
                {statsLoading ? "Loading..." : `Trusted by ${stats.userCount.toLocaleString()}+ Kerala families`}
              </p>
              <div style={{ display: "flex", justifyContent: "center", marginTop: "12px" }}>
                {avatars.map((avatar, index) => (
                  <div key={avatar.initials} style={{ width: "28px", height: "28px", borderRadius: "50%", background: avatar.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "10px", fontWeight: 700, color: "white", border: `2px solid ${theme.bg}`, marginLeft: index === 0 ? 0 : "-8px" }}>{avatar.initials}</div>
                ))}
              </div>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "12px", color: theme.sub, marginTop: "16px" }}>
                Just browsing?{" "}
                <span onClick={() => { setPhoneNumber(""); goTo("guest_phone"); }} style={{ color: theme.accent, fontWeight: 700, cursor: "pointer" }}>Enter as Guest →</span>
              </p>
            </div>
          </div>
        )}

        {/* ══ CUSTOMER CHOICE ══ */}
        {step === "customer_choice" && (
          <div style={{ animation: getSlideAnimation(), paddingBottom: "40px" }}>
            <div style={headerStyle}>
              <button onClick={() => goTo("welcome", "left")} style={backBtn}>←</button>
              <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: theme.text, margin: 0 }}>Customer</h1>
            </div>
            <div style={{ textAlign: "center", padding: "24px 16px 32px" }}>
              <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "42px", fontWeight: 700, color: theme.accent, letterSpacing: "-1px", textShadow: "0 0 40px rgba(59,130,246,0.4)", margin: 0 }}>Heyy</h1>
              <div style={{ fontSize: "48px", marginTop: "8px", animation: "float 3s ease-in-out infinite" }}>🏠</div>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "14px", color: theme.sub, marginTop: "12px" }}>Book trusted local services across Kerala</p>
            </div>
            <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Register card */}
              <div onClick={() => goTo("register_phone")}
                style={{ background: theme.card, border: `2px solid ${isDark ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.4)"}`, borderRadius: "16px", padding: "20px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: "16px", transition: "all 0.25s ease" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.4)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ width: "52px", height: "52px", background: "rgba(59,130,246,0.12)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0 }}>📝</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", fontWeight: 700, color: theme.text, margin: 0 }}>Register</p>
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "12px", color: theme.sub, marginTop: "3px" }}>New to Heyy? Create your account</p>
                </div>
                <span style={{ color: theme.accent, fontSize: "20px", fontWeight: 700 }}>→</span>
              </div>
              {/* Login card */}
              <div onClick={() => goTo("login")}
                style={{ background: theme.card, border: `2px solid ${isDark ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.25)"}`, borderRadius: "16px", padding: "20px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: "16px", transition: "all 0.25s ease" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.25)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ width: "52px", height: "52px", background: "rgba(59,130,246,0.08)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0 }}>🔑</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", fontWeight: 700, color: theme.text, margin: 0 }}>Login</p>
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "12px", color: theme.sub, marginTop: "3px" }}>Already registered? Sign in here</p>
                </div>
                <span style={{ color: theme.accent, fontSize: "20px", fontWeight: 700 }}>→</span>
              </div>
            </div>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "12px", color: theme.sub, textAlign: "center", marginTop: "24px" }}>
              Just browsing?{" "}
              <span onClick={() => { setPhoneNumber(""); goTo("guest_phone"); }} style={{ color: theme.accent, fontWeight: 700, cursor: "pointer" }}>Enter as Guest →</span>
            </p>
          </div>
        )}

        {/* ══ REGISTER: PHONE ══ */}
        {step === "register_phone" && (
          <div style={{ animation: getSlideAnimation(), paddingBottom: "80px" }}>
            <div style={headerStyle}>
              <button onClick={() => goTo("customer_choice", "left")} style={backBtn}>←</button>
              <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: theme.text, margin: 0 }}>Register</h1>
            </div>
            <div style={{ display: "flex", gap: "6px", margin: "8px 16px 24px" }}>
              {[1, 2, 3].map(s => <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s === 1 ? theme.accent : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />)}
            </div>
            <div style={{ padding: "0 16px" }}>
              <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "13px", color: theme.accent, fontWeight: 700, letterSpacing: "0.08em", marginBottom: "8px" }}>STEP 1 OF 3</p>
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "26px", fontWeight: 800, color: theme.text, marginBottom: "6px" }}>Your phone number</h2>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "14px", color: theme.sub, marginBottom: "24px" }}>We&apos;ll send an OTP to verify</p>
              <PhoneInput accent={theme.accent} />
            </div>
            <ErrorMsg />
            <button onClick={handleRegisterSendOtp} disabled={loading || phoneNumber.length !== 10} style={primaryBtn(loading || phoneNumber.length !== 10)}>
              {loading ? "Checking..." : "Send OTP →"}
            </button>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "11px", color: theme.sub, textAlign: "center", marginTop: "16px", padding: "0 16px" }}>
              By continuing you agree to our <span style={{ color: theme.accent, cursor: "pointer" }}>Terms</span> & <span style={{ color: theme.accent, cursor: "pointer" }}>Privacy Policy</span>
            </p>
          </div>
        )}

        {/* ══ REGISTER: OTP ══ */}
        {step === "register_otp" && (
          <div style={{ animation: getSlideAnimation(), paddingBottom: "40px" }}>
            <div style={headerStyle}>
              <button onClick={() => goTo("register_phone", "left")} style={backBtn}>←</button>
              <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: theme.text, margin: 0 }}>Verify Number</h1>
            </div>
            <div style={{ display: "flex", gap: "6px", margin: "8px 16px 24px" }}>
              {[1, 2, 3].map(s => <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= 2 ? theme.accent : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }} />)}
            </div>
            <div style={{ textAlign: "center", padding: "20px 16px" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: "48px" }}>🔐</div>
              <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "13px", color: theme.accent, fontWeight: 700, letterSpacing: "0.08em", margin: "16px 0 4px" }}>STEP 2 OF 3</p>
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "24px", fontWeight: 800, color: theme.text, margin: "0 0 6px" }}>Enter OTP</h2>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "14px", color: theme.sub }}>
                Sent to <span style={{ color: theme.accent, fontWeight: 600 }}>+91 {formatPhone(phoneNumber)}</span>
              </p>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "12px", color: "#F59E0B", marginTop: "4px" }}>⚡ Dev mode: Check browser console</p>
            </div>
            <OtpBoxes accent={theme.accent} theme={theme} otpRefs={otpRefs} onComplete={(val) => setOtp(val.split(""))} />
            <ErrorMsg />
            <button onClick={handleRegisterVerifyOtp} disabled={otp.join("").length !== 6 || isVerified} style={primaryBtn(otp.join("").length !== 6 || isVerified)}>
              {isVerified ? "✓ Verified!" : "Verify OTP →"}
            </button>
            <ResendOtp onResend={sendOtp} accent={theme.accent} />
          </div>
        )}

        {/* ══ REGISTER: DETAILS ══ */}
        {step === "register_details" && (
          <div style={{ animation: getSlideAnimation(), paddingBottom: "48px" }}>
            <div style={headerStyle}>
              <button onClick={() => goTo("register_phone", "left")} style={backBtn}>←</button>
              <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: theme.text, margin: 0 }}>Create Profile</h1>
            </div>
            <div style={{ display: "flex", gap: "6px", margin: "8px 16px 24px" }}>
              {[1, 2, 3].map(s => <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: theme.accent }} />)}
            </div>
            <div style={{ padding: "0 16px" }}>
              <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "13px", color: theme.accent, fontWeight: 700, letterSpacing: "0.08em", marginBottom: "8px" }}>STEP 3 OF 3</p>
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "26px", fontWeight: 800, color: theme.text, marginBottom: "4px" }}>Your details</h2>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "14px", color: theme.sub, marginBottom: "24px" }}>Fill in your info to complete registration</p>

              {/* Required */}
              <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "11px", fontWeight: 700, color: theme.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Required</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input value={regName} onChange={e => { setRegName(e.target.value); setError(""); }} placeholder="Enter your full name" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)"; }}
                    onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                </div>

                <div>
                  <label style={labelStyle}>Username</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: theme.sub, fontSize: "15px" }}>@</span>
                    <input value={regUsername} onChange={e => { setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, "")); setError(""); }} placeholder="username" maxLength={20}
                      style={{ ...inputStyle, paddingLeft: "30px" }}
                      onFocus={e => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)"; }}
                      onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                  </div>
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "11px", color: theme.sub, marginTop: "4px" }}>Lowercase letters, numbers, _ and . only</p>
                </div>

                <div>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input type={showRegPw ? "text" : "password"} value={regPassword} onChange={e => { setRegPassword(e.target.value); setError(""); }} placeholder="Min 6 characters"
                      style={{ ...inputStyle, paddingRight: "48px" }}
                      onFocus={e => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)"; }}
                      onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                    <button onClick={() => setShowRegPw(!showRegPw)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}>{showRegPw ? "🙈" : "👁️"}</button>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Confirm Password</label>
                  <div style={{ position: "relative" }}>
                    <input type={showRegConfirmPw ? "text" : "password"} value={regConfirmPw} onChange={e => { setRegConfirmPw(e.target.value); setError(""); }} placeholder="Re-enter password"
                      style={{ ...inputStyle, paddingRight: "48px" }}
                      onFocus={e => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)"; }}
                      onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                    <button onClick={() => setShowRegConfirmPw(!showRegConfirmPw)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}>{showRegConfirmPw ? "🙈" : "👁️"}</button>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>District</label>
                  <select value={regDistrict} onChange={e => { setRegDistrict(e.target.value); setError(""); }}
                    style={{ ...inputStyle, appearance: "none", color: regDistrict ? theme.text : theme.sub }}>
                    <option value="" disabled>Select your district</option>
                    {DISTRICTS.map(d => <option key={d} value={d} style={{ background: isDark ? "#0D1729" : "#fff", color: theme.text }}>{d}</option>)}
                  </select>
                </div>

                {/* Optional */}
                <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "11px", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "8px" }}>Optional</p>

                {[
                  { label: "Email", value: regEmail, onChange: setRegEmail, placeholder: "your@email.com", type: "email" },
                  { label: "Address / House Name", value: regAddress, onChange: setRegAddress, placeholder: "House name or flat number" },
                  { label: "Landmark", value: regLandmark, onChange: setRegLandmark, placeholder: "Near school, mosque, temple..." },
                  { label: "Village / Town", value: regVillage, onChange: setRegVillage, placeholder: "Your village or town" },
                  { label: "Pincode", value: regPincode, onChange: (v: string) => setRegPincode(v.replace(/\D/g, "")), placeholder: "6-digit pincode", type: "tel", maxLength: 6 },
                ].map(field => (
                  <div key={field.label}>
                    <label style={{ ...labelStyle, color: theme.sub }}>{field.label}</label>
                    <input
                      type={field.type || "text"}
                      value={field.value}
                      onChange={e => field.onChange(e.target.value)}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      style={{ ...inputStyle, background: `${theme.input}88`, border: `1px solid ${theme.inputBorder}88` }}
                      onFocus={e => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)"; }}
                      onBlur={e => { e.target.style.borderColor = `${theme.inputBorder}88`; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <ErrorMsg />
            <button onClick={handleRegisterSave} disabled={loading} style={primaryBtn(loading)}>
              {loading ? "Creating account..." : "Create Account 🌴"}
            </button>
          </div>
        )}

        {/* ══ LOGIN ══ */}
        {step === "login" && (
          <div style={{ animation: getSlideAnimation(), paddingBottom: "40px" }}>
            <div style={headerStyle}>
              <button onClick={() => goTo("customer_choice", "left")} style={backBtn}>←</button>
              <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: theme.text, margin: 0 }}>Login</h1>
            </div>
            <div style={{ textAlign: "center", padding: "24px 16px 32px" }}>
              <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "42px", fontWeight: 700, color: theme.accent, letterSpacing: "-1px", textShadow: "0 0 40px rgba(59,130,246,0.4)", margin: 0 }}>Heyy</h1>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "14px", color: theme.sub, marginTop: "6px" }}>Welcome back 👋</p>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "16px auto 0", animation: "float 3s ease-in-out infinite" }}>
                <span style={{ fontSize: "44px" }}>🌴</span>
              </div>
            </div>
            <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Username or Phone Number</label>
                <input value={loginId} onChange={e => { setLoginId(e.target.value); setError(""); }} placeholder="Enter username or phone"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)"; }}
                  onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showLoginPw ? "text" : "password"} value={loginPw}
                    onChange={e => { setLoginPw(e.target.value); setError(""); }} placeholder="Enter your password"
                    onKeyDown={e => { if (e.key === "Enter") handleLogin(); }}
                    style={{ ...inputStyle, paddingRight: "48px" }}
                    onFocus={e => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)"; }}
                    onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                  <button onClick={() => setShowLoginPw(!showLoginPw)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}>{showLoginPw ? "🙈" : "👁️"}</button>
                </div>
              </div>
              <p onClick={() => { setPhoneNumber(""); goTo("forgot_phone"); }} style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "13px", color: theme.accent, cursor: "pointer", textAlign: "right", margin: 0 }}>Forgot Password?</p>
            </div>
            <ErrorMsg />
            <button onClick={handleLogin} disabled={loading || !loginId.trim() || !loginPw.trim()} style={primaryBtn(loading || !loginId.trim() || !loginPw.trim())}>
              {loading ? "Signing in..." : "Login →"}
            </button>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "13px", color: theme.sub, textAlign: "center", marginTop: "20px" }}>
              New to Heyy?{" "}
              <span onClick={() => goTo("register_phone")} style={{ color: theme.accent, fontWeight: 700, cursor: "pointer" }}>Register →</span>
            </p>
          </div>
        )}

        {/* ══ FORGOT: PHONE ══ */}
        {step === "forgot_phone" && (
          <div style={{ animation: getSlideAnimation(), paddingBottom: "80px" }}>
            <div style={headerStyle}>
              <button onClick={() => goTo("login", "left")} style={backBtn}>←</button>
              <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: theme.text, margin: 0 }}>Reset Password</h1>
            </div>
            <div style={{ padding: "24px 16px" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 0 20px", fontSize: "40px" }}>🔑</div>
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "24px", fontWeight: 800, color: theme.text, marginBottom: "6px" }}>Forgot Password?</h2>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "14px", color: theme.sub, marginBottom: "24px" }}>Enter your registered phone number</p>
              <PhoneInput accent={theme.accent} />
            </div>
            <ErrorMsg />
            <button onClick={handleForgotSendOtp} disabled={loading || phoneNumber.length !== 10} style={primaryBtn(loading || phoneNumber.length !== 10)}>
              {loading ? "Checking..." : "Send OTP →"}
            </button>
          </div>
        )}

        {/* ══ FORGOT: OTP ══ */}
        {step === "forgot_otp" && (
          <div style={{ animation: getSlideAnimation(), paddingBottom: "40px" }}>
            <div style={headerStyle}>
              <button onClick={() => goTo("forgot_phone", "left")} style={backBtn}>←</button>
              <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: theme.text, margin: 0 }}>Verify Number</h1>
            </div>
            <div style={{ textAlign: "center", padding: "24px 16px" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: "48px" }}>🔐</div>
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "22px", fontWeight: 800, color: theme.text, marginTop: "16px", marginBottom: "6px" }}>Enter OTP</h2>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "14px", color: theme.sub }}>Sent to <span style={{ color: theme.accent, fontWeight: 600 }}>+91 {formatPhone(phoneNumber)}</span></p>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "12px", color: "#F59E0B", marginTop: "4px" }}>⚡ Dev mode: Check browser console</p>
            </div>
            <OtpBoxes accent={theme.accent} theme={theme} otpRefs={otpRefs} onComplete={(val) => setOtp(val.split(""))} />
            <ErrorMsg />
            <button onClick={handleForgotVerifyOtp} disabled={otp.join("").length !== 6 || isVerified} style={primaryBtn(otp.join("").length !== 6 || isVerified)}>
              {isVerified ? "✓ Verified!" : "Verify OTP →"}
            </button>
            <ResendOtp onResend={sendOtp} accent={theme.accent} />
          </div>
        )}

        {/* ══ FORGOT: NEW PASSWORD ══ */}
        {step === "forgot_newpassword" && (
          <div style={{ animation: getSlideAnimation(), paddingBottom: "40px" }}>
            <div style={headerStyle}>
              <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: theme.text, margin: 0 }}>New Password</h1>
            </div>
            <div style={{ padding: "24px 16px" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 0 20px", fontSize: "40px" }}>✅</div>
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "24px", fontWeight: 800, color: theme.text, marginBottom: "6px" }}>Set New Password</h2>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "14px", color: theme.sub, marginBottom: "24px" }}>Choose a strong password</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>New Password</label>
                  <div style={{ position: "relative" }}>
                    <input type={showNewPw ? "text" : "password"} value={newPassword} onChange={e => { setNewPassword(e.target.value); setError(""); }} placeholder="Min 6 characters"
                      style={{ ...inputStyle, paddingRight: "48px" }}
                      onFocus={e => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)"; }}
                      onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                    <button onClick={() => setShowNewPw(!showNewPw)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}>{showNewPw ? "🙈" : "👁️"}</button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Confirm New Password</label>
                  <input type="password" value={confirmNewPassword} onChange={e => { setConfirmNewPassword(e.target.value); setError(""); }} placeholder="Re-enter password"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)"; }}
                    onBlur={e => { e.target.style.borderColor = theme.inputBorder; e.target.style.boxShadow = "none"; }} />
                </div>
              </div>
            </div>
            <ErrorMsg />
            <button onClick={handleForgotSavePassword} disabled={loading} style={primaryBtn(loading)}>
              {loading ? "Saving..." : "Save Password →"}
            </button>
          </div>
        )}

        {/* ══ GUEST: PHONE ══ */}
        {step === "guest_phone" && (
          <div style={{ animation: getSlideAnimation(), paddingBottom: "80px" }}>
            <div style={headerStyle}>
              <button onClick={() => goTo("welcome", "left")} style={backBtn}>←</button>
              <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: theme.text, margin: 0 }}>Guest Access</h1>
            </div>
            <div style={{ padding: "24px 16px" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 0 20px", fontSize: "40px", animation: "float 3s ease-in-out infinite" }}>👤</div>
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "26px", fontWeight: 800, color: theme.text, marginBottom: "6px" }}>Browse as Guest</h2>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "14px", color: theme.sub, marginBottom: "24px" }}>Just your phone number to get started</p>
              <PhoneInput accent={theme.accent} />
            </div>
            <ErrorMsg />
            <button onClick={handleGuestSendOtp} disabled={loading || phoneNumber.length !== 10} style={primaryBtn(loading || phoneNumber.length !== 10)}>
              {loading ? "Sending..." : "Send OTP →"}
            </button>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "13px", color: theme.sub, textAlign: "center", marginTop: "20px" }}>
              Want full access?{" "}
              <span onClick={() => goTo("register_phone")} style={{ color: theme.accent, fontWeight: 700, cursor: "pointer" }}>Register →</span>
            </p>
          </div>
        )}

        {/* ══ GUEST: OTP ══ */}
        {step === "guest_otp" && (
          <div style={{ animation: getSlideAnimation(), paddingBottom: "40px" }}>
            <div style={headerStyle}>
              <button onClick={() => goTo("guest_phone", "left")} style={backBtn}>←</button>
              <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: theme.text, margin: 0 }}>Verify Number</h1>
            </div>
            <div style={{ textAlign: "center", padding: "24px 16px" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: "48px" }}>🔐</div>
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "22px", fontWeight: 800, color: theme.text, marginTop: "16px", marginBottom: "6px" }}>Enter OTP</h2>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "14px", color: theme.sub }}>Sent to <span style={{ color: theme.accent, fontWeight: 600 }}>+91 {formatPhone(phoneNumber)}</span></p>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "12px", color: "#F59E0B", marginTop: "4px" }}>⚡ Dev mode: Check browser console</p>
            </div>
            <OtpBoxes accent={theme.accent} theme={theme} otpRefs={otpRefs} onComplete={(val) => setOtp(val.split(""))} />
            <ErrorMsg />
            <button onClick={handleGuestVerifyOtp} disabled={otp.join("").length !== 6 || isVerified} style={primaryBtn(otp.join("").length !== 6 || isVerified)}>
              {isVerified ? "✓ Entering..." : "Continue as Guest →"}
            </button>
            <ResendOtp onResend={sendOtp} accent={theme.accent} />
          </div>
        )}

        {/* ══ PROVIDER: PHONE ══ */}
        {step === "provider_phone" && (
          <div style={{ animation: getSlideAnimation(), paddingBottom: "80px" }}>
            <div style={headerStyle}>
              <button onClick={() => goTo("welcome", "left")} style={backBtn}>←</button>
              <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "20px", fontWeight: 700, color: theme.text, margin: 0 }}>Join as Provider 💼</h1>
            </div>
            <div style={{ padding: "40px 16px 40px", textAlign: "center" }}>
              <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "42px", fontWeight: 700, color: theme.success, letterSpacing: "-1px", textShadow: "0 0 40px rgba(34,197,94,0.4)", margin: 0 }}>Heyy</h1>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "14px", color: theme.sub, marginTop: "8px" }}>Grow your business with us</p>
              <div style={{ width: "120px", height: "120px", borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.15), transparent 70%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "32px auto 0", animation: "float 3s ease-in-out infinite" }}>
                <span style={{ fontSize: "72px" }}>💼</span>
              </div>
            </div>
            <div style={{ padding: "0 16px" }}>
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "24px", fontWeight: 700, color: theme.text, margin: "0 0 6px" }}>Become a Provider 💪</h2>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "14px", color: theme.sub, marginBottom: "24px" }}>
                {statsLoading ? "Join service providers in Kerala" : `Join ${stats.providerCount}+ service providers in Kerala`}
              </p>
              <div style={{ background: theme.card, borderRadius: "16px", border: `1px solid ${theme.cardBorder}`, padding: "24px", boxShadow: theme.shadow }}>
                <label style={{ display: "block", fontFamily: "var(--font-syne), sans-serif", fontSize: "14px", fontWeight: 700, color: theme.text, marginBottom: "12px" }}>Enter your mobile number</label>
                <PhoneInput accent={theme.success} />
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "12px", color: theme.sub, marginTop: "10px" }}>We&apos;ll send a 6-digit OTP to verify</p>
              </div>
            </div>
            <ErrorMsg />
            <button onClick={handleProviderSendOtp} disabled={loading || phoneNumber.length !== 10} style={primaryBtn(loading || phoneNumber.length !== 10, true)}>
              {loading ? "Sending..." : "Continue →"}
            </button>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "11px", color: theme.sub, textAlign: "center", marginTop: "16px", padding: "0 16px" }}>
              By continuing you agree to our <span style={{ color: theme.success, cursor: "pointer" }}>Terms</span> & <span style={{ color: theme.success, cursor: "pointer" }}>Privacy Policy</span>
            </p>
          </div>
        )}

        {/* ══ PROVIDER: OTP ══ */}
        {step === "provider_otp" && (
          <div style={{ animation: getSlideAnimation(), paddingBottom: "40px" }}>
            <div style={headerStyle}>
              <button onClick={() => goTo("provider_phone", "left")} style={backBtn}>←</button>
              <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", fontWeight: 700, color: theme.text, margin: 0 }}>Verify Number</h1>
            </div>
            <div style={{ textAlign: "center", padding: "40px 16px 32px" }}>
              <div style={{ width: "88px", height: "88px", borderRadius: "50%", background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: "64px" }}>🔐</div>
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "22px", fontWeight: 700, color: theme.text, marginTop: "20px", marginBottom: 0 }}>OTP Sent!</h2>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "14px", color: theme.sub, marginTop: "6px" }}>Sent to <span style={{ color: theme.success, fontWeight: 600 }}>+91 {formatPhone(phoneNumber)}</span></p>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "12px", color: "#F59E0B", marginTop: "4px" }}>⚡ Dev mode: Check browser console</p>
            </div>
            <OtpBoxes accent={theme.success} theme={theme} otpRefs={otpRefs} onComplete={(val) => setOtp(val.split(""))} />
            <ErrorMsg />
            <button onClick={handleProviderVerifyOtp} disabled={otp.join("").length !== 6 || isVerified} style={primaryBtn(otp.join("").length !== 6 || isVerified, true)}>
              {isVerified ? "✓ Verified!" : "Verify & Continue →"}
            </button>
            <ResendOtp onResend={sendOtp} accent={theme.success} />
            <div style={{ background: "rgba(34,197,94,0.08)", borderRadius: "12px", padding: "12px 16px", margin: "24px 16px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "12px", color: theme.success, margin: 0 }}>💡 Demo: Use any 10-digit number, OTP: 123456</p>
            </div>
          </div>
        )}

        {/* ══ PROVIDER: VERIFIED ══ */}
        {step === "provider_verified" && (
          <div style={{ animation: getSlideAnimation(), paddingBottom: "40px" }}>
            <div style={headerStyle}>
              <button onClick={() => goTo("welcome", "left")} style={backBtn}>←</button>
              <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", fontWeight: 700, color: theme.text, margin: 0 }}>Welcome Provider</h1>
            </div>
            <div style={{ background: theme.card, borderRadius: "16px", border: `1px solid ${theme.cardBorder}`, padding: "24px", margin: "40px 16px 0", textAlign: "center" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", fontSize: "48px" }}>✅</div>
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", fontWeight: 700, color: theme.success, marginTop: "16px" }}>Number Verified!</h2>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "14px", color: theme.sub, marginTop: "6px" }}>Let&apos;s set up your provider profile</p>
              <div style={{ marginTop: "16px", textAlign: "left" }}>
                {["💰 Earn ₹800+ per day", "⭐ Build your reputation", "📱 Manage bookings easily", "🌴 Serve Kerala customers"].map((benefit, index) => (
                  <div key={index} style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "13px", color: theme.text, padding: "12px 0", borderBottom: index < 3 ? `1px solid ${theme.cardBorder}` : "none" }}>{benefit}</div>
                ))}
              </div>
              <button onClick={() => router.push("/provider/register")}
                style={{ width: "100%", background: "linear-gradient(135deg, #22C55E, #16A34A)", color: "white", fontFamily: "var(--font-syne), sans-serif", fontSize: "15px", fontWeight: 700, borderRadius: "12px", padding: "16px", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(34,197,94,0.4)", marginTop: "20px" }}>
                Start Registration →
              </button>
            </div>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "12px", color: theme.sub, textAlign: "center", marginTop: "24px", padding: "0 16px" }}>
              Registration takes only 5 minutes. You&apos;ll need your Aadhaar and a photo.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
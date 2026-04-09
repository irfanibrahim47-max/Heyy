"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, ChevronRight, CheckCircle as CheckCircle2, Image as ImageIcon, Navigation, Globe, Loader as Loader2, X, Plus, Shield, AlertTriangle } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { supabase } from "@/lib/supabase"
import { categories } from "@/lib/categories"

const radiusOptions = [5, 10, 20, 30, 50]

const pricingTypes: { id: string; label: string; emoji: string; unit: string; custom: boolean; placeholder?: string }[] = [
  { id: "hourly", label: "Per Hour", emoji: "⏰", unit: "hr", custom: false },
  { id: "daily", label: "Per Day", emoji: "📅", unit: "day", custom: false },
  { id: "per_unit", label: "Per Unit", emoji: "🌴", unit: "", custom: true, placeholder: "e.g. tree, snake, room" },
  { id: "per_work", label: "Per Work", emoji: "🎨", unit: "", custom: true, placeholder: "e.g. hand, event, dress" },
  { id: "per_kg", label: "Per Kg/Qty", emoji: "📦", unit: "", custom: true, placeholder: "e.g. kg, packet, piece" },
  { id: "per_km", label: "Per Km/Trip", emoji: "🚗", unit: "", custom: true, placeholder: "e.g. km, trip" },
  { id: "quote", label: "Get Quote", emoji: "💬", unit: "", custom: false },
  { id: "package", label: "Package", emoji: "📋", unit: "", custom: true, placeholder: "e.g. month, week" },
]

export default function ProviderRegistrationPage() {
  const router = useRouter()
  const { theme, isDark, mounted } = useTheme()
  const [step, setStep] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    category: "",
    experience: "",
    hourlyRate: "",
    dailyRate: "",
    priceType: "",
    priceUnit: "",
    about: "",
    languages: [] as string[],
    profilePhoto: null as string | null,
    serviceAreaType: "" as "nearby" | "all_kerala" | "",
    latitude: null as number | null,
    longitude: null as number | null,
    radiusKm: 20,
    servesAllKerala: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [serviceOptions, setServiceOptions] = useState<string[]>([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [othersActive, setOthersActive] = useState(false)
  const [customServiceText, setCustomServiceText] = useState("")

  // Aadhaar state
  const [aadhaarLast4, setAadhaarLast4] = useState("")
  const [aadhaarFront, setAadhaarFront] = useState<File | null>(null)
  const [aadhaarBack, setAadhaarBack] = useState<File | null>(null)
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState<string | null>(null)
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState<string | null>(null)
  const [aadhaarConsent, setAadhaarConsent] = useState(false)
  const [uploadingAadhaar, setUploadingAadhaar] = useState(false)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const aadhaarFrontRef = useRef<HTMLInputElement>(null)
  const aadhaarBackRef = useRef<HTMLInputElement>(null)

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePhoto: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAadhaarPhoto = (side: "front" | "back", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      if (side === "front") { setAadhaarFront(file); setAadhaarFrontPreview(reader.result as string) }
      else { setAadhaarBack(file); setAadhaarBackPreview(reader.result as string) }
    }
    reader.readAsDataURL(file)
  }

  const updateFormData = (key: string, value: string | string[] | number | boolean | null) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleCategorySelect = (categoryName: string) => {
    updateFormData("category", categoryName)
    setSelectedServices([])
    setOthersActive(false)
    setCustomServiceText("")
  }

  useEffect(() => {
    if (!formData.category) { setServiceOptions([]); return }
    let cancelled = false
    async function fetchServices() {
      setLoadingServices(true)
      const { data } = await supabase.from("services").select("name").eq("category", formData.category).order("name")
      if (!cancelled) { setServiceOptions((data || []).map((s: { name: string }) => s.name)); setLoadingServices(false) }
    }
    fetchServices()
    return () => { cancelled = true }
  }, [formData.category])

  const toggleService = (serviceName: string) => {
    if (serviceName === "Others") { setOthersActive((prev) => !prev); if (othersActive) setCustomServiceText(""); return }
    setSelectedServices((prev) => prev.includes(serviceName) ? prev.filter((s) => s !== serviceName) : [...prev, serviceName])
  }

  const addCustomService = () => {
    const trimmed = customServiceText.trim()
    if (!trimmed) return
    if (!selectedServices.includes(trimmed)) setSelectedServices((prev) => [...prev, trimmed])
    setCustomServiceText("")
  }

  const removeService = (serviceName: string) => setSelectedServices((prev) => prev.filter((s) => s !== serviceName))

  const handleSelectNearby = () => {
    setLocationError(null)
    setFormData(prev => ({ ...prev, serviceAreaType: "nearby", servesAllKerala: false }))
    detectLocation()
  }

  const handleSelectAllKerala = () => {
    setLocationError(null)
    setFormData(prev => ({ ...prev, serviceAreaType: "all_kerala", servesAllKerala: true, radiusKm: 500, latitude: 10.8505, longitude: 76.2711 }))
  }

  const detectLocation = () => {
    if (!navigator.geolocation) { setLocationError("Geolocation is not supported by your browser"); return }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => { setFormData(prev => ({ ...prev, latitude: position.coords.latitude, longitude: position.coords.longitude })); setIsLocating(false); setLocationError(null) },
      (error) => {
        setIsLocating(false)
        if (error.code === error.PERMISSION_DENIED) setLocationError("Please allow location access")
        else if (error.code === error.POSITION_UNAVAILABLE) setLocationError("Location unavailable")
        else setLocationError("Location request timed out")
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const toggleLanguage = (lang: string) => {
    setFormData((prev) => ({ ...prev, languages: prev.languages.includes(lang) ? prev.languages.filter((l) => l !== lang) : [...prev.languages, lang] }))
  }

  const handleNext = () => { if (step < 5) setStep(step + 1); else handleSubmit() }
  const handleBack = () => { if (step > 1) setStep(step - 1); else router.back() }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setUploadingAadhaar(true)
    try {
      const { data: existingProvider } = await supabase
        .from('providers')
        .select('id')
        .eq('phone', formData.phone)
        .single()

      if (existingProvider) {
        alert('A provider with this phone number already exists. Please login instead.')
        setIsSubmitting(false)
        setUploadingAadhaar(false)
        return
      }

      const userId = localStorage.getItem("heyy_user_id")
      let aadhaarFrontUrl = null
      let aadhaarBackUrl = null

      // Upload Aadhaar front
      if (aadhaarFront) {
        const frontPath = `aadhaar/${Date.now()}_front_${aadhaarFront.name}`
        const { data: frontData } = await supabase.storage.from("aadhaar-docs").upload(frontPath, aadhaarFront, { upsert: true })
        if (frontData) {
          const { data: urlData } = supabase.storage.from("aadhaar-docs").getPublicUrl(frontPath)
          aadhaarFrontUrl = urlData.publicUrl
        }
      }

      // Upload Aadhaar back
      if (aadhaarBack) {
        const backPath = `aadhaar/${Date.now()}_back_${aadhaarBack.name}`
        const { data: backData } = await supabase.storage.from("aadhaar-docs").upload(backPath, aadhaarBack, { upsert: true })
        if (backData) {
          const { data: urlData } = supabase.storage.from("aadhaar-docs").getPublicUrl(backPath)
          aadhaarBackUrl = urlData.publicUrl
        }
      }

      setUploadingAadhaar(false)

      const insertData = {
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email || null,
        category: formData.category,
        services: selectedServices,
        service_type: selectedServices[0] || "",
        experience_years: parseInt(formData.experience) || 0,
        hourly_rate: parseInt(formData.hourlyRate) || 0,
        daily_rate: formData.dailyRate ? parseInt(formData.dailyRate) : null,
        price_type: formData.priceType || null,
        price_unit: formData.priceUnit || null,
        about: formData.about || null,
        languages: formData.languages.length > 0 ? formData.languages : [],
        latitude: formData.latitude,
        longitude: formData.longitude,
        radius_km: formData.radiusKm,
        serves_all_kerala: formData.servesAllKerala,
        user_id: userId || null,
        aadhaar_last4: aadhaarLast4 || null,
        aadhaar_front_url: aadhaarFrontUrl,
        aadhaar_back_url: aadhaarBackUrl,
        aadhaar_consent: aadhaarConsent,
        aadhaar_submitted_at: new Date().toISOString(),
        is_verified: false,
      }

      const { error } = await supabase.from("providers").insert(insertData).select()
      if (error) { alert(`Registration failed: ${error.message}`); setIsSubmitting(false); return }
      setIsSubmitting(false)
      setShowSuccess(true)
    } catch (error: any) {
      alert(`Registration failed: ${error?.message || "Unknown error"}`)
      setIsSubmitting(false)
      setUploadingAadhaar(false)
    }
  }

  const isStepValid = () => {
    switch (step) {
      case 1: return !!(formData.fullName && formData.phone)
      case 2: return !!(formData.category !== "" && selectedServices.length > 0)
      case 3: return !!(formData.experience && (formData.priceType === "quote" || (formData.priceType && formData.hourlyRate)))
      case 4:
        if (formData.serviceAreaType === "all_kerala") return true
        if (formData.serviceAreaType === "nearby" && formData.latitude && formData.longitude) return true
        return false
      case 5: return !!(aadhaarLast4.length === 4 && aadhaarFront && aadhaarBack && aadhaarConsent)
      default: return false
    }
  }

  if (!mounted) return <div style={{ minHeight: "100vh", backgroundColor: "#080F1E", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: "32px", height: "32px", border: "2px solid #3B82F6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>

  if (showSuccess) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#080F1E", fontFamily: "var(--font-dm-sans), sans-serif", maxWidth: "430px", margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "96px", height: "96px", borderRadius: "50%", backgroundColor: "rgba(34,197,94,0.15)", boxShadow: "0 0 60px rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px" }}>
            <CheckCircle2 style={{ width: "56px", height: "56px", color: "#22C55E" }} />
          </div>
          <h1 style={{ fontFamily: "var(--font-syne), sans-serif", color: "#FFFFFF", fontSize: "24px", fontWeight: 700, marginBottom: "12px" }}>Registration Submitted!</h1>
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "16px", marginBottom: "8px" }}>Thank you for joining Heyy! 🌴</p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: "8px" }}>We will verify your Aadhaar and profile within 24-48 hours</p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: "40px" }}>You will receive SMS once approved</p>
          <div style={{ backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px", padding: "14px 16px", marginBottom: "24px", textAlign: "left" }}>
            <p style={{ color: "#3B82F6", fontSize: "13px", fontWeight: 600, margin: "0 0 4px" }}>🔒 Your data is secure</p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", margin: 0 }}>Aadhaar documents are encrypted and only used for verification as per UIDAI guidelines</p>
          </div>
          <button onClick={() => router.push("/home")} style={{ width: "100%", padding: "16px", backgroundColor: "#22C55E", color: "white", fontFamily: "var(--font-syne), sans-serif", fontSize: "15px", fontWeight: 700, borderRadius: "12px", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(34,197,94,0.4)" }}>
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", paddingBottom: "100px", backgroundColor: theme.bg, fontFamily: "var(--font-dm-sans), sans-serif", maxWidth: "430px", margin: "0 auto" }}>

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: theme.headerBg, borderBottom: `1px solid ${theme.borderLight}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px" }}>
          <button onClick={handleBack} style={{ color: theme.text, background: "none", border: "none", cursor: "pointer", padding: "8px", borderRadius: "12px" }}>
            <ArrowLeft style={{ width: "20px", height: "20px" }} />
          </button>
          <h1 style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.text, fontSize: "18px", fontWeight: 700, margin: 0 }}>Become a Provider</h1>
          <div style={{ width: "36px" }} />
        </div>
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            {[1,2,3,4,5].map(s => <div key={s} style={{ flex: 1, height: "4px", borderRadius: "2px", backgroundColor: s <= step ? "#3B82F6" : theme.input, transition: "background 0.3s" }} />)}
          </div>
          <p style={{ fontSize: "11px", marginTop: "8px", textAlign: "center", color: theme.sub }}>Step {step} of 5</p>
        </div>
      </header>

      {/* STEP 1 — Personal Details */}
      {step === 1 && (
        <div style={{ padding: "20px 16px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.text, fontSize: "20px", fontWeight: 700, margin: "0 0 6px" }}>Personal Details</h2>
            <p style={{ color: theme.sub, fontSize: "13px", margin: 0 }}>Let's start with your basic information</p>
          </div>

          {/* Profile photo */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "24px" }}>
            <div style={{ width: "96px", height: "96px", borderRadius: "50%", overflow: "hidden", border: formData.profilePhoto ? "3px solid #3B82F6" : "2px dashed rgba(59,130,246,0.4)", backgroundColor: theme.input, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
              {formData.profilePhoto ? <img src={formData.profilePhoto} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Camera style={{ width: "32px", height: "32px", color: "rgba(255,255,255,0.4)" }} />}
            </div>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} style={{ display: "none" }} />
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={handlePhotoCapture} style={{ display: "none" }} />
            <div style={{ display: "flex", gap: "10px", width: "100%", maxWidth: "280px" }}>
              <button onClick={() => cameraInputRef.current?.click()} style={{ flex: 1, padding: "10px", backgroundColor: theme.input, border: "1px solid #3B82F6", borderRadius: "12px", color: "white", fontSize: "12px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <Camera style={{ width: "14px", height: "14px", color: "#3B82F6" }} /> Take Photo
              </button>
              <button onClick={() => galleryInputRef.current?.click()} style={{ flex: 1, padding: "10px", backgroundColor: "#3B82F6", border: "none", borderRadius: "12px", color: "white", fontSize: "12px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <ImageIcon style={{ width: "14px", height: "14px" }} /> Gallery
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>Full Name *</label>
              <input type="text" placeholder="Enter your full name" value={formData.fullName} onChange={e => updateFormData("fullName", e.target.value)}
                style={{ width: "100%", padding: "14px 16px", backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", color: theme.text, fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>Phone Number *</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ padding: "14px 16px", backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", color: theme.text, fontSize: "14px", flexShrink: 0 }}>+91</div>
                <input type="tel" placeholder="Enter phone number" value={formData.phone} onChange={e => updateFormData("phone", e.target.value)}
                  style={{ flex: 1, padding: "14px 16px", backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", color: theme.text, fontSize: "14px", outline: "none" }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>Email (Optional)</label>
              <input type="email" placeholder="Enter your email" value={formData.email} onChange={e => updateFormData("email", e.target.value)}
                style={{ width: "100%", padding: "14px 16px", backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", color: theme.text, fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 — Category */}
      {step === 2 && (
        <div style={{ padding: "20px 16px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.text, fontSize: "20px", fontWeight: 700, margin: "0 0 6px" }}>Service Category</h2>
            <p style={{ color: theme.sub, fontSize: "13px", margin: 0 }}>What type of service do you offer?</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            {categories.map(cat => {
              const isSelected = formData.category === cat.name
              return (
                <button key={cat.id} onClick={() => handleCategorySelect(cat.name)}
                  style={{ padding: "16px", textAlign: "left", backgroundColor: theme.card, border: `1px solid ${isSelected ? "#3B82F6" : theme.cardBorder}`, boxShadow: isSelected ? "0 0 0 1px #3B82F6" : "none", borderRadius: "16px", cursor: "pointer" }}>
                  <span style={{ fontSize: "24px", display: "block", marginBottom: "8px" }}>{cat.emoji}</span>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: theme.text, margin: 0 }}>{cat.name}</p>
                </button>
              )
            })}
          </div>

          {formData.category && (
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "12px" }}>Service Type * (select one or more)</label>
              {selectedServices.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                  {selectedServices.map(name => (
                    <span key={name} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "999px", backgroundColor: "#3B82F6", color: "#fff", fontSize: "12px", fontWeight: 500 }}>
                      {name}
                      <button onClick={() => removeService(name)} style={{ background: "none", border: "none", cursor: "pointer", color: "white", display: "flex", padding: 0 }}><X style={{ width: "12px", height: "12px" }} /></button>
                    </span>
                  ))}
                </div>
              )}
              {loadingServices ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}><Loader2 style={{ width: "24px", height: "24px", color: "#3B82F6", animation: "spin 0.8s linear infinite" }} /></div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
                  {serviceOptions.filter(n => n !== "Others").map(name => {
                    const isSel = selectedServices.includes(name)
                    return <button key={name} onClick={() => toggleService(name)} style={{ padding: "8px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 500, backgroundColor: isSel ? "#3B82F6" : "rgba(59,130,246,0.08)", color: isSel ? "#fff" : theme.text, border: `1px solid ${isSel ? "#3B82F6" : theme.inputBorder}`, cursor: "pointer" }}>{name}</button>
                  })}
                  <button onClick={() => toggleService("Others")} style={{ padding: "8px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 500, backgroundColor: othersActive ? "#3B82F6" : "rgba(59,130,246,0.08)", color: othersActive ? "#fff" : theme.text, border: `1px solid ${othersActive ? "#3B82F6" : theme.inputBorder}`, cursor: "pointer" }}>Others</button>
                </div>
              )}
              {othersActive && (
                <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                  <input type="text" placeholder="e.g., Coconut tree climber, Snake catcher..." value={customServiceText}
                    onChange={e => setCustomServiceText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomService() } }}
                    style={{ flex: 1, padding: "12px 14px", backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", color: theme.text, fontSize: "14px", outline: "none" }} />
                  <button onClick={addCustomService} disabled={!customServiceText.trim()} style={{ width: "48px", backgroundColor: "#3B82F6", border: "none", borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus style={{ width: "20px", height: "20px", color: "white" }} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STEP 3 — Experience & Pricing */}
      {step === 3 && (
        <div style={{ padding: "20px 16px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.text, fontSize: "20px", fontWeight: 700, margin: "0 0 6px" }}>Experience & Pricing</h2>
            <p style={{ color: theme.sub, fontSize: "13px", margin: 0 }}>Tell us about your experience and rates</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>Years of Experience *</label>
              <input type="number" placeholder="e.g., 5" value={formData.experience} onChange={e => updateFormData("experience", e.target.value)}
                style={{ width: "100%", padding: "14px 16px", backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", color: theme.text, fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "12px" }}>Pricing Type *</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {pricingTypes.map(pt => {
                  const isSel = formData.priceType === pt.id
                  return (
                    <button key={pt.id} onClick={() => setFormData(prev => ({ ...prev, priceType: pt.id, priceUnit: pt.unit, hourlyRate: pt.id === "quote" ? "" : prev.hourlyRate }))}
                      style={{ padding: "14px", textAlign: "left", backgroundColor: theme.card, border: `1px solid ${isSel ? "#3B82F6" : theme.cardBorder}`, boxShadow: isSel ? "0 0 0 1px #3B82F6, 0 4px 16px rgba(59,130,246,0.15)" : "none", borderRadius: "14px", cursor: "pointer" }}>
                      <span style={{ fontSize: "20px", display: "block", marginBottom: "6px" }}>{pt.emoji}</span>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: theme.text, margin: 0 }}>{pt.label}</p>
                    </button>
                  )
                })}
              </div>
            </div>
            {formData.priceType && formData.priceType !== "quote" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>Your Rate (₹) *</label>
                  <input type="number" placeholder="e.g., 500" value={formData.hourlyRate} onChange={e => updateFormData("hourlyRate", e.target.value)}
                    style={{ width: "100%", padding: "14px 16px", backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", color: theme.text, fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
                </div>
                {pricingTypes.find(p => p.id === formData.priceType)?.custom && (
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>Unit Label</label>
                    <input type="text" placeholder={pricingTypes.find(p => p.id === formData.priceType)?.placeholder || ""} value={formData.priceUnit} onChange={e => updateFormData("priceUnit", e.target.value)}
                      style={{ width: "100%", padding: "14px 16px", backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", color: theme.text, fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
                  </div>
                )}
              </div>
            )}
            {formData.priceType === "quote" && (
              <div style={{ padding: "14px 16px", backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>💬</span>
                <p style={{ fontSize: "13px", color: theme.sub, margin: 0 }}>Customers will contact you for a quote</p>
              </div>
            )}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>About You</label>
              <textarea placeholder="Tell customers about yourself and your services..." value={formData.about} onChange={e => updateFormData("about", e.target.value)}
                style={{ width: "100%", padding: "14px 16px", backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", color: theme.text, fontSize: "14px", outline: "none", resize: "none", minHeight: "100px", boxSizing: "border-box" }} />
            </div>
          </div>
        </div>
      )}

      {/* STEP 4 — Service Area */}
      {step === 4 && (
        <div style={{ padding: "20px 16px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.text, fontSize: "20px", fontWeight: 700, margin: "0 0 6px" }}>Service Area</h2>
            <p style={{ color: theme.sub, fontSize: "13px", margin: 0 }}>Where do you provide your services?</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button onClick={handleSelectNearby}
              style={{ padding: "20px", textAlign: "left", backgroundColor: formData.serviceAreaType === "nearby" ? "#3B82F6" : theme.input, border: `${formData.serviceAreaType === "nearby" ? "2px" : "1px"} solid ${formData.serviceAreaType === "nearby" ? "#3B82F6" : "rgba(59,130,246,0.3)"}`, borderRadius: "16px", cursor: "pointer", boxShadow: formData.serviceAreaType === "nearby" ? "0 4px 20px rgba(59,130,246,0.4)" : "none" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: formData.serviceAreaType === "nearby" ? "rgba(255,255,255,0.2)" : "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {isLocating ? <Loader2 style={{ width: "22px", height: "22px", color: "white", animation: "spin 0.8s linear infinite" }} /> : <Navigation style={{ width: "22px", height: "22px", color: formData.serviceAreaType === "nearby" ? "#fff" : "#3B82F6" }} />}
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "15px", fontWeight: 600, color: formData.serviceAreaType === "nearby" ? "#fff" : theme.text, margin: "0 0 4px" }}>My Nearby Area</p>
                  <p style={{ fontSize: "12px", color: formData.serviceAreaType === "nearby" ? "rgba(255,255,255,0.8)" : theme.sub, margin: 0 }}>Auto-detect location and serve within selected radius</p>
                </div>
              </div>
            </button>

            {formData.serviceAreaType === "nearby" && (
              <div style={{ padding: "16px", backgroundColor: theme.input, border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px", marginLeft: "16px" }}>
                {locationError && <div style={{ padding: "10px 12px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#EF4444", fontSize: "12px", marginBottom: "12px" }}>{locationError} <button onClick={detectLocation} style={{ background: "none", border: "none", color: "#EF4444", textDecoration: "underline", cursor: "pointer", fontSize: "12px" }}>Try again</button></div>}
                {formData.latitude && formData.longitude && <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10B981", fontSize: "12px", marginBottom: "12px" }}><CheckCircle2 style={{ width: "14px", height: "14px" }} /><span>Location detected ✓</span></div>}
                <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "10px" }}>Service Radius</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {radiusOptions.map(r => <button key={r} onClick={() => updateFormData("radiusKm", r)} style={{ flex: 1, padding: "10px 0", borderRadius: "8px", fontSize: "12px", fontWeight: 500, backgroundColor: formData.radiusKm === r ? "#3B82F6" : "rgba(59,130,246,0.1)", color: formData.radiusKm === r ? "#fff" : theme.sub, border: formData.radiusKm === r ? "none" : "1px solid rgba(59,130,246,0.2)", cursor: "pointer" }}>{r}km</button>)}
                </div>
              </div>
            )}

            <button onClick={handleSelectAllKerala}
              style={{ padding: "20px", textAlign: "left", backgroundColor: formData.serviceAreaType === "all_kerala" ? "#3B82F6" : theme.input, border: `${formData.serviceAreaType === "all_kerala" ? "2px" : "1px"} solid ${formData.serviceAreaType === "all_kerala" ? "#3B82F6" : "rgba(59,130,246,0.3)"}`, borderRadius: "16px", cursor: "pointer", boxShadow: formData.serviceAreaType === "all_kerala" ? "0 4px 20px rgba(59,130,246,0.4)" : "none" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: formData.serviceAreaType === "all_kerala" ? "rgba(255,255,255,0.2)" : "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Globe style={{ width: "22px", height: "22px", color: formData.serviceAreaType === "all_kerala" ? "#fff" : "#3B82F6" }} />
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "15px", fontWeight: 600, color: formData.serviceAreaType === "all_kerala" ? "#fff" : theme.text, margin: "0 0 4px" }}>Anywhere in Kerala</p>
                  <p style={{ fontSize: "12px", color: formData.serviceAreaType === "all_kerala" ? "rgba(255,255,255,0.8)" : theme.sub, margin: 0 }}>I can travel anywhere in Kerala</p>
                </div>
              </div>
            </button>
          </div>

          <div style={{ marginTop: "20px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "10px" }}>Languages Spoken</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {["Malayalam", "English", "Hindi", "Tamil", "Kannada"].map(lang => {
                const isSel = formData.languages.includes(lang)
                return <button key={lang} onClick={() => toggleLanguage(lang)} style={{ padding: "8px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 500, backgroundColor: isSel ? "#3B82F6" : "rgba(59,130,246,0.1)", color: isSel ? "#fff" : theme.sub, border: isSel ? "none" : "1px solid rgba(59,130,246,0.2)", cursor: "pointer", boxShadow: isSel ? "0 2px 12px rgba(59,130,246,0.35)" : "none" }}>{lang}</button>
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 5 — Aadhaar Verification */}
      {step === 5 && (
        <div style={{ padding: "20px 16px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Shield style={{ width: "32px", height: "32px", color: "#3B82F6" }} />
            </div>
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.text, fontSize: "20px", fontWeight: 700, margin: "0 0 6px" }}>Aadhaar Verification</h2>
            <p style={{ color: theme.sub, fontSize: "13px", margin: 0 }}>Required for identity verification as per UIDAI guidelines</p>
          </div>

          {/* Security notice */}
          <div style={{ padding: "14px 16px", backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <span style={{ fontSize: "16px", flexShrink: 0 }}>🔒</span>
            <div>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#3B82F6", margin: "0 0 3px" }}>Your data is encrypted & secure</p>
              <p style={{ fontSize: "11px", color: theme.sub, margin: 0, lineHeight: 1.5 }}>Aadhaar photos are stored securely and only used for manual identity verification by the Heyy team. We never store your full Aadhaar number.</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

            {/* Last 4 digits */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>Last 4 digits of Aadhaar *</label>
              <input type="tel" placeholder="XXXX" maxLength={4} value={aadhaarLast4} onChange={e => setAadhaarLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                style={{ width: "100%", padding: "14px 16px", backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", color: theme.text, fontSize: "18px", fontWeight: 700, letterSpacing: "8px", outline: "none", boxSizing: "border-box", textAlign: "center" }} />
              <p style={{ fontSize: "11px", color: theme.sub, marginTop: "6px" }}>We only store the last 4 digits — never the full number</p>
            </div>

            {/* Aadhaar Front */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>Aadhaar Card — Front Side *</label>
              <input ref={aadhaarFrontRef} type="file" accept="image/*" onChange={e => handleAadhaarPhoto("front", e)} style={{ display: "none" }} />
              {aadhaarFrontPreview ? (
                <div style={{ position: "relative" }}>
                  <img src={aadhaarFrontPreview} alt="Aadhaar Front" style={{ width: "100%", borderRadius: "12px", objectFit: "cover", maxHeight: "180px" }} />
                  <button onClick={() => { setAadhaarFront(null); setAadhaarFrontPreview(null) }} style={{ position: "absolute", top: "8px", right: "8px", backgroundColor: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X style={{ width: "14px", height: "14px" }} />
                  </button>
                </div>
              ) : (
                <button onClick={() => aadhaarFrontRef.current?.click()} style={{ width: "100%", padding: "24px", backgroundColor: theme.input, border: `2px dashed rgba(59,130,246,0.3)`, borderRadius: "12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <Camera style={{ width: "28px", height: "28px", color: "#3B82F6" }} />
                  <p style={{ fontSize: "13px", fontWeight: 500, color: theme.text, margin: 0 }}>Take photo or upload</p>
                  <p style={{ fontSize: "11px", color: theme.sub, margin: 0 }}>Front side with your name and photo</p>
                </button>
              )}
            </div>

            {/* Aadhaar Back */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>Aadhaar Card — Back Side *</label>
              <input ref={aadhaarBackRef} type="file" accept="image/*" onChange={e => handleAadhaarPhoto("back", e)} style={{ display: "none" }} />
              {aadhaarBackPreview ? (
                <div style={{ position: "relative" }}>
                  <img src={aadhaarBackPreview} alt="Aadhaar Back" style={{ width: "100%", borderRadius: "12px", objectFit: "cover", maxHeight: "180px" }} />
                  <button onClick={() => { setAadhaarBack(null); setAadhaarBackPreview(null) }} style={{ position: "absolute", top: "8px", right: "8px", backgroundColor: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X style={{ width: "14px", height: "14px" }} />
                  </button>
                </div>
              ) : (
                <button onClick={() => aadhaarBackRef.current?.click()} style={{ width: "100%", padding: "24px", backgroundColor: theme.input, border: `2px dashed rgba(59,130,246,0.3)`, borderRadius: "12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <Camera style={{ width: "28px", height: "28px", color: "#3B82F6" }} />
                  <p style={{ fontSize: "13px", fontWeight: 500, color: theme.text, margin: 0 }}>Take photo or upload</p>
                  <p style={{ fontSize: "11px", color: theme.sub, margin: 0 }}>Back side with address</p>
                </button>
              )}
            </div>

            {/* Consent */}
            <div style={{ padding: "16px", backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "12px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <button onClick={() => setAadhaarConsent(!aadhaarConsent)} style={{ width: "22px", height: "22px", borderRadius: "6px", backgroundColor: aadhaarConsent ? "#3B82F6" : "transparent", border: `2px solid ${aadhaarConsent ? "#3B82F6" : theme.inputBorder}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                  {aadhaarConsent && <CheckCircle2 style={{ width: "14px", height: "14px", color: "white" }} />}
                </button>
                <p style={{ fontSize: "12px", color: theme.sub, margin: 0, lineHeight: 1.6 }}>
                  I voluntarily consent to sharing my Aadhaar card photos for identity verification. I understand this is processed as per <span style={{ color: "#3B82F6" }}>UIDAI guidelines</span> and <span style={{ color: "#3B82F6" }}>DPDP Act 2023</span>. My data will not be shared with third parties.
                </p>
              </div>
            </div>

            {/* Legal footer */}
            <div style={{ padding: "12px 14px", backgroundColor: theme.input, borderRadius: "10px" }}>
              <p style={{ fontSize: "10px", color: theme.muted || theme.sub, margin: 0, lineHeight: 1.7 }}>
                📋 <strong>Legal Notice:</strong> Aadhaar verification is conducted as per Section 4 of the Aadhaar Act, 2016. Photos are stored encrypted and deleted after verification. By submitting, you confirm you are the Aadhaar cardholder. For queries: <span style={{ color: "#3B82F6" }}>support@heyy.in</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom button */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px", backgroundColor: theme.headerBg, borderTop: `1px solid ${theme.borderLight}` }}>
        <div style={{ maxWidth: "430px", margin: "0 auto" }}>
          <button onClick={handleNext} disabled={!isStepValid() || isSubmitting}
            style={{ width: "100%", padding: "16px", fontSize: "14px", fontWeight: 600, color: "white", backgroundColor: !isStepValid() || isSubmitting ? "rgba(59,130,246,0.4)" : "#3B82F6", border: "none", borderRadius: "12px", cursor: !isStepValid() || isSubmitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 16px rgba(59,130,246,0.3)" }}>
            {isSubmitting ? (
              <>{uploadingAadhaar ? "Uploading documents..." : "Submitting..."}<div style={{ width: "18px", height: "18px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></>
            ) : step === 5 ? "Submit Registration" : (<>Continue <ChevronRight style={{ width: "16px", height: "16px" }} /></>)}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
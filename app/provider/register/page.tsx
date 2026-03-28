
"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, Camera, MapPin, ChevronRight, CircleCheck as CheckCircle2, Image as ImageIcon, Navigation, Globe, Loader as Loader2, X, Plus } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { supabase } from "@/lib/supabase"
import { categories } from "@/lib/categories"

const radiusOptions = [5, 10, 20, 30, 50]

const pricingTypes: { id: string; label: string; emoji: string; unit: string; custom: boolean; placeholder?: string }[] = [
  { id: "hourly", label: "Per Hour", emoji: "\u23F0", unit: "hr", custom: false },
  { id: "daily", label: "Per Day", emoji: "\uD83D\uDCC5", unit: "day", custom: false },
  { id: "per_unit", label: "Per Unit", emoji: "\uD83C\uDF34", unit: "", custom: true, placeholder: "e.g. tree, snake, room" },
  { id: "per_work", label: "Per Work", emoji: "\uD83C\uDFA8", unit: "", custom: true, placeholder: "e.g. hand, event, dress" },
  { id: "per_kg", label: "Per Kg/Qty", emoji: "\uD83D\uDCE6", unit: "", custom: true, placeholder: "e.g. kg, packet, piece" },
  { id: "per_km", label: "Per Km/Trip", emoji: "\uD83D\uDE97", unit: "", custom: true, placeholder: "e.g. km, trip" },
  { id: "quote", label: "Get Quote", emoji: "\uD83D\uDCAC", unit: "", custom: false },
  { id: "package", label: "Package", emoji: "\uD83D\uDCCB", unit: "", custom: true, placeholder: "e.g. month, week" },
]

export default function ProviderRegistrationPage() {
  const router = useRouter()
  const { theme, isDark, mounted } = useTheme()
  const [step, setStep] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    phone: typeof window !== "undefined" ? localStorage.getItem("heyy_user_phone") || "" : "",
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
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [aadhaarLast4, setAadhaarLast4] = useState("")
  const [aadhaarFull, setAadhaarFull] = useState("")
  const [aadhaarFront, setAadhaarFront] = useState<string | null>(null)
  const [aadhaarBack, setAadhaarBack] = useState<string | null>(null)
  const [aadhaarConsent, setAadhaarConsent] = useState(false)
  const [uploadingAadhaar, setUploadingAadhaar] = useState(false)
  const aadhaarFrontRef = useRef<HTMLInputElement>(null)
  const aadhaarBackRef = useRef<HTMLInputElement>(null)

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsSubmitting(true)

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}_profile.${fileExt}`
      const filePath = `profiles/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("provider-photos")
        .upload(filePath, file, { cacheControl: "3600", upsert: false })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        alert("Failed to upload photo. Please try again.")
        setIsSubmitting(false)
        return
      }

      const { data } = supabase.storage
        .from("provider-photos")
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, profilePhoto: data.publicUrl }))

    } catch (err) {
      console.error("Upload error:", err)
      alert("Failed to upload photo.")
    }

    setIsSubmitting(false)
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
    if (!formData.category) {
      setServiceOptions([])
      return
    }
    let cancelled = false
    async function fetchServices() {
      setLoadingServices(true)
      const { data } = await supabase
        .from("services")
        .select("name")
        .eq("category", formData.category)
        .order("name")
      if (!cancelled) {
        setServiceOptions((data || []).map((s: { name: string }) => s.name))
        setLoadingServices(false)
      }
    }
    fetchServices()
    return () => { cancelled = true }
  }, [formData.category])

  const toggleService = (serviceName: string) => {
    if (serviceName === "Others") {
      setOthersActive((prev) => !prev)
      if (othersActive) setCustomServiceText("")
      return
    }
    setSelectedServices((prev) =>
      prev.includes(serviceName)
        ? prev.filter((s) => s !== serviceName)
        : [...prev, serviceName]
    )
  }

  const addCustomService = () => {
    const trimmed = customServiceText.trim()
    if (!trimmed) return
    if (!selectedServices.includes(trimmed)) {
      setSelectedServices((prev) => [...prev, trimmed])
    }
    setCustomServiceText("")
  }

  const removeService = (serviceName: string) => {
    setSelectedServices((prev) => prev.filter((s) => s !== serviceName))
  }

  const handleSelectNearby = () => {
    setLocationError(null)
    setFormData(prev => ({
      ...prev,
      serviceAreaType: "nearby",
      servesAllKerala: false,
    }))
    detectLocation()
  }

  const handleSelectAllKerala = () => {
    setLocationError(null)
    setFormData(prev => ({
      ...prev,
      serviceAreaType: "all_kerala",
      servesAllKerala: true,
      radiusKm: 500,
      latitude: 10.8505,
      longitude: 76.2711,
    }))
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }))
        setIsLocating(false)
        setLocationError(null)
      },
      (error) => {
        setIsLocating(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Please allow location access to use this feature")
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable")
            break
          case error.TIMEOUT:
            setLocationError("Location request timed out")
            break
          default:
            setLocationError("An unknown error occurred")
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const toggleLanguage = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }))
  }

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      router.back()
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const insertData = {
        full_name: formData.fullName,
        phone: formData.phone,
        user_id: localStorage.getItem("heyy_user_id") || null,
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
        aadhaar_last4: aadhaarFull.slice(-4) || null,
        aadhaar_front_url: aadhaarFront || null,
        aadhaar_back_url: aadhaarBack || null,
        aadhaar_consent: aadhaarConsent,
        aadhaar_submitted_at: new Date().toISOString(),
        profile_photo: formData.profilePhoto || null,
      }

      const { data, error } = await supabase.from("providers").insert(insertData).select()

      if (error) {
        console.error("Supabase error:", error)
        alert(`Registration failed: ${error.message}`)
        setIsSubmitting(false)
        return
      }

      setIsSubmitting(false)
      setShowSuccess(true)
    } catch (error: any) {
      console.error("Error submitting registration:", error)
      alert(`Registration failed: ${error?.message || "Unknown error"}`)
      setIsSubmitting(false)
    }
  }

  const handleAadhaarPhoto = async (e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAadhaar(true)

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}_${side}.${fileExt}`
      const filePath = `aadhaar/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("aadhaar-docs")
        .upload(filePath, file, { cacheControl: "3600", upsert: false })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        alert("Failed to upload photo. Please try again.")
        setUploadingAadhaar(false)
        return
      }

      const { data } = supabase.storage
        .from("aadhaar-docs")
        .getPublicUrl(filePath)

      const url = data.publicUrl

      if (side === "front") setAadhaarFront(url)
      else setAadhaarBack(url)

    } catch (err) {
      console.error("Upload error:", err)
      alert("Failed to upload photo.")
    }

    setUploadingAadhaar(false)
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.fullName && formData.phone
      case 2:
        return formData.category !== "" && selectedServices.length > 0
      case 3:
        return formData.experience && (formData.priceType === "quote" || (formData.priceType && formData.hourlyRate))
      case 4:
        if (formData.serviceAreaType === "all_kerala") return true
        if (formData.serviceAreaType === "nearby" && formData.latitude && formData.longitude) return true
        return false
      case 5:
        return aadhaarConsent && aadhaarFull.length === 12 && aadhaarFront !== null
      default:
        return false
    }
  }

  if (!mounted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#080F1E" }}
      >
        <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (showSuccess) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{
          backgroundColor: "#080F1E",
          fontFamily: "var(--font-dm-sans), sans-serif",
          maxWidth: "430px",
          margin: "0 auto",
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
            style={{
              backgroundColor: "rgba(34, 197, 94, 0.15)",
              boxShadow: "0 0 60px rgba(34, 197, 94, 0.3)",
            }}
          >
            <CheckCircle2 className="w-14 h-14" style={{ color: "#22C55E" }} />
          </div>

          <h1
            className="text-2xl font-bold mb-3"
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              color: "#FFFFFF",
            }}
          >
            Registration Successful!
          </h1>

          <p
            className="text-[16px] mb-2"
            style={{ color: "rgba(255, 255, 255, 0.9)" }}
          >
            Thank you for joining Rural!
          </p>

          <p
            className="text-[14px] mb-2"
            style={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            We will verify your profile within 24 hours
          </p>

          <p
            className="text-[14px] mb-10"
            style={{ color: "rgba(255, 255, 255, 0.6)" }}
          >
            You will receive SMS once approved
          </p>

          <button
            onClick={() => router.push("/home")}
            className="w-full py-4 text-[15px] font-semibold text-white transition-all hover:opacity-90"
            style={{
              backgroundColor: "#22C55E",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(34, 197, 94, 0.4)",
            }}
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen pb-32"
      style={{
        backgroundColor: theme.bg,
        fontFamily: "var(--font-dm-sans), sans-serif",
        maxWidth: "430px",
        margin: "0 auto",
      }}
    >
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          backgroundColor: theme.headerBg,
          borderBottom: `1px solid ${theme.borderLight}`,
        }}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 transition-colors"
            style={{ color: theme.text, borderRadius: "12px" }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1
            className="text-lg font-bold"
            style={{
              fontFamily: "var(--font-syne), sans-serif",
              color: theme.text,
            }}
          >
            Become a Provider
          </h1>
          <div className="w-9" />
        </div>

        <div className="px-4 pb-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className="flex-1 h-1 rounded-full transition-colors"
                style={{
                  backgroundColor: s <= step ? "#3B82F6" : theme.input,
                }}
              />
            ))}
          </div>
          <p className="text-[11px] mt-2 text-center" style={{ color: theme.sub }}>
            Step {step} of 5
          </p>
        </div>
      </header>

      {step === 1 && (
        <div className="px-4 py-5 space-y-5">
          <div className="text-center pb-5">
            <h2
              className="text-xl font-bold mb-2"
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                color: theme.text,
              }}
            >
              Personal Details
            </h2>
            <p className="text-[13px]" style={{ color: theme.sub }}>
              Let's start with your basic information
            </p>
          </div>

          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: "#080F1E",
                  border: formData.profilePhoto ? "3px solid #3B82F6" : "2px dashed rgba(59,130,246,0.4)",
                }}
              >
                {formData.profilePhoto ? (
                  <img
                    src={formData.profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-8 h-8" style={{ color: "rgba(255,255,255,0.4)" }} />
                )}
              </div>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoCapture}
              className="hidden"
            />

            <div className="flex gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{
                  backgroundColor: "#080F1E",
                  border: "1px solid #3B82F6",
                }}
              >
                <Camera className="w-4 h-4 text-[#3B82F6]" />
                <span className="text-[13px] font-medium text-white">Take Photo</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{
                  backgroundColor: "#3B82F6",
                }}
              >
                <ImageIcon className="w-4 h-4 text-white" />
                <span className="text-[13px] font-medium text-white">Upload from Gallery</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-medium block mb-2" style={{ color: theme.sub }}>
                Full Name *
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => updateFormData("fullName", e.target.value)}
                className="w-full p-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
                style={{
                  backgroundColor: theme.input,
                  color: theme.text,
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: "12px",
                }}
              />
            </div>

            <div>
              <label className="text-[12px] font-medium block mb-2" style={{ color: theme.sub }}>
                Phone Number *
              </label>
              <div className="flex gap-2">
                <div
                  className="px-4 py-4 text-[14px] flex items-center"
                  style={{
                    backgroundColor: theme.input,
                    color: theme.text,
                    border: `1px solid ${theme.inputBorder}`,
                    borderRadius: "12px",
                  }}
                >
                  +91
                </div>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  className="flex-1 p-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
                  style={{
                    backgroundColor: theme.input,
                    color: theme.text,
                    border: `1px solid ${theme.inputBorder}`,
                    borderRadius: "12px",
                  }}
                />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-medium block mb-2" style={{ color: theme.sub }}>
                Email (Optional)
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                className="w-full p-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
                style={{
                  backgroundColor: theme.input,
                  color: theme.text,
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: "12px",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="px-4 py-5 space-y-5">
          <div className="text-center pb-3">
            <h2
              className="text-xl font-bold mb-2"
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                color: theme.text,
              }}
            >
              Service Category
            </h2>
            <p className="text-[13px]" style={{ color: theme.sub }}>
              What type of service do you offer?
            </p>
          </div>

          <div>
            <label className="text-[12px] font-medium block mb-3" style={{ color: theme.sub }}>
              Select Category *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => {
                const isSelected = formData.category === cat.name
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.name)}
                    className="p-4 text-left transition-all"
                    style={{
                      backgroundColor: theme.card,
                      border: `1px solid ${isSelected ? "#3B82F6" : theme.cardBorder}`,
                      boxShadow: isSelected ? "0 0 0 1px #3B82F6" : "none",
                      borderRadius: "16px",
                    }}
                  >
                    <span className="text-2xl mb-2 block">{cat.emoji}</span>
                    <p className="text-[13px] font-medium" style={{ color: theme.text }}>
                      {cat.name}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {formData.category && (
            <div>
              <label className="text-[12px] font-medium block mb-3" style={{ color: theme.sub }}>
                Service Type * <span style={{ fontWeight: 400 }}>(select one or more)</span>
              </label>

              {selectedServices.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedServices.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium"
                      style={{
                        backgroundColor: "#3B82F6",
                        color: "#fff",
                      }}
                    >
                      {name}
                      <button
                        onClick={() => removeService(name)}
                        className="flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                        style={{ width: "16px", height: "16px" }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {loadingServices ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#3B82F6" }} />
                </div>
              ) : (
                <div
                  className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-1"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: `${theme.inputBorder} transparent`,
                  }}
                >
                  {serviceOptions.filter((n) => n !== "Others").map((name) => {
                    const isSelected = selectedServices.includes(name)
                    return (
                      <button
                        key={name}
                        onClick={() => toggleService(name)}
                        className="px-4 py-2.5 rounded-full text-[13px] font-medium transition-all"
                        style={{
                          backgroundColor: isSelected ? "#3B82F6" : "rgba(59,130,246,0.08)",
                          color: isSelected ? "#fff" : theme.text,
                          border: `1px solid ${isSelected ? "#3B82F6" : theme.inputBorder}`,
                          boxShadow: isSelected ? "0 2px 12px rgba(59,130,246,0.35)" : "none",
                        }}
                      >
                        {name}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => toggleService("Others")}
                    className="px-4 py-2.5 rounded-full text-[13px] font-medium transition-all"
                    style={{
                      backgroundColor: othersActive ? "#3B82F6" : "rgba(59,130,246,0.08)",
                      color: othersActive ? "#fff" : theme.text,
                      border: `1px solid ${othersActive ? "#3B82F6" : theme.inputBorder}`,
                      boxShadow: othersActive ? "0 2px 12px rgba(59,130,246,0.35)" : "none",
                    }}
                  >
                    Others
                  </button>
                </div>
              )}

              {othersActive && (
                <div className="mt-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., Coconut tree climber, Snake catcher..."
                      value={customServiceText}
                      onChange={(e) => setCustomServiceText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomService() } }}
                      className="flex-1 p-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
                      style={{
                        backgroundColor: theme.input,
                        color: theme.text,
                        border: `1px solid ${theme.inputBorder}`,
                        borderRadius: "12px",
                      }}
                    />
                    <button
                      onClick={addCustomService}
                      disabled={!customServiceText.trim()}
                      className="flex items-center justify-center transition-all disabled:opacity-40"
                      style={{
                        width: "52px",
                        backgroundColor: "#3B82F6",
                        borderRadius: "12px",
                        flexShrink: 0,
                      }}
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <p className="text-[11px] mt-1.5 ml-1" style={{ color: theme.sub }}>
                    Describe your service and tap + to add
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="px-4 py-5 space-y-5">
          <div className="text-center pb-3">
            <h2
              className="text-xl font-bold mb-2"
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                color: theme.text,
              }}
            >
              Experience & Pricing
            </h2>
            <p className="text-[13px]" style={{ color: theme.sub }}>
              Tell us about your experience and rates
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[12px] font-medium block mb-2" style={{ color: theme.sub }}>
                Years of Experience *
              </label>
              <input
                type="number"
                placeholder="e.g., 5"
                value={formData.experience}
                onChange={(e) => updateFormData("experience", e.target.value)}
                className="w-full p-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
                style={{
                  backgroundColor: theme.input,
                  color: theme.text,
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: "12px",
                }}
              />
            </div>

            <div>
              <label className="text-[12px] font-medium block mb-3" style={{ color: theme.sub }}>
                Pricing Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {pricingTypes.map((pt) => {
                  const isSelected = formData.priceType === pt.id
                  return (
                    <button
                      key={pt.id}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          priceType: pt.id,
                          priceUnit: pt.unit,
                          hourlyRate: pt.id === "quote" ? "" : prev.hourlyRate,
                        }))
                      }}
                      className="p-4 text-left transition-all"
                      style={{
                        backgroundColor: theme.card,
                        border: `1px solid ${isSelected ? "#3B82F6" : theme.cardBorder}`,
                        boxShadow: isSelected ? "0 0 0 1px #3B82F6, 0 4px 16px rgba(59,130,246,0.15)" : "none",
                        borderRadius: "16px",
                      }}
                    >
                      <span className="text-xl mb-1.5 block">{pt.emoji}</span>
                      <p className="text-[13px] font-medium" style={{ color: theme.text }}>
                        {pt.label}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {formData.priceType && formData.priceType !== "quote" && (
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] font-medium block mb-2" style={{ color: theme.sub }}>
                    {`Your Rate (\u20B9) *`}
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 500"
                    value={formData.hourlyRate}
                    onChange={(e) => updateFormData("hourlyRate", e.target.value)}
                    className="w-full p-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
                    style={{
                      backgroundColor: theme.input,
                      color: theme.text,
                      border: `1px solid ${theme.inputBorder}`,
                      borderRadius: "12px",
                    }}
                  />
                </div>

                {pricingTypes.find(p => p.id === formData.priceType)?.custom && (
                  <div>
                    <label className="text-[12px] font-medium block mb-2" style={{ color: theme.sub }}>
                      Unit Label
                    </label>
                    <input
                      type="text"
                      placeholder={pricingTypes.find(p => p.id === formData.priceType)?.placeholder || ""}
                      value={formData.priceUnit}
                      onChange={(e) => updateFormData("priceUnit", e.target.value)}
                      className="w-full p-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
                      style={{
                        backgroundColor: theme.input,
                        color: theme.text,
                        border: `1px solid ${theme.inputBorder}`,
                        borderRadius: "12px",
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {formData.priceType === "quote" && (
              <div
                className="p-4 flex items-center gap-3"
                style={{
                  backgroundColor: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(59,130,246,0.2)",
                  borderRadius: "12px",
                }}
              >
                <span className="text-xl">{"\uD83D\uDCAC"}</span>
                <p className="text-[13px]" style={{ color: theme.sub }}>
                  Customers will contact you for a quote
                </p>
              </div>
            )}

            <div>
              <label className="text-[12px] font-medium block mb-2" style={{ color: theme.sub }}>
                About You
              </label>
              <textarea
                placeholder="Tell customers about yourself and your services..."
                value={formData.about}
                onChange={(e) => updateFormData("about", e.target.value)}
                className="w-full p-4 text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
                style={{
                  backgroundColor: theme.input,
                  color: theme.text,
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: "12px",
                  minHeight: "100px",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="px-4 py-5 space-y-5">
          <div className="text-center pb-3">
            <h2
              className="text-xl font-bold mb-2"
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                color: theme.text,
              }}
            >
              Service Area
            </h2>
            <p className="text-[13px]" style={{ color: theme.sub }}>
              Where do you provide your services?
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSelectNearby}
              className="w-full p-5 text-left transition-all"
              style={{
                backgroundColor: formData.serviceAreaType === "nearby" ? "#3B82F6" : "#080F1E",
                border: formData.serviceAreaType === "nearby" ? "2px solid #3B82F6" : "1px solid rgba(59,130,246,0.3)",
                borderRadius: "16px",
                boxShadow: formData.serviceAreaType === "nearby" ? "0 4px 20px rgba(59,130,246,0.4)" : "none",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: formData.serviceAreaType === "nearby" ? "rgba(255,255,255,0.2)" : "rgba(59,130,246,0.15)",
                  }}
                >
                  {isLocating && formData.serviceAreaType === "nearby" ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Navigation className="w-6 h-6" style={{ color: formData.serviceAreaType === "nearby" ? "#fff" : "#3B82F6" }} />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className="text-[15px] font-semibold mb-1"
                    style={{
                      fontFamily: "var(--font-syne), sans-serif",
                      color: formData.serviceAreaType === "nearby" ? "#fff" : theme.text,
                    }}
                  >
                    My Nearby Area
                  </p>
                  <p
                    className="text-[12px]"
                    style={{ color: formData.serviceAreaType === "nearby" ? "rgba(255,255,255,0.8)" : theme.sub }}
                  >
                    Auto-detect your location and serve customers within your selected radius
                  </p>
                </div>
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1"
                  style={{
                    borderColor: formData.serviceAreaType === "nearby" ? "#fff" : "rgba(59,130,246,0.4)",
                    backgroundColor: formData.serviceAreaType === "nearby" ? "#fff" : "transparent",
                  }}
                >
                  {formData.serviceAreaType === "nearby" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                  )}
                </div>
              </div>
            </button>

            {formData.serviceAreaType === "nearby" && (
              <div
                className="p-4 space-y-4"
                style={{
                  backgroundColor: "#080F1E",
                  border: "1px solid rgba(59,130,246,0.2)",
                  borderRadius: "12px",
                  marginLeft: "16px",
                }}
              >
                {locationError && (
                  <div
                    className="p-3 rounded-lg text-[12px]"
                    style={{
                      backgroundColor: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      color: "#EF4444",
                    }}
                  >
                    {locationError}
                    <button
                      onClick={detectLocation}
                      className="ml-2 underline"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {formData.latitude && formData.longitude && (
                  <div className="flex items-center gap-2 text-[12px]" style={{ color: "#10B981" }}>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Location detected successfully</span>
                  </div>
                )}

                <div>
                  <label className="text-[12px] font-medium block mb-3" style={{ color: theme.sub }}>
                    Service Radius
                  </label>
                  <div className="flex gap-2">
                    {radiusOptions.map((radius) => {
                      const isSelected = formData.radiusKm === radius
                      return (
                        <button
                          key={radius}
                          onClick={() => updateFormData("radiusKm", radius)}
                          className="flex-1 py-3 rounded-lg text-[13px] font-medium transition-all"
                          style={{
                            backgroundColor: isSelected ? "#3B82F6" : "rgba(59,130,246,0.1)",
                            color: isSelected ? "#fff" : theme.sub,
                            border: isSelected ? "none" : "1px solid rgba(59,130,246,0.2)",
                          }}
                        >
                          {radius}km
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[11px] mt-2 text-center" style={{ color: theme.sub }}>
                    Serve customers within {formData.radiusKm}km of your location
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleSelectAllKerala}
              className="w-full p-5 text-left transition-all"
              style={{
                backgroundColor: formData.serviceAreaType === "all_kerala" ? "#3B82F6" : "#080F1E",
                border: formData.serviceAreaType === "all_kerala" ? "2px solid #3B82F6" : "1px solid rgba(59,130,246,0.3)",
                borderRadius: "16px",
                boxShadow: formData.serviceAreaType === "all_kerala" ? "0 4px 20px rgba(59,130,246,0.4)" : "none",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: formData.serviceAreaType === "all_kerala" ? "rgba(255,255,255,0.2)" : "rgba(59,130,246,0.15)",
                  }}
                >
                  <Globe className="w-6 h-6" style={{ color: formData.serviceAreaType === "all_kerala" ? "#fff" : "#3B82F6" }} />
                </div>
                <div className="flex-1">
                  <p
                    className="text-[15px] font-semibold mb-1"
                    style={{
                      fontFamily: "var(--font-syne), sans-serif",
                      color: formData.serviceAreaType === "all_kerala" ? "#fff" : theme.text,
                    }}
                  >
                    Anywhere in Kerala
                  </p>
                  <p
                    className="text-[12px]"
                    style={{ color: formData.serviceAreaType === "all_kerala" ? "rgba(255,255,255,0.8)" : theme.sub }}
                  >
                    I can travel anywhere in Kerala to provide my services
                  </p>
                </div>
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1"
                  style={{
                    borderColor: formData.serviceAreaType === "all_kerala" ? "#fff" : "rgba(59,130,246,0.4)",
                    backgroundColor: formData.serviceAreaType === "all_kerala" ? "#fff" : "transparent",
                  }}
                >
                  {formData.serviceAreaType === "all_kerala" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                  )}
                </div>
              </div>
            </button>
          </div>

          <div>
            <label className="text-[12px] font-medium block mb-3" style={{ color: theme.sub }}>
              Languages Spoken
            </label>
            <div className="flex flex-wrap gap-2">
              {["Malayalam", "English", "Hindi", "Tamil", "Kannada"].map((lang) => {
                const isSelected = formData.languages.includes(lang)
                return (
                  <button
                    key={lang}
                    onClick={() => toggleLanguage(lang)}
                    className="px-4 py-2.5 rounded-full text-[13px] font-medium transition-all"
                    style={{
                      backgroundColor: isSelected ? "#3B82F6" : "rgba(59,130,246,0.1)",
                      color: isSelected ? "#fff" : theme.sub,
                      border: isSelected ? "none" : "1px solid rgba(59,130,246,0.2)",
                      boxShadow: isSelected ? "0 2px 12px rgba(59,130,246,0.35)" : "none",
                    }}
                  >
                    {lang}
                  </button>
                )
              })}
            </div>
          </div>

          <div
            className="p-4"
            style={{
              backgroundColor: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: "16px",
            }}
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#3B82F6] mt-0.5" />
              <div>
                <p className="text-[13px] font-medium" style={{ color: theme.text }}>
                  Verification Required
                </p>
                <p className="text-[11px]" style={{ color: theme.sub }}>
                  Your profile will be reviewed within 24-48 hours. You'll receive an SMS once approved.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div style={{ padding: "20px 16px" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "rgba(59,130,246,0.1)", border: "2px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "32px" }}>🪪</div>
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif", color: theme.text, fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>Aadhaar Verification</h2>
            <p style={{ color: theme.sub, fontSize: "13px", margin: 0, lineHeight: 1.6 }}>Required to verify your identity as a trusted service provider</p>
          </div>

          {uploadingAadhaar && (
            <div style={{ padding: "12px 16px", backgroundColor: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "16px", height: "16px", border: "2px solid #3B82F6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
              <p style={{ fontSize: "13px", color: theme.accent, margin: 0, fontWeight: 500 }}>Uploading photo securely...</p>
            </div>
          )}

          {/* Warning notice */}
          <div style={{ padding: "14px 16px", backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "14px", marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <span style={{ fontSize: "18px", flexShrink: 0 }}>⚠️</span>
            <p style={{ fontSize: "12px", color: theme.sub, margin: 0, lineHeight: 1.7 }}>
              Your Aadhaar details are collected only for identity verification. Only the <strong style={{ color: theme.text }}>last 4 digits</strong> are stored. Photos are kept in a private encrypted storage. Our team will verify within <strong style={{ color: theme.text }}>24-48 hours</strong>.
            </p>
          </div>

          {/* Aadhaar number input */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>
              Aadhaar Number * <span style={{ fontWeight: 400, color: theme.muted }}>(only last 4 digits will be stored)</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="XXXX  XXXX  XXXX"
              value={aadhaarFull.replace(/(\d{4})(?=\d)/g, "$1  ")}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 12)
                setAadhaarFull(v)
                setAadhaarLast4(v.slice(-4))
              }}
              style={{
                width: "100%", padding: "16px", fontSize: "20px",
                letterSpacing: "4px", fontWeight: 700, textAlign: "center",
                backgroundColor: theme.input, color: theme.text,
                border: `2px solid ${aadhaarFull.length === 12 ? theme.accent : theme.inputBorder}`,
                borderRadius: "12px", outline: "none", boxSizing: "border-box",
                fontFamily: "var(--font-syne), sans-serif",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
              {aadhaarFull.length > 0 && aadhaarFull.length < 12 && (
                <p style={{ fontSize: "11px", color: theme.error, margin: 0 }}>
                  {12 - aadhaarFull.length} more digits needed
                </p>
              )}
              {aadhaarFull.length === 12 && (
                <p style={{ fontSize: "11px", color: theme.success, margin: 0 }}>✓ Aadhaar number complete</p>
              )}
              {aadhaarFull.length === 12 && (
                <p style={{ fontSize: "11px", color: theme.muted, margin: 0 }}>
                  Storing: XXXX XXXX {aadhaarFull.slice(-4)}
                </p>
              )}
            </div>
          </div>

          {/* Aadhaar front upload */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>
              Aadhaar Card — Front Side *
              <span style={{ fontWeight: 400, color: theme.muted }}> (side with photo & name)</span>
            </label>
            <input ref={aadhaarFrontRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => handleAadhaarPhoto(e, "front")} />
            {aadhaarFront ? (
              <div style={{ position: "relative", borderRadius: "14px", overflow: "hidden", border: `2px solid ${theme.accent}` }}>
                <img src={aadhaarFront} alt="Aadhaar Front" style={{ width: "100%", height: "180px", objectFit: "cover" }} />
                <button onClick={() => setAadhaarFront(null)} style={{ position: "absolute", top: "10px", right: "10px", width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "rgba(239,68,68,0.9)", border: "none", color: "white", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✕</button>
                <div style={{ position: "absolute", bottom: "10px", left: "10px", backgroundColor: "rgba(34,197,94,0.92)", borderRadius: "8px", padding: "5px 12px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "white", margin: 0 }}>✓ Front side uploaded</p>
                </div>
              </div>
            ) : (
              <button onClick={() => aadhaarFrontRef.current?.click()} disabled={uploadingAadhaar} style={{ width: "100%", height: "130px", backgroundColor: theme.input, border: `2px dashed rgba(59,130,246,0.4)`, borderRadius: "14px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", transition: "all 0.2s" }}>
                <span style={{ fontSize: "32px" }}>📷</span>
                <p style={{ fontSize: "13px", fontWeight: 600, color: theme.sub, margin: 0 }}>Upload front side</p>
                <p style={{ fontSize: "11px", color: theme.muted, margin: 0 }}>Tap to take photo or choose from gallery</p>
              </button>
            )}
          </div>

          {/* Aadhaar back upload */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: theme.sub, display: "block", marginBottom: "8px" }}>
              Aadhaar Card — Back Side
              <span style={{ fontWeight: 400, color: theme.muted }}> (optional but recommended)</span>
            </label>
            <input ref={aadhaarBackRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => handleAadhaarPhoto(e, "back")} />
            {aadhaarBack ? (
              <div style={{ position: "relative", borderRadius: "14px", overflow: "hidden", border: `2px solid ${theme.accent}` }}>
                <img src={aadhaarBack} alt="Aadhaar Back" style={{ width: "100%", height: "180px", objectFit: "cover" }} />
                <button onClick={() => setAadhaarBack(null)} style={{ position: "absolute", top: "10px", right: "10px", width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "rgba(239,68,68,0.9)", border: "none", color: "white", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>✕</button>
                <div style={{ position: "absolute", bottom: "10px", left: "10px", backgroundColor: "rgba(34,197,94,0.92)", borderRadius: "8px", padding: "5px 12px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "white", margin: 0 }}>✓ Back side uploaded</p>
                </div>
              </div>
            ) : (
              <button onClick={() => aadhaarBackRef.current?.click()} disabled={uploadingAadhaar} style={{ width: "100%", height: "130px", backgroundColor: theme.input, border: `2px dashed rgba(59,130,246,0.2)`, borderRadius: "14px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                <span style={{ fontSize: "32px" }}>📄</span>
                <p style={{ fontSize: "13px", fontWeight: 600, color: theme.sub, margin: 0 }}>Upload back side</p>
                <p style={{ fontSize: "11px", color: theme.muted, margin: 0 }}>Optional — helps faster verification</p>
              </button>
            )}
          </div>

          {/* Security info */}
          <div style={{ padding: "14px 16px", backgroundColor: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "14px", marginBottom: "20px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: theme.accent, margin: "0 0 10px" }}>🔒 How we protect your Aadhaar data</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                "Only last 4 digits of Aadhaar stored — never full number",
                "Photos stored in private encrypted storage",
                "Data never shared with third parties",
                "Compliant with Aadhaar Act 2016 & DPDP Act 2023",
                "You can request data deletion anytime",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: theme.accent, flexShrink: 0, marginTop: "5px" }} />
                  <p style={{ fontSize: "12px", color: theme.sub, margin: 0, lineHeight: 1.5 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Consent checkbox */}
          <div
            onClick={() => setAadhaarConsent(!aadhaarConsent)}
            style={{ padding: "16px", backgroundColor: aadhaarConsent ? "rgba(59,130,246,0.08)" : theme.card, border: `2px solid ${aadhaarConsent ? theme.accent : theme.cardBorder}`, borderRadius: "14px", cursor: "pointer", transition: "all 0.2s", marginBottom: "16px" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "8px", border: `2px solid ${aadhaarConsent ? theme.accent : theme.inputBorder}`, backgroundColor: aadhaarConsent ? theme.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px", transition: "all 0.2s" }}>
                {aadhaarConsent && <span style={{ color: "white", fontSize: "14px", fontWeight: 900 }}>✓</span>}
              </div>
              <p style={{ fontSize: "12px", color: theme.sub, margin: 0, lineHeight: 1.7 }}>
                I hereby give my <strong style={{ color: theme.text }}>voluntary consent</strong> to Heyy to collect and securely store my Aadhaar details solely for identity verification as a service provider. I confirm the details are genuine and belong to me. I have read and agree to the <strong style={{ color: theme.accent }}>Privacy Policy</strong> regarding Aadhaar data handling.
              </p>
            </div>
          </div>

          {/* Legal footer */}
          <p style={{ fontSize: "11px", color: theme.muted, textAlign: "center", lineHeight: 1.7, margin: 0 }}>
            As per UIDAI guidelines, your explicit consent is mandatory before collecting Aadhaar information. Protected under the Digital Personal Data Protection Act, 2023.
          </p>

        </div>
      )}

      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-4 backdrop-blur-xl"
        style={{
          backgroundColor: theme.headerBg,
          borderTop: `1px solid ${theme.borderLight}`,
        }}
      >
        <div style={{ maxWidth: "430px", margin: "0 auto" }}>
          <button
            onClick={handleNext}
            disabled={!isStepValid() || isSubmitting}
            className="w-full py-4 text-[14px] font-semibold text-white bg-[#3B82F6] shadow-[0_4px_16px_rgba(59,130,246,0.3)] hover:bg-[#2563EB] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: "12px" }}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : step === 5 ? (
              "Submit Registration"
            ) : (
              <>
                Continue
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

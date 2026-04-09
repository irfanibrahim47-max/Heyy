"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Star } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { supabase } from "@/lib/supabase"

const QUICK_TAGS = [
  "Professional", "Punctual", "Friendly",
  "Skilled", "Clean", "Affordable",
  "Polite", "Efficient"
]

const ASPECT_RATINGS = [
  { id: "quality_rating", label: "Service Quality" },
  { id: "punctuality_rating", label: "Punctuality" },
  { id: "communication_rating", label: "Communication" },
  { id: "value_rating", label: "Value for Money" },
]

function ReviewContent() {
  const router = useRouter()
  const params = useParams()
  const providerId = params.providerId as string
  const { theme, mounted } = useTheme()

  const [provider, setProvider] = useState<any>(null)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [aspectRatings, setAspectRatings] = useState<Record<string, number>>({})
  const [hoveredAspect, setHoveredAspect] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // ✅ Fetch provider (name + photo + category)
  useEffect(() => {
    async function fetchProvider() {
      if (!providerId) return
      const { data } = await supabase
        .from("providers")
        .select("full_name, profile_photo, category, service_type")
        .eq("id", providerId)
        .single()
      if (data) setProvider(data)
    }
    fetchProvider()
  }, [providerId])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const setAspectRating = (aspectId: string, value: number) => {
    setAspectRatings(prev => ({ ...prev, [aspectId]: value }))
  }

  const getRatingLabel = () => {
    switch (rating) {
      case 1: return { text: "Poor", color: "#EF4444" }
      case 2: return { text: "Fair", color: "#F97316" }
      case 3: return { text: "Good", color: "#F59E0B" }
      case 4: return { text: "Very Good", color: "#84CC16" }
      case 5: return { text: "Excellent!", color: "#22C55E" }
      default: return { text: "Tap to rate", color: theme.sub }
    }
  }

  const handleSubmit = async () => {
    if (rating === 0) return
    setIsSubmitting(true)

    try {
      // ✅ Real customer info from localStorage
      const customerId = localStorage.getItem("heyy_user_id")
      const customerName = localStorage.getItem("heyy_user_name") || "Customer"

      // Step 1 — save review with all fields
      const { error: reviewError } = await supabase
        .from("reviews")
        .insert({
          provider_id: providerId,
          customer_id: customerId,
          reviewer_name: customerName,
          rating: rating,
          comment: comment.trim() || null,
          tags: selectedTags.length > 0 ? selectedTags : null,
          quality_rating: aspectRatings["quality_rating"] || null,
          punctuality_rating: aspectRatings["punctuality_rating"] || null,
          communication_rating: aspectRatings["communication_rating"] || null,
          value_rating: aspectRatings["value_rating"] || null,
          created_at: new Date().toISOString(),
        })

      if (reviewError) {
        alert("Failed to submit review: " + reviewError.message)
        setIsSubmitting(false)
        return
      }

      // Step 2 — recalculate provider average rating
      const { data: allReviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("provider_id", providerId)

      if (allReviews && allReviews.length > 0) {
        const totalReviews = allReviews.length
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        await supabase
          .from("providers")
          .update({
            rating: Math.round(avgRating * 10) / 10,
            total_reviews: totalReviews,
          })
          .eq("id", providerId)
      }

      setSubmitted(true)
    } catch (err) {
      console.error(err)
      alert("Something went wrong. Please try again.")
    }

    setIsSubmitting(false)
  }

  if (!mounted) return <div style={{ minHeight: "100vh", backgroundColor: "#080F1E" }} />

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ maxWidth: "430px", margin: "0 auto", minHeight: "100vh", backgroundColor: theme.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px", fontFamily: "var(--font-dm-sans), sans-serif" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", boxShadow: "0 0 40px rgba(34,197,94,0.3)" }}>
          <span style={{ fontSize: "40px" }}>⭐</span>
        </div>
        <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "24px", fontWeight: 700, color: theme.text, margin: "0 0 8px", textAlign: "center" }}>
          Thank you!
        </h2>
        <p style={{ color: theme.sub, fontSize: "14px", textAlign: "center", margin: "0 0 8px", lineHeight: 1.6 }}>
          Your review has been submitted successfully.
        </p>
        <p style={{ color: theme.sub, fontSize: "13px", textAlign: "center", margin: "0 0 32px" }}>
          The provider's rating has been updated.
        </p>
        <div style={{ display: "flex", gap: "12px", width: "100%" }}>
          <button
            onClick={() => router.push(`/provider/${providerId}`)}
            style={{ flex: 1, padding: "14px", fontSize: "14px", fontWeight: 500, color: theme.text, backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "12px", cursor: "pointer" }}
          >
            View Profile
          </button>
          <button
            onClick={() => router.push("/home")}
            style={{ flex: 1, padding: "14px", fontSize: "14px", fontWeight: 600, color: "white", backgroundColor: "#3B82F6", border: "none", borderRadius: "12px", cursor: "pointer", boxShadow: "0 4px 20px rgba(59,130,246,0.4)" }}
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const ratingLabel = getRatingLabel()

  return (
    <div style={{ maxWidth: "430px", margin: "0 auto", minHeight: "100vh", backgroundColor: theme.bg, fontFamily: "var(--font-dm-sans), sans-serif", paddingBottom: "40px" }}>

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: theme.headerBg, borderBottom: `1px solid ${theme.borderLight}`, padding: "16px", display: "flex", alignItems: "center", gap: "12px", backdropFilter: "blur(20px)" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", color: theme.text, padding: "4px" }}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "18px", fontWeight: 700, color: theme.text, margin: 0 }}>
          Rate Provider
        </h1>
      </header>

      <div style={{ padding: "24px 16px 0" }}>

        {/* ✅ Provider Card with Photo */}
        {provider && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "20px 16px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "16px", marginBottom: "28px" }}>

            {/* Photo or Initial */}
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", marginBottom: "12px", background: "linear-gradient(135deg, #3B82F6, #2563EB)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {provider.profile_photo ? (
                <img
                  src={provider.profile_photo}
                  alt={provider.full_name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: "32px", color: "white", fontWeight: 700 }}>
                  {provider.full_name?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>

            <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "16px", fontWeight: 700, color: theme.text, margin: "0 0 4px" }}>
              {provider.full_name}
            </h3>
            <p style={{ fontSize: "13px", color: theme.sub, margin: 0 }}>
              {provider.service_type || provider.category}
            </p>
          </div>
        )}

        {/* ── Overall Star Rating ── */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <p style={{ color: theme.sub, fontSize: "14px", margin: "0 0 20px" }}>
            How would you rate this service?
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "12px" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
              >
                <Star
                  size={48}
                  style={{
                    fill: star <= (hoveredRating || rating) ? "#F59E0B" : "transparent",
                    stroke: star <= (hoveredRating || rating) ? "#F59E0B" : theme.sub,
                    transition: "all 0.15s",
                    transform: star <= (hoveredRating || rating) ? "scale(1.15)" : "scale(1)",
                    display: "block"
                  }}
                />
              </button>
            ))}
          </div>
          <p style={{ fontSize: "16px", fontWeight: 600, color: ratingLabel.color, margin: 0, minHeight: "24px", transition: "color 0.2s" }}>
            {ratingLabel.text}
          </p>
        </div>

        {/* ── Quick Tags ── */}
        {rating > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: theme.text, marginBottom: "12px", fontFamily: "var(--font-syne), sans-serif" }}>
              What did you like?
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {QUICK_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    style={{
                      padding: "8px 16px",
                      fontSize: "12px",
                      fontWeight: 500,
                      borderRadius: "999px",
                      border: isSelected ? "none" : `1px solid ${theme.inputBorder}`,
                      backgroundColor: isSelected ? theme.accent : theme.pill,
                      color: isSelected ? "#fff" : theme.pillText,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Aspect Ratings ── */}
        {rating > 0 && (
          <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: "16px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: theme.text, marginBottom: "16px", fontFamily: "var(--font-syne), sans-serif" }}>
              Rate specific aspects
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {ASPECT_RATINGS.map(aspect => (
                <div key={aspect.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: theme.sub }}>{aspect.label}</span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setAspectRating(aspect.id, star)}
                        onMouseEnter={() => setHoveredAspect(prev => ({ ...prev, [aspect.id]: star }))}
                        onMouseLeave={() => setHoveredAspect(prev => ({ ...prev, [aspect.id]: 0 }))}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                      >
                        <Star
                          size={20}
                          style={{
                            fill: star <= (hoveredAspect[aspect.id] || aspectRatings[aspect.id] || 0) ? "#F59E0B" : "transparent",
                            stroke: star <= (hoveredAspect[aspect.id] || aspectRatings[aspect.id] || 0) ? "#F59E0B" : theme.sub,
                            transition: "all 0.15s",
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Comment ── */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: theme.sub, marginBottom: "10px" }}>
            Write a review (optional)
          </label>
          <textarea
            placeholder="Share your experience with this provider..."
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            style={{ width: "100%", minHeight: "120px", padding: "14px 16px", backgroundColor: theme.input, color: theme.text, border: `1px solid ${rating > 0 ? theme.accent : theme.inputBorder}`, borderRadius: "12px", fontSize: "14px", resize: "none", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1.6, transition: "border-color 0.2s" }}
          />
          <p style={{ fontSize: "11px", color: theme.sub, margin: "6px 0 0", textAlign: "right" }}>
            {comment.length}/500
          </p>
        </div>

        {/* Tips */}
        {rating > 0 && (
          <div style={{ padding: "12px 14px", backgroundColor: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px", marginBottom: "24px" }}>
            <p style={{ fontSize: "12px", color: theme.sub, margin: 0, lineHeight: 1.6 }}>
              💡 Your review helps other customers in Kerala make better decisions. Be honest and specific about your experience.
            </p>
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          style={{
            width: "100%",
            padding: "16px",
            backgroundColor: rating === 0 ? theme.input : "#3B82F6",
            color: rating === 0 ? theme.sub : "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: rating === 0 ? "not-allowed" : "pointer",
            boxShadow: rating > 0 ? "0 4px 20px rgba(59,130,246,0.4)" : "none",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
        >
          {isSubmitting ? (
            <>
              <div style={{ width: "18px", height: "18px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Submitting...
            </>
          ) : rating === 0 ? (
            "Select a rating to continue"
          ) : (
            <>
              <Star size={16} style={{ fill: "white", stroke: "white" }} />
              Submit Review
            </>
          )}
        </button>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#080F1E" }} />}>
      <ReviewContent />
    </Suspense>
  )
}

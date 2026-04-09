"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Send, Image as ImageIcon, X, Camera } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { supabase } from "@/lib/supabase"

function getEmoji(category: string, serviceType: string): string {
  const c = (category + " " + serviceType).toLowerCase()
  if (c.includes("plumb")) return "🔧"
  if (c.includes("snake")) return "🐍"
  if (c.includes("coconut") || c.includes("tree")) return "🌴"
  if (c.includes("electric")) return "⚡"
  if (c.includes("mehndi") || c.includes("mehandi")) return "🌿"
  if (c.includes("beauty") || c.includes("hair")) return "💄"
  if (c.includes("tutor") || c.includes("teach")) return "📚"
  if (c.includes("driver") || c.includes("transport")) return "🚗"
  if (c.includes("calligraph") || c.includes("art")) return "🎨"
  if (c.includes("cook") || c.includes("food")) return "🍽️"
  return "🌟"
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

function ChatContent() {
  const router = useRouter()
  const params = useParams()
  const providerId = params.providerId as string
  const { theme, mounted } = useTheme()

  const [provider, setProvider] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const customerId = typeof window !== "undefined" ? localStorage.getItem("heyy_user_id") || localStorage.getItem("heyy_user_phone") || "" : ""
  const customerPhone = typeof window !== "undefined" ? localStorage.getItem("heyy_user_phone") || "" : ""

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch provider + setup conversation
  useEffect(() => {
    async function setup() {
      if (!providerId || !customerId) return
      setLoading(true)

      // Fetch provider
      const { data: providerData } = await supabase
        .from("providers")
        .select("*")
        .eq("id", providerId)
        .single()

      if (providerData) setProvider(providerData)

      // Find or create conversation
      let { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("customer_id", customerId)
        .eq("provider_id", providerId)
        .single()

      if (!conv) {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({
            customer_id: customerId,
            customer_phone: customerPhone,
            provider_id: providerId,
          })
          .select()
          .single()
        conv = newConv
      }

      if (conv) {
        setConversationId(conv.id)

        // Fetch messages
        const { data: msgs } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: true })

        setMessages(msgs || [])
      }

      setLoading(false)
    }

    setup()
  }, [providerId, customerId])

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.find((m) => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedImage(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  // Send message
  const handleSend = async () => {
    if ((!messageText.trim() && !selectedImage) || !conversationId || sending) return
    setSending(true)

    try {
      let photoUrl: string | null = null

      // Upload image if selected
      if (selectedImage) {
        setUploadingImage(true)
        const path = `chat/${conversationId}/${Date.now()}_${selectedImage.name}`
        const { data: uploadData } = await supabase.storage
          .from("chat-photos")
          .upload(path, selectedImage, { upsert: true })

        if (uploadData) {
          const { data: urlData } = supabase.storage
            .from("chat-photos")
            .getPublicUrl(path)
          photoUrl = urlData.publicUrl
        }
        setUploadingImage(false)
      }

      // Insert message
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_type: "customer",
        sender_id: customerId,
        message: messageText.trim() || null,
        photo_url: photoUrl,
        created_at: new Date().toISOString(),
      })

      // Update conversation last message
      await supabase
        .from("conversations")
        .update({
          last_message: messageText.trim() || "📷 Photo",
          last_message_at: new Date().toISOString(),
        })
        .eq("id", conversationId)

      setMessageText("")
      clearImage()
    } catch (err) {
      console.error(err)
      alert("Failed to send message. Please try again.")
    }

    setSending(false)
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups: any, msg: any) => {
    const date = formatDate(msg.created_at)
    if (!groups[date]) groups[date] = []
    groups[date].push(msg)
    return groups
  }, {})

  if (!mounted) return <div style={{ minHeight: "100vh", backgroundColor: "#080F1E" }} />

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#080F1E", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "32px", height: "32px", border: "2px solid #3B82F6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const emoji = provider ? getEmoji(provider.category || "", provider.service_type || "") : "🌟"
  const isOnline = provider?.is_online || false
  const lastSeen = provider?.last_seen ? new Date(provider.last_seen).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : ""

  return (
    <div style={{ maxWidth: "430px", margin: "0 auto", height: "100vh", display: "flex", flexDirection: "column", backgroundColor: theme.bg, fontFamily: "var(--font-dm-sans), sans-serif" }}>

      {/* Header */}
      <header style={{ backgroundColor: theme.headerBg, borderBottom: `1px solid ${theme.borderLight}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0, backdropFilter: "blur(20px)" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", color: theme.text, padding: "4px", flexShrink: 0 }}>
          <ArrowLeft size={20} />
        </button>

        {/* Provider info */}
        <div
          onClick={() => router.push(`/provider/${providerId}`)}
          style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, cursor: "pointer" }}
        >
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: theme.input, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
              {emoji}
            </div>
            {/* Online indicator */}
            <div style={{ position: "absolute", bottom: "1px", right: "1px", width: "11px", height: "11px", borderRadius: "50%", backgroundColor: isOnline ? "#22C55E" : theme.sub, border: `2px solid ${theme.headerBg}` }} />
          </div>

          <div>
            <p style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "15px", fontWeight: 700, color: theme.text, margin: 0 }}>
              {provider?.full_name || "Provider"}
            </p>
            <p style={{ fontSize: "11px", color: isOnline ? "#22C55E" : theme.sub, margin: 0 }}>
              {isOnline ? "Online now" : lastSeen ? `Last seen ${lastSeen}` : "Offline"}
            </p>
          </div>
        </div>

        {/* View profile */}
        <button
          onClick={() => router.push(`/provider/${providerId}`)}
          style={{ fontSize: "12px", fontWeight: 600, color: theme.accent, background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
        >
          Profile
        </button>
      </header>

      {/* Notice banner */}
      <div style={{ padding: "8px 16px", backgroundColor: "rgba(59,130,246,0.08)", borderBottom: `1px solid rgba(59,130,246,0.15)`, flexShrink: 0 }}>
        <p style={{ fontSize: "11px", color: theme.sub, margin: 0, textAlign: "center" }}>
          🔒 Messages are monitored for safety · Never share personal financial info
        </p>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>

        {/* Empty state */}
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", padding: "32px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>{emoji}</div>
            <h3 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "16px", fontWeight: 700, color: theme.text, margin: "0 0 8px" }}>
              Start a conversation
            </h3>
            <p style={{ fontSize: "13px", color: theme.sub, lineHeight: 1.6, margin: 0 }}>
              Ask {provider?.full_name?.split(" ")[0] || "the provider"} about their availability, pricing, or any questions before booking.
            </p>
          </div>
        )}

        {/* Messages grouped by date */}
        {Object.entries(groupedMessages).map(([date, msgs]: [string, any]) => (
          <div key={date}>
            {/* Date separator */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "16px 0 12px" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: theme.borderLight }} />
              <span style={{ fontSize: "11px", color: theme.sub, backgroundColor: theme.bg, padding: "0 8px", whiteSpace: "nowrap" }}>{date}</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: theme.borderLight }} />
            </div>

            {/* Messages */}
            {msgs.map((msg: any, i: number) => {
              const isCustomer = msg.sender_type === "customer"
              const showTime = i === msgs.length - 1 || msgs[i + 1]?.sender_type !== msg.sender_type

              return (
                <div key={msg.id} style={{ display: "flex", justifyContent: isCustomer ? "flex-end" : "flex-start", marginBottom: showTime ? "8px" : "3px" }}>
                  <div style={{ maxWidth: "78%" }}>
                    {/* Photo message */}
                    {msg.photo_url && (
                      <div style={{ marginBottom: msg.message ? "4px" : "0" }}>
                        <img
                          src={msg.photo_url}
                          alt="Shared photo"
                          style={{ maxWidth: "100%", borderRadius: "12px", display: "block", cursor: "pointer" }}
                          onClick={() => window.open(msg.photo_url, "_blank")}
                        />
                      </div>
                    )}

                    {/* Text message */}
                    {msg.message && (
                      <div style={{
                        padding: "10px 14px",
                        borderRadius: isCustomer ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        backgroundColor: isCustomer ? theme.accent : theme.card,
                        border: isCustomer ? "none" : `1px solid ${theme.cardBorder}`,
                      }}>
                        <p style={{ fontSize: "14px", color: isCustomer ? "white" : theme.text, margin: 0, lineHeight: 1.5, wordBreak: "break-word" }}>
                          {msg.message}
                        </p>
                      </div>
                    )}

                    {/* Time */}
                    {showTime && (
                      <p style={{ fontSize: "10px", color: theme.sub, margin: "3px 0 0", textAlign: isCustomer ? "right" : "left", paddingLeft: isCustomer ? 0 : "4px", paddingRight: isCustomer ? "4px" : 0 }}>
                        {formatTime(msg.created_at)}
                        {isCustomer && (
                          <span style={{ marginLeft: "4px", color: msg.is_read ? theme.accent : theme.sub }}>
                            {msg.is_read ? "✓✓" : "✓"}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div style={{ padding: "8px 16px", backgroundColor: theme.card, borderTop: `1px solid ${theme.borderLight}`, flexShrink: 0 }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <img src={imagePreview} alt="Preview" style={{ height: "80px", borderRadius: "10px", objectFit: "cover" }} />
            <button
              onClick={clearImage}
              style={{ position: "absolute", top: "-6px", right: "-6px", width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "#EF4444", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={12} color="white" />
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div style={{ padding: "12px 16px", backgroundColor: theme.headerBg, borderTop: `1px solid ${theme.borderLight}`, flexShrink: 0, display: "flex", alignItems: "flex-end", gap: "10px" }}>

        {/* Photo buttons */}
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} style={{ display: "none" }} />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <ImageIcon size={16} style={{ color: theme.sub }} />
          </button>
          <button
            onClick={() => cameraInputRef.current?.click()}
            style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Camera size={16} style={{ color: theme.sub }} />
          </button>
        </div>

        {/* Text input */}
        <div style={{ flex: 1, backgroundColor: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: "20px", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={`Message ${provider?.full_name?.split(" ")[0] || "provider"}...`}
            rows={1}
            style={{ flex: 1, padding: "10px 14px", backgroundColor: "transparent", color: theme.text, fontSize: "14px", border: "none", outline: "none", resize: "none", fontFamily: "var(--font-dm-sans), sans-serif", lineHeight: 1.5, maxHeight: "100px", overflowY: "auto" }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={(!messageText.trim() && !selectedImage) || sending || uploadingImage}
          style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: (messageText.trim() || selectedImage) && !sending ? theme.accent : theme.input, border: "none", cursor: (messageText.trim() || selectedImage) && !sending ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s", boxShadow: (messageText.trim() || selectedImage) && !sending ? `0 4px 12px ${theme.accent}4D` : "none" }}
        >
          {sending || uploadingImage ? (
            <div style={{ width: "16px", height: "16px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          ) : (
            <Send size={18} color={(messageText.trim() || selectedImage) ? "white" : theme.sub} />
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea { scrollbar-width: none; }
        textarea::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#080F1E" }} />}>
      <ChatContent />
    </Suspense>
  )
}
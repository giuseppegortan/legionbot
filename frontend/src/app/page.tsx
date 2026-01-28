"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { ChatInterface } from "@/components/chat/chat-interface"
import { KnowledgeInspector } from "@/components/inspector/knowledge-inspector"
import { NewStormDialog } from "@/components/dashboard/new-storm-dialog"
import { StormCard } from "@/components/dashboard/storm-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PlusCircle } from "lucide-react"
import { EndStormResultDialog } from "@/components/chat/end-storm-dialog"

export default function Home() {
  const [view, setView] = useState<"dashboard" | "chat">("dashboard")
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [ragChunks, setRagChunks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  // End Storm states
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const USER_ID = "user_01"

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await fetch(`http://localhost:8000/storm/sessions?user_id=${USER_ID}`)
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
      }
    } catch (e) { console.error(e) }
  }

  const createStorm = async (name: string, agents: string[]) => {
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:8000/storm/start?user_id=${USER_ID}&name=${encodeURIComponent(name)}`, {
        method: "POST"
      })
      const data = await res.json()
      setActiveSession(data.session_id)
      setDownloadUrl(null)
      setMessages([{ role: "assistant", sender: "Architect", content: `Storm "${name}" initiated with: ${agents.join(", ")}. How can we help today?` }])
      setRagChunks([])
      setView("chat")
      fetchSessions()
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const selectStorm = async (session: any) => {
    setActiveSession(session.session_id)
    setDownloadUrl(null)
    try {
      const res = await fetch(`http://localhost:8000/storm/${session.session_id}/message?user_id=${USER_ID}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setRagChunks(data.rag_chunks || [])
      }
    } catch (e) {
      console.error("Error loading history:", e)
      setMessages([])
    }
    setView("chat")
  }

  const deleteStorm = async (sessionId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/storm/${sessionId}`, {
        method: "DELETE"
      })
      if (res.ok) {
        fetchSessions()
      }
    } catch (e) { console.error(e) }
  }

  const sendMessage = async (content: string) => {
    if (!activeSession) return
    const userMessage = { role: "user", sender: "User", content, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)
    try {
      const response = await fetch(`http://localhost:8000/storm/${activeSession}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userMessage)
      })
      const data = await response.json()
      setMessages(data.messages)
      setRagChunks(data.rag_chunks)
    } catch (error) { console.error(error) }
    setIsTyping(false)
  }

  const endStorm = async () => {
    if (!activeSession) return
    setIsEndDialogOpen(true)
    setIsEnding(true)
    try {
      const response = await fetch(`http://localhost:8000/storm/${activeSession}/end`, { method: "POST" })
      const data = await response.json()
      setDownloadUrl(data.download_url)
    } catch (error) {
      console.error(error)
      setIsEndDialogOpen(false)
    }
    setIsEnding(false)
  }

  const handleReturnToDashboard = () => {
    setIsEndDialogOpen(false)
    setView("dashboard")
    setActiveSession(null)
    fetchSessions()
  }

  if (view === "chat") {
    return (
      <main className="flex h-screen w-full overflow-hidden bg-black">
        <Sidebar onNewStorm={() => setView("dashboard")} activeSessionId={activeSession} />
        <ChatInterface
          messages={messages}
          onSendMessage={sendMessage}
          onEndStorm={endStorm}
          isTyping={isTyping}
        />
        <KnowledgeInspector chunks={ragChunks} />
        <EndStormResultDialog
          open={isEndDialogOpen}
          onOpenChange={setIsEndDialogOpen}
          onDashboard={handleReturnToDashboard}
          downloadUrl={downloadUrl}
          isProcessing={isEnding}
        />
      </main>
    )
  }

  return (
    <main className="flex flex-col h-screen w-full bg-black text-white p-6 md:p-12 overflow-hidden">
      <header className="flex justify-between items-center mb-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
            <span className="text-black font-black text-xl italic">S</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tighter">STORM ENGINE</h1>
        </div>
        <div className="flex items-center gap-4">
          <NewStormDialog onCreate={createStorm} />
          <Avatar className="h-10 w-10 border border-zinc-800 bg-zinc-900">
            <AvatarFallback className="bg-zinc-900 font-bold text-zinc-400">G</AvatarFallback>
          </Avatar>
        </div>
      </header>
      <section className="mb-12 max-w-7xl mx-auto w-full">
        <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-4 text-zinc-100">Your Storms</h2>
        <p className="text-zinc-500 text-lg max-w-2xl">Create a new storm to orchestrate multidimensional AI collaboration.</p>
      </section>
      <div className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full pr-4">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-900 rounded-3xl">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              <PlusCircle size={32} className="text-zinc-700" />
            </div>
            <p className="text-zinc-500 font-medium">No active storms yet. Launch one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {sessions.map((s) => (
              <StormCard
                key={s.session_id}
                id={s.session_id}
                name={s.name}
                date="Today"
                onClick={() => selectStorm(s)}
                onDelete={() => deleteStorm(s.session_id)}
              />
            ))}
          </div>
        )}
      </div>
      <footer className="mt-8 text-center text-zinc-700 text-[10px] uppercase tracking-widest font-bold">STORM ENGINE // MULTI-AGENT ORCHESTRATION PLATFORM</footer>
    </main>
  )
}

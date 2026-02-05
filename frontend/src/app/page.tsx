"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { ChatInterface } from "@/components/chat/chat-interface"
import { KnowledgeInspector } from "@/components/inspector/knowledge-inspector"
import { NewStormDialog } from "@/components/dashboard/new-storm-dialog"
import { StormCard } from "@/components/dashboard/storm-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlusCircle, LogOut, Chrome } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EndStormResultDialog } from "@/components/chat/end-storm-dialog"
import { LogViewer } from "@/components/debug/log-viewer"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Session } from "@supabase/supabase-js"

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
  const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [mutedAgents, setMutedAgents] = useState<string[]>([])
  const [activeCollaborators, setActiveCollaborators] = useState<string[]>(['Architect', 'Developer', 'Secretary'])

  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      fetchSessions()
    }
  }, [session])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : ''
      }
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setView("dashboard")
    setActiveSession(null)
    setSessions([])
  }

  const fetchSessions = async () => {
    if (!session?.user?.id) return
    try {
      const res = await fetch(`http://localhost:8000/storm/sessions`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
      }
    } catch (e) { console.error(e) }
  }

  const createStorm = async (name: string, agents: string[]) => {
    if (!session?.user?.id) return
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:8000/storm/start`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ name, agents })
      })
      const data = await res.json()
      setActiveSession(data.session_id)
      setDownloadUrl(null)
      setActiveCollaborators(agents)
      setMessages([{ role: "assistant", sender: "Architect", content: `Storm "${name}" initiated with: ${agents.join(", ")}. How can we help today?` }])
      setRagChunks([])
      setView("chat")
      fetchSessions()
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const selectStorm = async (selection: any) => {
    if (!session?.user?.id) return
    setActiveSession(selection.session_id)
    setDownloadUrl(null)
    try {
      const res = await fetch(`http://localhost:8000/storm/${selection.session_id}/message`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
        setRagChunks(data.rag_chunks || [])
        if (data.participants) {
          setActiveCollaborators(data.participants)
        } else {
          setActiveCollaborators(['Architect', 'Developer', 'Secretary'])
        }
        setView("chat")
      } else {
        console.error("Failed to load storm:", res.status)
      }
    } catch (e) {
      console.error("Error loading history:", e)
      setMessages([])
    }
  }

  const deleteStorm = async (sessionId: string) => {
    // Prevent any accidental view changes
    setView("dashboard")

    // If the deleted storm is the active one, clean it up
    if (activeSession === sessionId) {
      setActiveSession(null)
    }

    // Optimistic update
    setSessions(prev => prev.filter(s => s.session_id !== sessionId))

    try {
      const res = await fetch(`http://localhost:8000/storm/${sessionId}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      if (res.ok) {
        toast.success("Storm deleted successfully")
      } else {
        toast.error("Failed to delete storm")
        fetchSessions()
      }
    } catch (e) {
      console.error(e)
      toast.error("An error occurred while deleting the storm")
      fetchSessions()
    }
  }

  const sendMessage = async (content: string) => {
    if (!activeSession) return
    const userMessage = {
      role: "user",
      sender: "User",
      content,
      timestamp: new Date().toISOString(),
      muted_agents: mutedAgents.map(a => a.toLowerCase())
    }
    // Don't add optimistic message locally, specific stream event will confirm it
    // setMessages(prev => [...prev, userMessage]) (Removed)
    setIsTyping(true)

    // We start with the messages we already have, maybe minus the one we just optimistic-added?
    // Actually, backend now streams EVERYTHING including the user message first.
    // But to be safe and responsive, we can keep the optimistic add or better yet:
    // Let's rely on the backend stream echo for consistency, or keep optimistic and dedup?
    // The backend yields `{"type": "message", "payload": msg_dict}` for the user msg too.

    // Strategy: Reset messages to current confirmed, let stream fill them in? 
    // No, that flashes.
    // Better: Append optimistic, then when stream comes, ignore duplicates or rebuild?
    // The stream sends NEW events. 
    // Wait, backend:
    // `state["messages"].append(msg_dict)` -> send to graph.
    // `async for event in graph.astream(state)` -> yields updates.
    // The user message is NOT yielded by graph.astream usually?
    // Ah, my backend code: `yield json.dumps({"type": "message", "payload": msg_dict})`
    // So backend ECHOES the user message first.
    // So we can just clear the optimistic one if we want, or handle dedupe.
    // Simplest: Don't do optimistic update here, let the stream start immediately.

    try {
      const response = await fetch(`http://localhost:8000/storm/${activeSession}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(userMessage)
      })

      if (!response.body) return
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")

        // Process all lines except the last one (which might be incomplete)
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const event = JSON.parse(line)
            if (event.type === "message") {
              setMessages(prev => {
                const exists = prev.some(m =>
                  m.sender === event.payload.sender &&
                  m.content === event.payload.content &&
                  m.timestamp === event.payload.timestamp
                )
                if (exists) return prev
                return [...prev, event.payload]
              })
            } else if (event.type === "rag") {
              setRagChunks(event.payload || [])
            } else if (event.type === "done") {
              console.log("Stream complete")
            } else if (event.type === "error") {
              console.error("Stream error:", event.payload)
            }
          } catch (e) {
            console.error("Error parsing JSON chunk", e)
          }
        }
      }
    } catch (error) { console.error(error) }
    setIsTyping(false)
  }

  const endStorm = async () => {
    if (!activeSession) return
    setIsEndDialogOpen(true)
    setIsEnding(true)
    setAnalysis(null)
    setDownloadUrl(null)
    try {
      const response = await fetch(`http://localhost:8000/storm/${activeSession}/analysis`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      const data = await response.json()
      setAnalysis(data.analysis)
    } catch (error) {
      console.error(error)
      setIsEndDialogOpen(false)
    }
    setIsEnding(false)
  }

  const generateBlueprint = async () => {
    if (!activeSession) return
    setIsGeneratingBlueprint(true)
    try {
      const response = await fetch(`http://localhost:8000/storm/${activeSession}/blueprint`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      const data = await response.json()
      setDownloadUrl(data.download_url)
    } catch (error) {
      console.error(error)
    }
    setIsGeneratingBlueprint(false)
  }

  const [isEvolving, setIsEvolving] = useState(false)

  const evolveKnowledge = async (agents: string[]) => {
    if (!activeSession) return
    setIsEvolving(true)
    try {
      await fetch(`http://localhost:8000/storm/${activeSession}/evolve`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ agents })
      })
    } catch (error) { console.error(error) }
    setIsEvolving(false)
  }

  const handleReturnToDashboard = () => {
    setIsEndDialogOpen(false)
    setView("dashboard")
    setActiveSession(null)
    fetchSessions()
  }

  if (!session) {
    return (
      <main className="flex flex-col items-center justify-center h-screen w-full bg-black text-white p-6">
        <div className="max-w-md w-full p-12 bg-zinc-900/30 border border-zinc-900 rounded-[3rem] text-center backdrop-blur-xl">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-white/10">
            <span className="text-black font-black text-3xl italic">S</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter mb-4 italic">STORM ENGINE</h1>
          <p className="text-zinc-500 mb-12 text-sm leading-relaxed uppercase tracking-widest font-bold">Multi-Agent Orchestration</p>

          <Button
            onClick={signInWithGoogle}
            className="w-full h-14 bg-white text-black hover:bg-zinc-200 rounded-2xl font-bold flex gap-3 items-center justify-center text-lg transition-all active:scale-95"
          >
            <Chrome size={20} />
            Sign in with Google
          </Button>

          <p className="mt-8 text-[10px] text-zinc-700 uppercase tracking-[0.2em] font-black">Secure Infrastructure // Powered by Supabase</p>
        </div>
      </main>
    )
  }

  if (view === "chat") {
    return (
      <main className="flex h-screen w-full overflow-hidden bg-black">
        <Sidebar
          onNewStorm={() => setView("dashboard")}
          activeSessionId={activeSession}
          mutedAgents={mutedAgents}
          activeCollaborators={activeCollaborators}
          onToggleMute={(agent) => {
            setMutedAgents(prev =>
              prev.includes(agent) ? prev.filter(a => a !== agent) : [...prev, agent]
            )
          }}
        />
        <ChatInterface
          messages={messages}
          onSendMessage={sendMessage}
          onEndStorm={endStorm}
          onGenerateBlueprint={generateBlueprint}
          isTyping={isTyping}
          isGeneratingBlueprint={isGeneratingBlueprint}
          downloadUrl={downloadUrl}
        />
        <KnowledgeInspector chunks={ragChunks} />
        <EndStormResultDialog
          open={isEndDialogOpen}
          onOpenChange={setIsEndDialogOpen}
          onDashboard={handleReturnToDashboard}
          analysis={analysis}
          downloadUrl={downloadUrl}
          isProcessing={isEnding}
          isGeneratingBlueprint={isGeneratingBlueprint}
          onGenerateBlueprint={generateBlueprint}
          sessionId={activeSession}
          onEvolve={evolveKnowledge}
          isEvolving={isEvolving}
          activeCollaborators={activeCollaborators}
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
          <div className="flex items-center gap-2 pl-4 border-l border-zinc-900">
            <Avatar className="h-10 w-10 border border-zinc-800 bg-zinc-900">
              <AvatarImage src={session.user.user_metadata.avatar_url} />
              <AvatarFallback className="bg-zinc-900 font-bold text-zinc-400">
                {session.user.email?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
            >
              <LogOut size={18} />
            </Button>
          </div>
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
      <LogViewer />
    </main>
  )
}

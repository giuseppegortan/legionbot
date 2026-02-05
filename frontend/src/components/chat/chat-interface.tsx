"use client"

import { useState, useRef, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, AtSign, FileJson, Download } from "lucide-react"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { AlertTriangle, Loader2 } from "lucide-react"

interface ChatInterfaceProps {
    messages: any[]
    onSendMessage: (content: string) => void
    onEndStorm: () => void
    onGenerateBlueprint: () => void
    isTyping?: boolean
    isGeneratingBlueprint?: boolean
    downloadUrl?: string | null
}

export function ChatInterface({
    messages = [],
    onSendMessage,
    onEndStorm,
    onGenerateBlueprint,
    isTyping,
    isGeneratingBlueprint,
    downloadUrl
}: ChatInterfaceProps) {
    const [input, setInput] = useState("")
    const [isConfirmOpen, setConfirmOpen] = useState(false)
    const scrollBottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        scrollBottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, isTyping])

    const handleSend = () => {
        if (!input.trim() || isTyping) return
        onSendMessage(input)
        setInput("")
    }

    return (
        <div className="flex flex-col h-full bg-black text-zinc-100 flex-1 relative overflow-hidden">
            <header className="p-4 border-b border-zinc-900 flex justify-between items-center shrink-0">
                <h2 className="font-semibold text-lg tracking-tight">Project Storm</h2>
                <div className="flex gap-2">
                    {!downloadUrl ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onGenerateBlueprint}
                            disabled={isGeneratingBlueprint}
                            className="text-zinc-400 hover:text-zinc-100 rounded-xl border border-zinc-900"
                        >
                            {isGeneratingBlueprint ? (
                                <Loader2 className="animate-spin mr-2" size={16} />
                            ) : (
                                <FileJson className="mr-2" size={16} />
                            )}
                            Blueprint
                        </Button>
                    ) : (
                        <Button
                            asChild
                            size="sm"
                            className="bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30 rounded-xl"
                        >
                            <a href={`http://localhost:8000${downloadUrl}`} target="_blank" rel="noopener noreferrer">
                                <Download size={16} className="mr-2" />
                                Download Zip
                            </a>
                        </Button>
                    )}
                    <Dialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-red-900/50 text-red-500 hover:bg-red-950/20 rounded-xl"
                            >
                                End Storm
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-950 border-zinc-900 text-zinc-100 max-w-sm rounded-[2rem]">
                            <DialogHeader className="flex flex-col items-center pt-4">
                                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                                    <AlertTriangle className="text-red-500" size={24} />
                                </div>
                                <DialogTitle className="text-xl font-bold">Finalize Storm?</DialogTitle>
                                <DialogDescription className="text-zinc-500 text-center text-sm mt-2">
                                    This will terminate the orchestration and generate the final project assets. This action cannot be reversed.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setConfirmOpen(false)}
                                    className="flex-1 rounded-xl border border-zinc-900 hover:bg-zinc-900"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        setConfirmOpen(false)
                                        onEndStorm()
                                    }}
                                    className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 font-bold"
                                >
                                    Finalize
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 pb-40">
                <div className="max-w-3xl mx-auto space-y-8">
                    {(messages || []).map((m, i) => (
                        <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <span className="text-xs text-zinc-500 mb-1 px-1">{m.sender}</span>
                            <div className={`max-w-[90%] rounded-2xl p-4 prose prose-invert prose-sm ${m.role === 'user'
                                ? 'bg-zinc-800 text-zinc-100 rounded-tr-none'
                                : 'bg-zinc-900/50 border border-zinc-800 text-zinc-300 rounded-tl-none'
                                }`}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        pre: ({ node, ...props }) => <div className="overflow-auto my-2 w-full p-2 bg-black/50 rounded-lg">{props.children}</div>,
                                        code: ({ node, ...props }) => <code className="bg-zinc-800 px-1 rounded text-zinc-100" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc ml-4 space-y-1" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal ml-4 space-y-1" {...props} />,
                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />
                                    }}
                                >
                                    {m.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex flex-col items-start animate-pulse">
                            <span className="text-xs text-zinc-500 mb-1 px-1">Agents are brainstorming...</span>
                            <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl rounded-tl-none">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-zinc-700 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-zinc-700 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-zinc-700 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={scrollBottomRef} />
                </div>
            </div>

            <div className="p-4 bg-gradient-to-t from-black via-black to-transparent absolute bottom-0 left-0 right-0">
                <div className="max-w-3xl mx-auto relative group">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isTyping ? "Agents are thinking..." : "Type a message or @mention an agent..."}
                        disabled={isTyping}
                        className="h-14 bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700 pl-4 pr-24 rounded-2xl backdrop-blur-sm transition-all group-hover:border-zinc-700"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <Button size="icon" variant="ghost" className="text-zinc-500 hover:text-zinc-300">
                            <AtSign size={18} />
                        </Button>
                        <Button
                            size="icon"
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                            className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 rounded-xl"
                        >
                            <Send size={18} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

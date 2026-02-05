"use client"

import { useState, useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Terminal, X, Trash2, Download } from "lucide-react"

interface LogEntry {
    timestamp: string
    level: "INFO" | "ERROR" | "DEBUG" | "WARNING"
    message: string
}

export function LogViewer() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Intercept console methods to capture frontend logs
        const originalLog = console.log
        const originalError = console.error
        const originalWarn = console.warn

        console.log = (...args) => {
            originalLog(...args)
            addLog("INFO", args.join(" "))
        }

        console.error = (...args) => {
            originalError(...args)
            addLog("ERROR", args.join(" "))
        }

        console.warn = (...args) => {
            originalWarn(...args)
            addLog("WARNING", args.join(" "))
        }

        return () => {
            console.log = originalLog
            console.error = originalError
            console.warn = originalWarn
        }
    }, [])

    const addLog = (level: LogEntry["level"], message: string) => {
        const entry: LogEntry = {
            timestamp: new Date().toLocaleTimeString(),
            level,
            message
        }
        setLogs(prev => [...prev, entry].slice(-100)) // Keep last 100 logs
    }

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [logs])

    const clearLogs = () => setLogs([])

    const downloadLogs = () => {
        const content = logs.map(log => `[${log.timestamp}] ${log.level}: ${log.message}`).join("\n")
        const blob = new Blob([content], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `storm-logs-${Date.now()}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    const getLevelColor = (level: LogEntry["level"]) => {
        switch (level) {
            case "ERROR": return "text-red-400"
            case "WARNING": return "text-yellow-400"
            case "INFO": return "text-blue-400"
            case "DEBUG": return "text-zinc-500"
            default: return "text-zinc-400"
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all shadow-lg flex items-center justify-center group"
                title="Open Debug Logs"
            >
                <Terminal className="text-zinc-400 group-hover:text-zinc-100" size={20} />
                {logs.filter(l => l.level === "ERROR").length > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-pulse">
                        {logs.filter(l => l.level === "ERROR").length}
                    </div>
                )}
            </button>
        )
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-[600px] h-[400px] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-2">
                    <Terminal className="text-green-400" size={18} />
                    <h3 className="font-bold text-sm text-zinc-100">Live Debug Console</h3>
                    <span className="text-[10px] text-zinc-500 font-mono">
                        {logs.length} entries
                    </span>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={downloadLogs}
                        className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                        title="Download Logs"
                    >
                        <Download size={14} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearLogs}
                        className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                        title="Clear Logs"
                    >
                        <Trash2 size={14} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsOpen(false)}
                        className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
                    >
                        <X size={14} />
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div ref={scrollRef} className="space-y-1 font-mono text-xs">
                    {logs.length === 0 ? (
                        <div className="text-zinc-600 text-center py-8">
                            No logs yet. Waiting for activity...
                        </div>
                    ) : (
                        logs.map((log, idx) => (
                            <div key={idx} className="flex gap-2 hover:bg-zinc-900/50 px-2 py-1 rounded">
                                <span className="text-zinc-600 shrink-0">{log.timestamp}</span>
                                <span className={`font-bold shrink-0 w-16 ${getLevelColor(log.level)}`}>
                                    [{log.level}]
                                </span>
                                <span className="text-zinc-300 break-all">{log.message}</span>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className="p-2 border-t border-zinc-800 bg-zinc-900/30 text-[10px] text-zinc-600 text-center">
                Frontend logs only • Backend logs: check terminal
            </div>
        </div>
    )
}

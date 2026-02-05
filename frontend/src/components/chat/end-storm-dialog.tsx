import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, CheckCircle2, Home, Loader2, Sparkles, FileJson, BrainCircuit } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface EndStormResultDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onDashboard: () => void
    analysis: string | null
    downloadUrl: string | null
    isProcessing: boolean
    isGeneratingBlueprint: boolean
    onGenerateBlueprint: () => void
    sessionId: string | null
    onEvolve: (agents: string[]) => void
    isEvolving: boolean
    activeCollaborators?: string[]
}

import { useState, useEffect } from "react"

export function EndStormResultDialog({
    open,
    onOpenChange,
    onDashboard,
    analysis,
    downloadUrl,
    isProcessing,
    isGeneratingBlueprint,
    onGenerateBlueprint,
    sessionId,
    onEvolve,
    isEvolving,
    activeCollaborators = ['Architect', 'Developer', 'Secretary']
}: EndStormResultDialogProps) {
    const [selectedAgents, setSelectedAgents] = useState<string[]>(activeCollaborators)
    const [hasEvolved, setHasEvolved] = useState(false)

    useEffect(() => {
        if (!open) setHasEvolved(false)
    }, [open])

    useEffect(() => {
        setSelectedAgents(activeCollaborators)
    }, [activeCollaborators])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-950 border-zinc-900 text-zinc-100 max-w-2xl rounded-[2rem] p-0 overflow-hidden outline-none">
                <div className="flex flex-col h-[80vh] max-h-[700px]">
                    <DialogHeader className="p-8 pb-4 border-b border-zinc-900 shrink-0">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Sparkles className="text-white" size={24} />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight">
                                    Storm Complete
                                </DialogTitle>
                                <DialogDescription className="text-zinc-500 text-xs mt-1">
                                    Technical Analysis & Project Blueprint
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden px-8">
                        {isProcessing ? (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
                                <p className="animate-pulse text-sm">Orchestrating final conclusions...</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-full pr-4">
                                <div className="prose prose-invert prose-sm max-w-none pb-8 text-zinc-300">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {analysis || "No analysis available."}
                                    </ReactMarkdown>
                                </div>
                            </ScrollArea>
                        )}
                    </div>

                    <DialogFooter className="p-8 pt-4 bg-zinc-900/50 border-t border-zinc-900 flex flex-col gap-4 shrink-0">
                        {!isProcessing && analysis && (
                            <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4 mb-2">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <BrainCircuit className="text-purple-400" size={18} />
                                        <h4 className="text-sm font-bold text-zinc-100">Knowledge Evolution</h4>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Select Collaborators</p>
                                </div>
                                <div className="flex gap-4 mb-4">
                                    {activeCollaborators.map(agent => (
                                        <div key={agent} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={agent}
                                                checked={selectedAgents.includes(agent)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setSelectedAgents([...selectedAgents, agent])
                                                    else setSelectedAgents(selectedAgents.filter(a => a !== agent))
                                                }}
                                                className="border-zinc-800 data-[state=checked]:bg-purple-500 rounded-md"
                                            />
                                            <Label htmlFor={agent} className="text-xs text-zinc-400 cursor-pointer">{agent}</Label>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    onClick={async () => {
                                        await onEvolve(selectedAgents)
                                        setHasEvolved(true)
                                    }}
                                    disabled={selectedAgents.length === 0 || isEvolving || hasEvolved}
                                    variant="outline"
                                    className={`w-full h-10 border-purple-500/20 hover:bg-purple-500/10 text-purple-400 font-bold text-xs rounded-xl gap-2 transition-all ${hasEvolved ? 'border-green-500/20 text-green-500 bg-green-500/5' : ''}`}
                                >
                                    {isEvolving ? <Loader2 className="animate-spin" size={14} /> : (hasEvolved ? <CheckCircle2 size={14} /> : <Sparkles size={14} />)}
                                    {hasEvolved ? 'Knowledge Evolved' : 'Extend Knowledge Bases'}
                                </Button>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 w-full">
                            {!downloadUrl ? (
                                <Button
                                    onClick={onGenerateBlueprint}
                                    disabled={isProcessing || isGeneratingBlueprint}
                                    className="w-full h-12 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 rounded-xl font-bold flex gap-2 items-center justify-center transition-all active:scale-[0.98]"
                                >
                                    {isGeneratingBlueprint ? <Loader2 className="animate-spin" size={18} /> : <FileJson size={18} />}
                                    Generate Project Blueprint (ZIP)
                                </Button>
                            ) : (
                                <Button
                                    asChild
                                    className="w-full h-12 bg-green-600 text-white hover:bg-green-700 rounded-xl font-bold flex gap-2 items-center justify-center animate-in zoom-in-95 duration-300"
                                >
                                    <a
                                        href={`http://localhost:8000${downloadUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full h-full flex items-center justify-center gap-2"
                                    >
                                        <Download size={18} />
                                        Download Blueprint ZIP
                                    </a>
                                </Button>
                            )}

                            <Button
                                variant="ghost"
                                onClick={onDashboard}
                                className="w-full h-12 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 flex gap-2 items-center justify-center"
                            >
                                <Home size={18} />
                                Exit to Dashboard
                            </Button>
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}

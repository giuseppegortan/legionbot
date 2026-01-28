"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Users } from "lucide-react"

const AVAILABLE_AGENTS = [
    { id: "architect", name: "Architect", role: "Planning & Design" },
    { id: "developer", name: "Developer", role: "Coding & Logic" },
    { id: "secretary", name: "Secretary", role: "Documentation & Export" },
    { id: "security", name: "Security Auditor", role: "Vulnerability Check" },
]

interface NewStormDialogProps {
    onCreate: (name: string, agents: string[]) => void
}

export function NewStormDialog({ onCreate }: NewStormDialogProps) {
    const [name, setName] = useState("")
    const [selectedAgents, setSelectedAgents] = useState<string[]>(["architect", "developer", "secretary"])
    const [open, setOpen] = useState(false)

    const toggleAgent = (id: string) => {
        setSelectedAgents(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        )
    }

    const handleCreate = () => {
        if (!name.trim()) return
        onCreate(name, selectedAgents)
        setOpen(false)
        setName("")
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 gap-2">
                    <PlusCircle size={18} /> New Storm
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold tracking-tight">Create New Storm</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="storm-name" className="text-zinc-400">Storm Name</Label>
                        <Input
                            id="storm-name"
                            placeholder="e.g. Project Legion"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-zinc-400 flex items-center gap-2">
                            <Users size={16} /> Select Collaborators
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            {AVAILABLE_AGENTS.map(agent => (
                                <button
                                    key={agent.id}
                                    onClick={() => toggleAgent(agent.id)}
                                    className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left ${selectedAgents.includes(agent.id)
                                            ? "bg-zinc-100 border-zinc-100 text-zinc-900"
                                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                                        }`}
                                >
                                    <span className="text-sm font-semibold">{agent.name}</span>
                                    <span className={`text-[10px] ${selectedAgents.includes(agent.id) ? "text-zinc-600" : "text-zinc-600"}`}>
                                        {agent.role}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-100">Cancel</Button>
                    <Button onClick={handleCreate} disabled={!name.trim()} className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 px-8">Launch Storm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

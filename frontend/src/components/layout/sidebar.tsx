import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { PlusCircle, MessageSquare, Users, Home } from "lucide-react"

interface SidebarProps {
    onNewStorm?: () => void
    activeSessionId?: string | null
}

export function Sidebar({ onNewStorm, activeSessionId }: SidebarProps) {
    return (
        <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-900 w-64 lg:w-72">
            <div className="p-4 flex flex-col gap-4">
                <Button
                    onClick={onNewStorm}
                    variant="ghost"
                    className="w-full justify-start gap-2 text-zinc-400 hover:text-white hover:bg-zinc-900"
                >
                    <Home size={18} />
                    Dashboard
                </Button>
                <Button
                    className="w-full justify-start gap-2 bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
                    onClick={onNewStorm}
                >
                    <PlusCircle size={18} />
                    New Storm
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4">
                <div className="space-y-6">
                    <section>
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <MessageSquare size={14} /> Current Status
                        </h3>
                        <div className="space-y-1">
                            <div className="px-2 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800">
                                <p className="text-[10px] text-zinc-500 mb-1">SESSION ID</p>
                                <p className="text-xs text-zinc-300 font-mono truncate">{activeSessionId || "None active"}</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Users size={14} /> Collaborators
                        </h3>
                        <div className="space-y-1">
                            {['Architect', 'Developer', 'Secretary'].map((agent) => (
                                <div
                                    key={agent}
                                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-400"
                                >
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    {agent}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

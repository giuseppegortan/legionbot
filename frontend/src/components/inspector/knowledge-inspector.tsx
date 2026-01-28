import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Search, Database } from "lucide-react"

interface KnowledgeInspectorProps {
    chunks: any[]
}

export function KnowledgeInspector({ chunks }: KnowledgeInspectorProps) {
    return (
        <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-900 w-80">
            <header className="p-4 border-b border-zinc-900">
                <h3 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                    <Search size={16} /> Knowledge Inspector
                </h3>
            </header>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                    <div className="text-xs font-medium text-zinc-600 uppercase tracking-tighter mb-2">Retrieved RAG Chunks</div>
                    {chunks.length === 0 && (
                        <p className="text-xs text-zinc-700 italic text-center py-8">No chunks retrieved yet.</p>
                    )}
                    {chunks.map((chunk, i) => (
                        <Card key={i} className="bg-zinc-900/30 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group">
                            <CardHeader className="p-3 pb-0">
                                <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                                    <Database size={12} className="text-zinc-500" />
                                    {chunk.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-2 text-xs text-zinc-500 line-clamp-3 group-hover:text-zinc-400">
                                {chunk.content}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="p-4 border-t border-zinc-900">
                <div className="rounded-xl bg-zinc-900/50 p-3 border border-zinc-800/50 text-center">
                    <p className="text-[10px] text-zinc-500">Dual-Layer RAG Active</p>
                    <p className="text-[10px] text-green-500/70">Isolated User Context: User_01</p>
                </div>
            </div>
        </div>
    )
}

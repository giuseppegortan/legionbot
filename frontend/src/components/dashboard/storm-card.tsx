"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Clock } from "lucide-react"
import { DeleteStormDialog } from "./delete-storm-dialog"

interface StormCardProps {
    name: string
    id: string
    date: string
    onClick: () => void
    onDelete?: () => void
}

export function StormCard({ name, id, date, onClick, onDelete }: StormCardProps) {
    return (
        <Card
            onClick={onClick}
            className="bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group hover:bg-zinc-900/60"
        >
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-zinc-100 font-semibold group-hover:text-white transition-colors">
                        {name}
                    </CardTitle>
                    <div className="flex gap-2">
                        {onDelete && (
                            <DeleteStormDialog stormName={name} onDelete={onDelete} />
                        )}
                        <Badge variant="outline" className="border-zinc-800 text-zinc-500 text-[10px]">Active</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                        <MessageSquare size={12} />
                        <span>ID: {id.slice(0, 8)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{date}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle } from "lucide-react"
import { useState } from "react"

interface DeleteStormDialogProps {
    stormName: string
    onDelete: () => void
}

export function DeleteStormDialog({ stormName, onDelete }: DeleteStormDialogProps) {
    const [open, setOpen] = useState(false)

    const handleDelete = () => {
        onDelete()
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-900 text-zinc-100 max-w-sm rounded-[2rem]">
                <DialogHeader className="flex flex-col items-center pt-4">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                        <AlertTriangle className="text-red-500" size={24} />
                    </div>
                    <DialogTitle className="text-xl font-bold tracking-tight">Delete Storm?</DialogTitle>
                    <DialogDescription className="text-zinc-500 text-center text-sm mt-2">
                        Are you sure you want to delete <span className="text-zinc-300 font-semibold italic">"{stormName}"</span>? This action cannot be undone and all conversation history will be lost.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="flex-1 rounded-xl border border-zinc-900 hover:bg-zinc-900 hover:text-white"
                    >
                        Keep it
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                    >
                        Yes, delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

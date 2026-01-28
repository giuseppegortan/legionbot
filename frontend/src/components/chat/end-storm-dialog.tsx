"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, CheckCircle2, Home, Loader2 } from "lucide-react"

interface EndStormResultDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onDashboard: () => void
    downloadUrl: string | null
    isProcessing: boolean
}

export function EndStormResultDialog({
    open,
    onOpenChange,
    onDashboard,
    downloadUrl,
    isProcessing
}: EndStormResultDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-zinc-950 border-zinc-900 text-zinc-100 max-w-sm rounded-[2rem] p-8">
                <DialogHeader className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 border ${isProcessing
                            ? "bg-zinc-900 border-zinc-800 animate-pulse"
                            : "bg-green-500/10 border-green-500/20"
                        }`}>
                        {isProcessing ? (
                            <Loader2 className="text-zinc-500 animate-spin" size={32} />
                        ) : (
                            <CheckCircle2 className="text-green-500" size={32} />
                        )}
                    </div>
                    <DialogTitle className="text-2xl font-bold tracking-tight text-center">
                        {isProcessing ? "Optimizing Blueprint..." : "Storm Completed!"}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500 text-center text-sm mt-4">
                        {isProcessing
                            ? "The Secretary is compiling the final report and generating the orchestration blueprint."
                            : "The orchestration has been successfully finalized. Your project blueprint and summary are ready for download."}
                    </DialogDescription>
                </DialogHeader>

                {!isProcessing && (
                    <div className="mt-8 space-y-4">
                        {downloadUrl && (
                            <Button
                                asChild
                                className="w-full h-14 bg-white text-black hover:bg-zinc-200 rounded-2xl font-bold flex gap-2 items-center justify-center"
                            >
                                <a href={`http://localhost:8000${downloadUrl}`} download>
                                    <Download size={20} />
                                    Download Project.zip
                                </a>
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            onClick={onDashboard}
                            className="w-full h-12 rounded-2xl border border-zinc-900 hover:bg-zinc-900 text-zinc-400 flex gap-2 items-center justify-center"
                        >
                            <Home size={18} />
                            Return to Dashboard
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

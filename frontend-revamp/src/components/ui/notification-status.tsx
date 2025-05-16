import { AlertTriangle, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface NotificationStatusProps {
  isConnected?: boolean;
  isLoading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  className?: string;
}

/**
 * Komponen untuk menampilkan status notifikasi seperti loading, error, koneksi atau empty state
 */
export function NotificationStatus({
  isConnected = true,
  isLoading = false,
  error = null,
  isEmpty = false,
  className
}: NotificationStatusProps) {
  // Tampilkan loading state
  if (isLoading) {
    return (
      <div className={cn("p-4 text-center", className)}>
        <Loader2 className="h-5 w-5 mx-auto mb-2 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Memuat notifikasi...</p>
      </div>
    )
  }

  // Tampilkan error state
  if (error) {
    return (
      <div className={cn("p-2 text-xs text-red-500 bg-red-50 dark:bg-red-950 dark:text-red-400", className)}>
        <div className="flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          <span>Error: {error}</span>
        </div>
      </div>
    )
  }

  // Tampilkan status koneksi
  if (!isConnected) {
    return (
      <div className={cn("p-2 text-xs text-amber-500 bg-amber-50 dark:bg-amber-950 dark:text-amber-400", className)}>
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-4 w-4" />
          <span>Koneksi notifikasi sedang terputus, mencoba menghubungkan kembali...</span>
        </div>
      </div>
    )
  }

  // Tampilkan empty state
  if (isEmpty) {
    return (
      <div className={cn("p-4 text-center text-sm text-muted-foreground", className)}>
        <CheckCircle className="h-5 w-5 mx-auto mb-2 text-muted-foreground/70" />
        <p>Tidak ada notifikasi</p>
      </div>
    )
  }

  return null
} 
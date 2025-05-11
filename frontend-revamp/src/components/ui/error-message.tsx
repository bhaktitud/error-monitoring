import { FiAlertCircle } from "react-icons/fi"
import { Card } from "./card"

interface ErrorMessageProps {
  message: string
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-col items-center text-center">
        <FiAlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Terjadi Kesalahan</h3>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </Card>
  )
} 
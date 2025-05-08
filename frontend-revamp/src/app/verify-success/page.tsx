'use client'

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { FiCheck } from "react-icons/fi";

export default function VerifySuccessPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <FiCheck className="text-green-600 text-xl" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Verifikasi Email Berhasil!</h2>
          <p className="text-gray-600 mb-6">
            Email Anda telah berhasil diverifikasi. Akun Anda sekarang aktif dan Anda dapat mengakses semua fitur.
          </p>
          <Button onClick={() => router.push('/login')} className="w-full">
            Masuk Sekarang
          </Button>
        </div>
      </div>
    </div>
  );
} 
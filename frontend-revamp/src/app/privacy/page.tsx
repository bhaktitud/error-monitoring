'use client'

import { FiArrowLeft } from 'react-icons/fi'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import PageTransition from '@/components/ui/page-transition'
import { ThemeSwitcher } from '@/components/theme-switcher'
import Footer from '@/components/ui/footer'

export default function PrivacyPage() {
  return (
    <PageTransition>
      <div className="flex flex-col min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 flex-1">
          <div className="flex justify-between items-center mb-8">
            <Link href="/">
              <Button variant="ghost" className="flex items-center gap-2">
                <FiArrowLeft /> Kembali ke Beranda
              </Button>
            </Link>
            <ThemeSwitcher />
          </div>
          
          <div className="prose prose-neutral dark:prose-invert max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Kebijakan Privasi</h1>
            
            <p className="text-muted-foreground mb-4">
              Terakhir diperbarui: 18 Agustus 2023
            </p>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">1. Pendahuluan</h2>
              <p>
                LogRaven menghargai privasi Anda dan berkomitmen untuk melindungi informasi pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, mengungkapkan, dan melindungi informasi pribadi Anda saat Anda menggunakan layanan kami.
              </p>
              <p>
                Dengan menggunakan layanan kami, Anda menyetujui praktik yang dijelaskan dalam Kebijakan Privasi ini. Jika Anda tidak setuju dengan kebijakan ini, harap jangan gunakan layanan kami.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">2. Informasi yang Kami Kumpulkan</h2>
              <p>Kami dapat mengumpulkan jenis informasi berikut:</p>
              
              <h3 className="text-lg font-medium mb-2">2.1 Informasi Pribadi</h3>
              <p>Informasi yang dapat mengidentifikasi Anda secara pribadi, seperti:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Nama</li>
                <li>Alamat email</li>
                <li>Informasi penagihan</li>
                <li>Informasi profil (misalnya, foto profil)</li>
              </ul>
              
              <h3 className="text-lg font-medium mb-2">2.2 Data Aplikasi</h3>
              <p>
                Saat Anda menggunakan layanan kami untuk memantau aplikasi Anda, kami mengumpulkan informasi tentang error dan exception, termasuk:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Stack trace error</li>
                <li>Informasi browser atau device</li>
                <li>URL yang mengalami error</li>
                <li>Data konteks tambahan yang Anda kirim melalui SDK kami</li>
              </ul>
              
              <h3 className="text-lg font-medium mb-2">2.3 Data Penggunaan</h3>
              <p>
                Kami juga mengumpulkan informasi tentang bagaimana Anda menggunakan layanan kami, seperti:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Log akses</li>
                <li>Interaksi dengan layanan</li>
                <li>Data analitik</li>
                <li>Informasi perangkat dan browser</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">3. Bagaimana Kami Menggunakan Informasi Anda</h2>
              <p>Kami menggunakan informasi yang kami kumpulkan untuk:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Menyediakan, memelihara, dan meningkatkan layanan kami</li>
                <li>Memproses transaksi dan mengirim pemberitahuan terkait</li>
                <li>Mengirim informasi teknis, pembaruan, peringatan keamanan, dan pesan dukungan</li>
                <li>Merespons permintaan, pertanyaan, dan umpan balik Anda</li>
                <li>Memantau dan menganalisis tren, penggunaan, dan aktivitas</li>
                <li>Mencegah aktivitas penipuan dan melindungi hak, properti, dan keselamatan</li>
                <li>Mematuhi kewajiban hukum</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">4. Pengungkapan Informasi Anda</h2>
              <p>Kami dapat membagikan informasi Anda dalam situasi berikut:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>
                  <strong>Dengan Penyedia Layanan:</strong> Kami dapat berbagi data dengan vendor, konsultan, dan penyedia layanan lain yang membutuhkan akses ke informasi tersebut untuk bekerja atas nama kami.
                </li>
                <li>
                  <strong>Untuk Kepatuhan Hukum:</strong> Kami dapat mengungkapkan informasi jika diwajibkan oleh hukum atau dalam menanggapi proses hukum yang valid.
                </li>
                <li>
                  <strong>Dengan Persetujuan Anda:</strong> Kami dapat berbagi informasi dengan persetujuan Anda atau sesuai arahan Anda.
                </li>
                <li>
                  <strong>Dalam Kasus Transaksi Bisnis:</strong> Jika LogRaven terlibat dalam merger, akuisisi, atau penjualan aset, informasi Anda mungkin ditransfer sebagai bagian dari transaksi tersebut.
                </li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">5. Keamanan Data</h2>
              <p>
                Kami menerapkan langkah-langkah keamanan teknis, administratif, dan fisik yang wajar untuk melindungi informasi pribadi Anda dari akses yang tidak sah, penggunaan, atau pengungkapan. Namun, tidak ada metode transmisi internet atau penyimpanan elektronik yang 100% aman.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">6. Penyimpanan Data</h2>
              <p>
                Kami menyimpan informasi pribadi Anda selama dibutuhkan untuk memenuhi tujuan yang diuraikan dalam Kebijakan Privasi ini, kecuali jika periode penyimpanan yang lebih lama diperlukan atau diizinkan oleh hukum.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">7. Hak Privasi Anda</h2>
              <p>Tergantung pada lokasi Anda, Anda mungkin memiliki hak tertentu terkait dengan informasi pribadi Anda, termasuk:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Hak untuk mengakses informasi pribadi yang kami miliki tentang Anda</li>
                <li>Hak untuk meminta koreksi informasi yang tidak akurat</li>
                <li>Hak untuk meminta penghapusan informasi Anda</li>
                <li>Hak untuk meminta pembatasan penggunaan dan pengungkapan informasi Anda</li>
                <li>Hak untuk meminta portabilitas data</li>
                <li>Hak untuk menolak pemrosesan informasi Anda</li>
              </ul>
              <p>
                Untuk menggunakan hak-hak ini, silakan hubungi kami menggunakan informasi kontak yang tercantum di bagian &quot;Hubungi Kami&quot; di bawah ini.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">8. Anak-anak</h2>
              <p>
                Layanan kami tidak ditujukan untuk anak-anak di bawah usia 16 tahun. Kami tidak secara sadar mengumpulkan informasi pribadi dari anak-anak di bawah usia 16 tahun. Jika Anda adalah orang tua atau wali dan percaya bahwa anak Anda telah memberikan informasi pribadi kepada kami, silakan hubungi kami.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">9. Perubahan pada Kebijakan Privasi Ini</h2>
              <p>
                Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Tanggal terakhir diperbarui di bagian atas menunjukkan kapan revisi terakhir dibuat. Kami akan memberi tahu Anda tentang perubahan yang signifikan dengan memposting pemberitahuan di situs web kami atau mengirim pemberitahuan langsung kepada Anda.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">10. Hubungi Kami</h2>
              <p>
                Jika Anda memiliki pertanyaan, kekhawatiran, atau permintaan terkait Kebijakan Privasi ini atau praktik privasi kami, silakan hubungi kami di:
              </p>
              <p>
                Email: privacy@lograven.com<br />
                Alamat: Jl. Kemang Raya No. 10, Jakarta Selatan, Indonesia
              </p>
            </section>
            
          </div>
        </div>
        <Footer />
      </div>
    </PageTransition>
  )
} 
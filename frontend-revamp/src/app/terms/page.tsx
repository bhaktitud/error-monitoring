'use client'

import { FiArrowLeft } from 'react-icons/fi'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import PageTransition from '@/components/ui/page-transition'

export default function TermsPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="flex items-center gap-2">
                <FiArrowLeft /> Kembali ke Beranda
              </Button>
            </Link>
          </div>
          
          <div className="prose prose-neutral dark:prose-invert max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Syarat dan Ketentuan</h1>
            
            <p className="text-muted-foreground mb-4">
              Terakhir diperbarui: 18 Agustus 2023
            </p>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">1. Pendahuluan</h2>
              <p>
                Selamat datang di LogRaven. Syarat dan Ketentuan ini mengatur penggunaan dan akses 
                Anda ke layanan LogRaven, termasuk website, API, dan fitur lainnya 
                (secara kolektif disebut sebagai "Layanan").
              </p>
              <p>
                Dengan mengakses atau menggunakan Layanan kami, Anda menyetujui bahwa Anda telah membaca,
                memahami, dan menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak
                menyetujui Syarat dan Ketentuan ini, Anda tidak boleh mengakses atau menggunakan Layanan.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">2. Definisi</h2>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>"Kami"</strong> atau <strong>"LogRaven"</strong> mengacu pada perusahaan LogRaven, termasuk karyawan, direktur, pejabat, dan agen.</li>
                <li><strong>"Anda"</strong> atau <strong>"Pengguna"</strong> mengacu pada individu atau entitas yang mengakses atau menggunakan Layanan.</li>
                <li><strong>"Konten"</strong> mengacu pada semua informasi, data, teks, gambar, atau materi lain yang diakses melalui Layanan.</li>
                <li><strong>"Data Pengguna"</strong> mengacu pada data yang dikirimkan ke sistem kami oleh aplikasi Anda untuk tujuan monitoring error.</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">3. Akun Pengguna</h2>
              <p>
                Untuk menggunakan Layanan kami, Anda mungkin perlu membuat akun pengguna. Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun Anda dan semua aktivitas yang terjadi di bawah akun Anda.
              </p>
              <p>
                Anda setuju untuk segera memberi tahu kami tentang penggunaan akun Anda yang tidak sah. Kami tidak bertanggung jawab atas kerugian yang timbul dari penggunaan yang tidak sah dari akun Anda.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">4. Penggunaan Layanan</h2>
              <p>
                Anda setuju untuk tidak menggunakan Layanan untuk tujuan ilegal atau yang dilarang oleh Syarat dan Ketentuan ini. Anda tidak boleh menggunakan Layanan dengan cara yang dapat merusak, menonaktifkan, membebani, atau mengganggu Layanan.
              </p>
              <p>
                Anda juga setuju untuk tidak mencoba mendapatkan akses tidak sah ke bagian mana pun dari Layanan, sistem komputer lain, atau jaringan yang terhubung ke Layanan.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">5. Privasi dan Perlindungan Data</h2>
              <p>
                Kami menghormati privasi Anda dan berkomitmen untuk melindungi informasi pribadi Anda. Penggunaan informasi Anda oleh kami diatur oleh Kebijakan Privasi kami, yang dapat ditemukan di <Link href="/privacy" className="text-primary hover:underline">Kebijakan Privasi</Link>.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">6. Lisensi dan Hak Kekayaan Intelektual</h2>
              <p>
                Kami memberi Anda lisensi terbatas, non-eksklusif, tidak dapat dialihkan, dan dapat dicabut untuk menggunakan Layanan sesuai dengan Syarat dan Ketentuan ini.
              </p>
              <p>
                Semua hak kekayaan intelektual dalam Layanan, termasuk tetapi tidak terbatas pada perangkat lunak, desain, logo, dan konten, tetap menjadi milik LogRaven atau pemberi lisensinya.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">7. Pembayaran dan Langganan</h2>
              <p>
                Beberapa Layanan kami mungkin memerlukan pembayaran. Ketentuan pembayaran dan langganan akan dijelaskan selama proses pendaftaran atau pada halaman harga kami.
              </p>
              <p>
                Anda bertanggung jawab untuk semua biaya yang terkait dengan akun Anda. Jika Anda tidak membayar tepat waktu, kami berhak untuk menangguhkan atau menghentikan akses Anda ke Layanan.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">8. Penghentian Layanan</h2>
              <p>
                Kami berhak untuk menangguhkan atau menghentikan akses Anda ke Layanan kapan saja, dengan atau tanpa pemberitahuan, jika Anda melanggar Syarat dan Ketentuan ini atau jika kami percaya bahwa penggunaan Anda berisiko merugikan LogRaven atau pengguna lain.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">9. Disclaimer dan Batasan Tanggung Jawab</h2>
              <p>
                LAYANAN DISEDIAKAN "SEBAGAIMANA ADANYA" DAN "SEBAGAIMANA TERSEDIA" TANPA JAMINAN APA PUN, BAIK TERSURAT MAUPUN TERSIRAT. KAMI TIDAK MENJAMIN BAHWA LAYANAN AKAN SELALU AMAN, BEBAS KESALAHAN, ATAU TERSEDIA SETIAP SAAT.
              </p>
              <p>
                DALAM KEADAAN APA PUN, KAMI TIDAK BERTANGGUNG JAWAB ATAS KERUGIAN TIDAK LANGSUNG, INSIDENTAL, KHUSUS, KONSEKUENSIAL, ATAU KERUGIAN HUKUMAN YANG TIMBUL DARI PENGGUNAAN ANDA ATAS LAYANAN.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">10. Perubahan Pada Syarat dan Ketentuan</h2>
              <p>
                Kami berhak untuk mengubah atau memodifikasi Syarat dan Ketentuan ini kapan saja. Perubahan tersebut akan efektif segera setelah diposting di situs web kami. Anda bertanggung jawab untuk meninjau Syarat dan Ketentuan secara berkala.
              </p>
              <p>
                Penggunaan berkelanjutan Anda atas Layanan setelah perubahan Syarat dan Ketentuan merupakan penerimaan Anda terhadap perubahan tersebut.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">11. Hubungi Kami</h2>
              <p>
                Jika Anda memiliki pertanyaan tentang Syarat dan Ketentuan ini, silakan hubungi kami di:
              </p>
              <p>
                Email: legal@lograven.com<br />
                Alamat: Jl. Kemang Raya No. 10, Jakarta Selatan, Indonesia
              </p>
            </section>
            
          </div>
        </div>
      </div>
    </PageTransition>
  )
} 
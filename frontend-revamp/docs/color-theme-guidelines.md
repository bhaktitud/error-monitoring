# Panduan Penggunaan Warna Tema

Dokumen ini memberikan panduan tentang penggunaan warna tema secara konsisten di seluruh aplikasi.

## Prinsip Utama

1. **Jangan gunakan warna hard-coded** seperti `text-gray-500`, `bg-blue-600`, dll.
2. **Selalu gunakan variabel tema** yang didefinisikan dalam file globals.css
3. **Ikuti contoh penggunaan warna** di komponen Footer, Header, dan Sidebar

## Variabel Tema Utama

Berikut ini adalah variabel tema utama yang tersedia:

### Warna Latar dan Teks

- `bg-background`: Warna latar belakang utama
- `text-foreground`: Warna teks utama
- `text-foreground/80`: Warna teks utama dengan opasitas 80%
- `text-foreground/60`: Warna teks utama dengan opasitas 60%

### Warna Sidebar

- `bg-sidebar`: Warna latar belakang sidebar
- `text-sidebar-foreground`: Warna teks di sidebar
- `border-sidebar-border`: Warna border sidebar
- `bg-sidebar-primary`: Warna aksen utama sidebar
- `text-sidebar-primary-foreground`: Warna teks di atas aksen sidebar
- `bg-sidebar-accent`: Warna aksen sekunder sidebar

### Warna Interaktif

- `bg-primary`: Warna utama untuk tombol dan elemen interaktif
- `text-primary-foreground`: Warna teks di atas elemen primary
- `bg-secondary`: Warna sekunder untuk tombol dan elemen interaktif
- `text-secondary-foreground`: Warna teks di atas elemen secondary
- `bg-accent`: Warna aksen untuk highlight atau hover state
- `text-accent-foreground`: Warna teks di atas aksen
- `bg-muted`: Warna yang dilemahkan untuk elemen yang kurang penting
- `text-muted-foreground`: Warna teks yang dilemahkan
- `bg-destructive`: Warna untuk aksi berbahaya atau error
- `text-destructive`: Warna teks untuk pesan error

### Border dan Input

- `border-border`: Warna border umum
- `bg-input`: Warna latar belakang input
- `ring-ring`: Warna focus ring

## Contoh Penggunaan

### Teks

- Teks utama: `text-foreground`
- Teks sekunder: `text-muted-foreground` atau `text-foreground/70`
- Teks error: `text-destructive`
- Teks di atas elemen berwarna: `text-primary-foreground`, `text-secondary-foreground`, dll.

### Latar Belakang

- Latar belakang utama: `bg-background`
- Latar belakang sidebar: `bg-sidebar`
- Latar belakang input: `bg-input` atau `bg-sidebar-accent/20`
- Latar belakang tombol primer: `bg-primary`
- Latar belakang tombol sekunder: `bg-secondary`
- Latar belakang kartu: `bg-card`
- Latar belakang hover: `hover:bg-accent`, `hover:bg-sidebar-accent`, dll.

### Border

- Border umum: `border-border`
- Border sidebar: `border-sidebar-border`
- Border input: `border-input`
- Border focus: `focus:border-ring`

## Status dan Notifikasi

### Badge Status

```jsx
// Badge untuk status
const statusVariants = {
  success: 'bg-primary/20 text-primary',
  warning: 'bg-accent/20 text-accent-foreground',
  error: 'bg-destructive/20 text-destructive',
  info: 'bg-muted text-muted-foreground',
};
```

## Tingkat Kecerahan dan Transparansi

Gunakan fraksional untuk menunjukkan kecerahan atau transparansi:

- `/100` - Sangat transparan (sangat terang)
- `/80` - Transparan (terang)
- `/60` - Setengah transparan (menengah)
- `/40` - Agak transparan (agak gelap)
- `/20` - Sedikit transparan (gelap)

Contoh: `text-foreground/60` (teks utama dengan 60% opasitas)

## Komponen Referensi

Komponen berikut dapat digunakan sebagai referensi untuk penggunaan warna:

- `Footer.tsx`: Contoh komponen dengan penggunaan warna yang baik untuk tata letak
- `Header.tsx`: Contoh komponen dengan penggunaan warna yang baik untuk navigasi
- `SidebarNav.tsx`: Contoh komponen dengan penggunaan warna yang baik untuk menu sidebar
- `ErrorCard.tsx`: Contoh komponen dengan penggunaan warna yang baik untuk kartu status 
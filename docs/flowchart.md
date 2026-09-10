# Dokumentasi Flowchart Aplikasi Nasku

## 1. Ringkasan Aplikasi

**Nasku** adalah aplikasi manajemen file NAS (Network-Attached Storage) berbasis web yang dirancang sebagai *command deck* bergaya dashboard NAS (terinspirasi Synology DSM). Aplikasi ini bersifat **responsif** — tampilan menyesuaikan untuk desktop maupun perangkat mobile (sidebar menciut menjadi *drawer* di mobile, tabel file berubah menjadi kartu).

### Halaman Utama

| Halaman | Rute | Fungsi |
| ------- | ---- | ------ |
| Home | `/` | Beranda, ringkasan penyimpanan dan akses cepat |
| My Files | `/files` | Jelajah folder & file (buat, ganti nama, pindah, hapus) |
| Sharing | `/sharing` | Kelola berbagi item dan mencabut akses |
| Activity | `/activity` | Riwayat aktivitas pengguna |
| Search | `/search?q=` | Pencarian file dan folder |

Seluruh halaman berada di belakang autentikasi **Internet Identity** (II). Pengguna yang belum masuk diarahkan ke layar login.

### Struktur Penyimpanan Backend (Motoko)

Backend dibangun dengan Motoko dan menyimpan data dalam satu state `FilesState` yang berisi empat koleksi utama:

| Koleksi | Tipe | Deskripsi |
| ------- | ---- | --------- |
| `folders` | `Map<FolderId, Folder>` | Folder dengan `id`, `name`, `parentId` (untuk hierarki), `owner`, `createdAt`, `updatedAt` |
| `files` | `Map<FileId, FileEntry>` | File dengan `id`, `name`, `folderId`, `owner`, `blob` (objek penyimpanan eksternal), `size`, `mimeType`, `createdAt`, `updatedAt` |
| `shares` | `Map<ShareId, Share>` | Berbagi item dengan `itemKind` (folder/file), `itemId`, `sharedBy`, `sharedWith`, `permission` (`#readOnly` / `#edit`), `createdAt` |
| `activity` | `List<ActivityEntry>` | Riwayat aktivitas dengan `action` (`#create`, `#rename`, `#move`, `#upload`, `#delete`, `#share`, `#revoke`, `#permissionChange`), `itemKind`, `itemId`, `itemName`, `atNs` |

Setiap operasi tulis (buat, ganti nama, pindah, unggah, hapus, berbagi, cabut) otomatis mencatat entri ke koleksi `activity` milik pemilik item. Kontrol akses memastikan hanya pemilik item atau pengguna yang diberi izin `#edit` yang dapat mengubah item, dan hanya pemilik yang dapat berbagi atau mencabut berbagi.

---

## 2. Flowchart Alur Utama

### 2.1 Alur Login (Internet Identity) hingga Beranda

```mermaid
flowchart TD
    A[Mulai: Pengguna membuka aplikasi Nasku] --> B{Sudah terautentikasi?}
    B -- Ya --> C[Memuat data beranda]
    B -- Tidak --> D[Tampilkan layar login]
    D --> E[Pengguna mengklik tombol Masuk]
    E --> F[Redirect ke Internet Identity II]
    F --> G[Pengguna login / mendaftar di II]
    G --> H{Autentikasi berhasil?}
    H -- Tidak --> I[Tampilkan pesan gagal login]
    I --> E
    H -- Ya --> J[II mengembalikan identity principal]
    J --> K[Simpan sesi login di aplikasi]
    K --> C
    C --> L[Redirect ke halaman Home]
    L --> M[Beranda ditampilkan: ringkasan penyimpanan & akses cepat]
    M --> N[Selesai]
```

### 2.2 Alur Jelajah Folder & File di My Files

Alur ini mencakup operasi **buat folder**, **ganti nama**, **pindah**, dan **hapus** pada halaman My Files.

```mermaid
flowchart TD
    A[Mulai: Buka halaman My Files] --> B[Muat isi folder saat ini]
    B --> C[Tampilkan daftar folder & file]
    C --> D{Pilih aksi}
    D -- Buat folder --> E[Input nama folder baru]
    E --> F[Panggil createFolder]
    F --> G{Parent valid & milik sendiri?}
    G -- Tidak --> H[Tampilkan error: folder induk tidak valid]
    H --> E
    G -- Ya --> I[Folder dibuat & aktivitas dicatat]
    I --> J[Muat ulang isi folder]
    J --> C
    D -- Ganti nama --> K[Pilih folder, input nama baru]
    K --> L[Panggil renameFolder]
    L --> M{Izin edit tersedia?}
    M -- Tidak --> N[Tampilkan error: tidak punya izin]
    N --> C
    M -- Ya --> O[Folder diganti nama & aktivitas dicatat]
    O --> J
    D -- Pindah --> P[Pilih folder, pilih folder tujuan]
    P --> Q[Panggil moveFolder]
    Q --> R{Folder tujuan valid & dapat diedit?}
    R -- Tidak --> S[Tampilkan error: tujuan tidak valid]
    S --> C
    R -- Ya --> T[Folder dipindahkan & aktivitas dicatat]
    T --> J
    D -- Hapus --> U[Konfirmasi hapus folder]
    U --> V{Pengguna mengonfirmasi?}
    V -- Tidak --> C
    V -- Ya --> W[Panggil deleteFolder]
    W --> X{Izin edit tersedia?}
    X -- Tidak --> Y[Tampilkan error: tidak punya izin]
    Y --> C
    X -- Ya --> Z[Folder beserta isi dihapus & aktivitas dicatat]
    Z --> J
```

### 2.3 Alur Unggah File dengan Progres & Penyimpanan

```mermaid
flowchart TD
    A[Mulai: Di halaman My Files, klik Unggah] --> B[Pilih file dari perangkat]
    B --> C[Validasi file terpilih]
    C --> D{File valid?}
    D -- Tidak --> E[Tampilkan error: file tidak valid]
    E --> B
    D -- Ya --> F[Tampilkan bar progres unggah]
    F --> G[Unggah blob ke penyimpanan eksternal]
    G --> H{Upload blob berhasil?}
    H -- Tidak --> I[Tampilkan error & bar progres gagal]
    I --> J[Pengguna dapat mencoba ulang]
    J --> F
    H -- Ya --> K[Panggil uploadFile dengan metadata]
    K --> L{Folder tujuan valid & dapat diedit?}
    L -- Tidak --> M[Tampilkan error: tidak dapat unggah ke folder]
    M --> F
    L -- Ya --> N[File disimpan & aktivitas dicatat]
    N --> O[Bar progres 100% / status sukses]
    O --> P[Perbarui ukuran penyimpanan terpakai]
    P --> Q[Muat ulang isi folder]
    Q --> R[Selesai]
```

### 2.4 Alur Berbagi Item & Mencabut Akses di Sharing

```mermaid
flowchart TD
    A[Mulai: Buka halaman Sharing] --> B[Muat daftar item yang dibagikan]
    B --> C[Tampilkan daftar berbagi]
    C --> D{Pilih aksi}
    D -- Bagikan item --> E[Pilih folder/file & pengguna tujuan]
    E --> F[Pilih izin: baca saja / edit]
    F --> G[Panggil shareItem]
    G --> H{Pengguna adalah pemilik item?}
    H -- Tidak --> I[Tampilkan error: hanya pemilik yang dapat berbagi]
    I --> C
    H -- Ya --> J[Berbagi dibuat & aktivitas dicatat]
    J --> K[Muat ulang daftar berbagi]
    K --> C
    D -- Cabut akses --> L[Pilih entri berbagi yang akan dicabut]
    L --> M[Konfirmasi mencabut akses]
    M --> N{Pengguna mengonfirmasi?}
    N -- Tidak --> C
    N -- Ya --> O[Panggil revokeShare]
    O --> P{Pengguna adalah pemberi berbagi?}
    P -- Tidak --> Q[Tampilkan error: hanya pemberi yang dapat mencabut]
    Q --> C
    P -- Ya --> R[Akses dicabut & aktivitas dicatat]
    R --> K
```

### 2.5 Alur Pencarian File di Search

```mermaid
flowchart TD
    A[Mulai: Buka halaman Search] --> B[Input kata kunci pencarian]
    B --> C{Input kosong?}
    C -- Ya --> D[Tampilkan state kosong / petunjuk]
    D --> B
    C -- Tidak --> E[Panggil searchFiles dengan kata kunci]
    E --> F[Backend memfilter folder & file yang dapat diakses]
    F --> G[Hasil dikembalikan: folder & file yang cocok]
    G --> H{Terdapat hasil?}
    H -- Tidak --> I[Tampilkan pesan tidak ada hasil]
    I --> B
    H -- Ya --> J[Tampilkan daftar hasil pencarian]
    J --> K{Pengguna mengklik hasil?}
    K -- Ya --> L[Navigasi ke folder / buka file]
    L --> M[Selesai]
    K -- Tidak --> B
```

### 2.6 Alur Riwayat Aktivitas di Activity

```mermaid
flowchart TD
    A[Mulai: Buka halaman Activity] --> B[Panggil getActivity dengan batas jumlah]
    B --> C[Backend memfilter aktivitas milik pengguna]
    C --> D[Urutkan aktivitas dari terbaru ke terlama]
    D --> E{Terdapat aktivitas?}
    E -- Tidak --> F[Tampilkan state kosong: belum ada aktivitas]
    F --> G[Selesai]
    E -- Ya --> H[Tampilkan daftar riwayat aktivitas]
    H --> I[Setiap entri menampilkan aksi, item, dan waktu]
    I --> J[Pengguna dapat memuat lebih banyak aktivitas]
    J --> K{Ada aktivitas berikutnya?}
    K -- Ya --> B
    K -- Tidak --> G
```

---

## 3. Catatan Teknis

- **Autentikasi**: Menggunakan Internet Identity (II). URL penyedia II disuntikkan dari lingkungan deployment dan tidak di-hardcode.
- **Kontrol akses**: Hanya pengguna dengan peran `user` yang dapat melakukan operasi. Pemilik item atau penerima izin `#edit` dapat mengubah item; hanya pemilik yang dapat berbagi/mencabut.
- **Penyimpanan file**: Blob file disimpan di penyimpanan objek eksternal (`Storage.ExternalBlob`), sedangkan metadata (nama, ukuran, tipe, lokasi) disimpan di state backend.
- **Riwayat aktivitas**: Setiap operasi tulis otomatis mencatat entri aktivitas dengan timestamp nanodetik (`atNs`), diurutkan terbaru ke terlama.
- **Responsif**: Sidebar menjadi *drawer* di mobile dan tabel file berubah menjadi kartu agar tetap produktif di layar kecil.

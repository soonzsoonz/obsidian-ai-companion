# AI Companion

【[English](../README.md) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Italiano](README.it.md) | [Português (BR)](README.pt-BR.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [हिन्दी](README.hi.md) | Indonesia】

Sebuah plugin Obsidian yang mengubah jurnal harian menjadi hubungan kerja dengan sebuah AI — praktis dan seukuran kehidupan nyata, bukan pelatih kebugaran.

Anda tetap menulis jurnal dengan cara yang sudah Anda lakukan, dan Anda membagikan tautan dari ponsel dengan cara yang sudah Anda lakukan. Plugin ini membaca keduanya, merespons dengan saran konkret, merangkum tautan menjadi laporan harian, dan perlahan-lahan membangun gambaran tentang siapa diri Anda sehingga bantuannya menjadi lebih tepat sasaran seiring waktu.

## Fitur

**Umpan balik jurnal** — Membaca apa yang Anda tulis dan menjawab dengan suara yang sesuai dengan subjeknya: 🫂 teman curhat untuk perselisihan, 🎒 guru untuk hal tentang anak Anda, 🔧 insinyur untuk sebuah bug. Setiap jawaban diawali dengan emoji dan nama dari suara tersebut, sehingga satu hari yang memuat ketiganya akan dibaca sebagai tiga balasan, bukan sekadar dinding teks. Suara mana yang berlaku untuk subjek apa merupakan tabel yang dapat diedit di pengaturan, begitu pula dengan emoji, nama, dan instruksi setiap suara.

**Ringkasan berita** — Bagikan postingan dari Threads, X, atau Facebook ke vault Anda dari ponsel, dan plugin ini akan melakukan sisanya: mendaftar tautan di bawah judul berbagi, lalu menulisnya dalam tiga bagian tetap — sumber, poin utama, mengapa itu penting. Dengan riset diaktifkan, ini mengambil setiap halaman dan merangkum apa yang sebenarnya dikatakan, bukan sekadar menebak dari judul. Orang-orang menyimpan sesuatu untuk digunakan di tempat kerja, untuk dicoba dalam karya mereka sendiri, untuk seseorang di keluarga, atau sekadar karena hal itu bagus — jadi baris ketiga menyatakan apa yang dapat Anda lakukan dengannya, dan tidak pernah menilainya.

**Laporan lengkap** — Ketika sebuah item layak mendapatkan lebih dari beberapa baris, AI menandainya dan menuliskannya dalam catatannya sendiri di folder hari itu — apa itu, bagaimana melakukannya, apa yang harus diwaspadai — mengutip metodenya secara verbatim sehingga dapat digunakan tanpa harus membuka kembali sumbernya. Entri ringkasan menautkannya ke sana. Dibatasi per proses, dan dapat dimatikan.

**Tabel fakta** — AI mengumpulkan fakta-fakta tahan lama tentang Anda (orang, proyek, tujuan, masalah yang berulang) di dalam sebuah catatan biasa yang dapat diedit. Setiap fitur lainnya membacanya sebelum menjawab. Fakta dinyatakan seperti kondisinya *sekarang* dan ditulis ulang saat ada perubahan, sehingga berkas tersebut tetap dapat dibaca setelah berbulan-bulan tanpa berubah menjadi log perubahan.

## Bagaimana suatu hari berjalan

1. Sepanjang hari, bagikan tautan dari ponsel Anda ke folder pendaratan.
2. Tulis jurnal Anda — cukup bagian Jurnal saja; sisanya diisikan untuk Anda.
3. Jalankan **Generate Digest**. Tautan yang dibagikan muncul di bawah judul berbagi, rangkuman di bawah judul ringkasan, dan catatan yang dibagikan berpindah ke arsip.
4. Jalankan **Generate Journal Feedback** saat Anda menginginkan respons terhadap apa yang telah Anda tulis.

Atau tetapkan jadwal dan biarkan langkah 3 dan 4 berjalan sendiri.

## Tata letak catatan harian

Anda memiliki bagian pertama dan ketiga; AI menulis bagian kedua dan keempat.

```markdown
## Jurnal
- apa yang Anda lakukan hari ini

## Umpan Balik AI
- (AI menulis di sini, dengan stempel waktu)

## Dibagikan Hari Ini
- (AI mencantumkan tautan yang Anda bagikan di sini)

## Ringkasan AI
- (AI menulis di sini, dengan stempel waktu)
```

Judul mengikuti pengaturan bahasa Obsidian, sehingga antarmuka bahasa Mandarin akan menulis `## 日誌`, `## AI回饋`, dan seterusnya. Catatan yang ditulis dalam satu bahasa tetap berfungsi dalam bahasa lain: pencocokan mengenali judul di setiap bahasa, dan bagian yang sudah ada mempertahankan judul apa pun yang telah dimilikinya tanpa ditulis ulang.

Bagian-bagian ditemukan berdasarkan judulnya, sehingga urutannya di dalam berkas Anda tidak masalah. Menjalankan ulang sebuah perintah akan menambahkan blok baru dengan stempel waktu tanpa menggantikan yang sebelumnya, sehingga beberapa proses dalam sehari akan terakumulasi. Apa pun di luar keempat judul ini tidak akan pernah disentuh.

## Tata letak folder

```
ai-companion/
  journal/              catatan harian; setiap hari dapat memiliki foldernya sendiri untuk laporan
  news/
    landing/            ← bagikan ke folder ini dari ponsel Anda
    archived/           tautan yang telah diproses dipindahkan ke sini
  memory/
    facts.md            apa yang AI ketahui tentang Anda — edit secara bebas
    _log.md             catatan hanya-tambah tentang kapan ini diperbarui
```

Setiap folder dapat dikonfigurasi dalam pengaturan. Semuanya dibuat saat plugin dimuat, sehingga folder pendaratan sudah ada sebelum Anda mencarinya di lembar berbagi seluler.

## Instalasi

Memerlukan Obsidian 1.5.0+ di desktop.

1. Unduh `main.js`, `manifest.json`, dan `styles.css` dari rilis terbaru.
2. Letakkan di `<vault>/.obsidian/plugins/ai-companion/`.
3. Aktifkan **AI Companion** di Pengaturan → Plugin Komunitas.
4. Tetapkan jalur CLI AI Anda di Pengaturan → AI Companion.

### Menyiapkan CLI

Plugin ini menyalurkan prompt Anda ke CLI AI lokal pada stdin dan membaca stdout-nya, sehingga perintah harus berjalan secara non-interaktif. Untuk Claude Code:

Pilih CLI Anda dari tarik-turun dan tanda non-interaktifnya akan diterapkan secara otomatis. Tetapkan jalur hanya jika executable tersebut tidak ada di `PATH` Anda.

| CLI | Status |
| --- | --- |
| Claude Code | Terverifikasi; prompt dikirim melalui stdin |
| Antigravity (`agy`) | Terverifikasi; prompt dilewatkan sebagai argumen |
| Codex (ChatGPT) | Ditawarkan tetapi belum diuji — mohon laporkan apa yang Anda temukan |

Jika perintah melaporkan tidak ada keluaran, CLI tersebut kemungkinan besar menginginkan sesi interaktif; periksa tanda di bawah Argumen ekstra.

### Membangun dari sumber

```bash
npm install
npm run build
```

## Perintah

Semua ini ada di palet perintah, dan di dalam menu di balik ikon pita.

| Perintah | Apa yang dilakukannya |
| --- | --- |
| New Journal Note | Membuat catatan hari ini dari templat dan membukanya |
| Generate Journal Feedback | Menjawab entri hari itu, dengan suara yang dibutuhkan pada setiap bagian |
| Generate Digest | Mendaftar tautan yang Anda bagikan dan menulis semuanya |
| Accumulate Facts | Memperbarui tabel fakta dari entri hari itu |
| Open Fact Table | Membuka `facts.md` untuk dibaca atau diperbaiki |
| Archive Processed Shares | Membersihkan sisa tautan berbagi yang telah diproses |

Perintah yang menulis ke catatan jurnal akan dinonaktifkan saat catatan non-jurnal sedang terbuka, sehingga perintah tersebut tidak pernah memengaruhi berkas yang tidak ingin Anda ubah.

## Pengaturan

- **AI** — pilih CLI Anda (Claude Code, Antigravity, Codex) dan tanda yang dibutuhkannya akan terisi; atau pilih Khusus. Plus jalur, argumen ekstra, model, batas waktu.
- **Suara** — tabel situasi → suara dan instruksi dari masing-masing suara. Setiap entri bawaan disetel ulang secara individual; tambahkan situasi dan suara Anda sendiri.
- **Jurnal** — folder, format tanggal, jalur templat (mendukung `{{date}}` dan `{{time}}`). Templat kustom harus mempertahankan keempat judul; itu adalah cara AI menemukan lokasi untuk menulis.
- **Berita** — folder pendaratan dan arsip, sakelar riset, retensi arsip dalam hari (0 menyimpan semuanya).
- **Jadwal** — manual (bawaan), saat terbuka, atau setiap N jam, dengan sakelar terpisah untuk apakah proses yang dijadwalkan akan menjalankan ringkasan, umpan balik, atau keduanya.
- **Fakta** — folder, dan sakelar pengaktifan (mati secara bawaan).
- **Tampilan** — gaya opsional untuk bagian plugin itu sendiri (kartu, tenang, majalah), mati secara bawaan dan terbatas hanya pada catatan jurnal. Gaya diterapkan pada Tampilan Membaca; setiap nilai berasal dari variabel CSS Obsidian, sehingga tema Anda tetap menjadi prioritas.

### Penjadwalan

Proses yang dijadwalkan hanya terjadi saat Obsidian sedang terbuka — plugin yang didukung CLI tidak memiliki proses latar belakang, dan jendela yang terlewatkan akan ditangani pada putaran berikutnya daripada dikejar.

Ringkasan cocok dengan jadwal, karena setiap proses menangani tautan berbagi baru mana pun yang tiba. Umpan balik jurnal dimatikan secara bawaan pada proses yang dijadwalkan: setiap proses akan menambahkan blok baru, sehingga menjalankannya enam kali sehari akan mengisi bagian tersebut dengan saran yang hampir sama.

## Privasi dan keamanan

Bacalah ini sebelum mengaktifkan apa pun.

- **Jurnal Anda dikirimkan ke penyedia AI.** Plugin ini memunculkan CLI AI lokal dan menyalurkan teks jurnal Anda kepadanya. Apa pun yang diteruskan oleh CLI tersebut — dan kepada siapa — diatur oleh alat tersebut, bukan oleh plugin ini. Jurnal mengandung rincian kesehatan dan masalah keluarga; putuskan secara matang.
- **AI menulis langsung ke vault Anda.** Tidak ada langkah konfirmasi. Ini hanya menulis bagian-bagian yang tercantum di atas, tetapi melakukannya tanpa bertanya.
- **Asal usul disimpan.** `memory/_log.md` hanya-tambah dan mencatat dari hari jurnal mana setiap pembaruan fakta berasal, sehingga Anda dapat memisahkan apa yang Anda tulis dari apa yang disimpulkan oleh AI.
- **Tabel fakta adalah milik Anda untuk diedit.** Jika AI mencatat sesuatu yang salah, buka dan perbaiki; proses berikutnya akan membaca versi koreksi Anda. Perhatikan bahwa AI menulis ulang seluruh berkas setiap kali, sehingga baris yang tidak didukung dalam jurnal Anda mungkin tidak akan bertahan.
- **Penjadwalan secara bawaan adalah manual.** Proses tanpa pengawasan yang menulis ke vault Anda seharusnya menjadi sebuah keputusan, bukan pengaturan bawaan.
- **Penghapusan arsip adalah pilihan** dan menggunakan tempat sampah sistem, sehingga dapat dipulihkan.
- **Hanya desktop.** Memunculkan CLI membutuhkan Node, sehingga ini tidak dapat berjalan di ponsel. Berbagi *ke* vault dari ponsel berfungsi dengan baik — itu sekadar Obsidian Sync.

## Internasionalisasi

Antarmuka tersedia dalam 21 bahasa, mengikuti pengaturan bahasa milik Obsidian: Arab, Jerman, Inggris, Spanyol, Persia, Prancis, Indonesia, Italia, Jepang, Korea, Belanda, Polandia, Portugis, Portugis (Brasil), Rusia, Thailand, Turki, Ukraina, Vietnam, Tionghoa (Sederhana), dan Tionghoa (Tradisional).

Terjemahan ada di `src/i18n/locales/`. Setiap bahasa di-type mengacu pada bahasa Inggris, sehingga kunci yang hilang akan menjadi kesalahan kompilasi dan bukannya cadangan senyap.

## Lisensi

MIT

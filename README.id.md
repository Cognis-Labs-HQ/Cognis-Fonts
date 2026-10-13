# Modul Font

Modul Font menyediakan pemilihan font, ukuran, pratinjau, dan pengaturan ulang dalam Pengaturan Cognis melalui preferensi host.

## Penggunaan

Aktifkan modul dan buka bagian Font. Pilih font yang tersedia dan ukuran 8 hingga 24 poin, lihat pratinjau, lalu simpan atau batalkan melalui bilah perubahan host.

## Spesifikasi teknis

### Pengaturan dan preferensi

Kontribusi pengaturan menggunakan kontrak sub-composer host. `fonts:preferences` meneruskan pemuatan dan penyimpanan ke `ui:reuse` → `ui-preferences.js` melalui alur milik modul `fonts:loadPreferences` dan `fonts:savePreferences`. Penyimpanan menggabungkan preferensi akun dan menerapkannya melalui host. Panggilan API akun, kunci penyimpanan, dan gaya shell tidak diduplikasi.

### Struktur kontributor dan kepemilikan host

Mulai modul baru dari [cognis-module-template](https://github.com/Cognis-Labs-HQ/cognis-module-template); repositori ini mengikuti revisi panduan yang dicatat dalam `AGENTS.md`. `bootstrap.js` mengatur siklus hidup, `api/index.js` menghubungkan dependensi ctx, `api/routes/<domain>/index.js` menangani HTTP, dan `api/reuse/` berisi kode server yang dipakai ulang. Fitur browser berada di `ui/`, gaya di `ui/styles/`, templat bersama di `ui/templates/`, dan dokumentasi terjemahan di `docs/index.<locale>.md`. Riwayat rilis berada di `docs/changelog/` dan dikecualikan dari hash paket. Bagian opsional yang tidak didukung tidak dibuat.

Gunakan kapabilitas ctx publik dan alur yang dideklarasikan; jangan mengimpor bagian internal Cognis atau modul lain. Penyedia kapabilitas dan navigasi dasbor mengekspor `mountProvider(scopedUiCtx)` dan mengembalikan fungsi pembersihan sumber daya miliknya. Impor tidak boleh mendaftarkan perilaku modul. Host menghapus kapabilitas, kait alur, listener, dan status penyedia saat dinonaktifkan, lalu memasang kembali penyedia yang tersimpan saat diaktifkan ulang. Pabrik pengaturan, administrasi, dan penyedia deskriptor footer autentikasi mengikuti kontrak host masing-masing. Uji kontrak dengan pengganti mandiri, jalankan pemeriksaan struktur, perbarui hash setelah perubahan paket terakhir, lalu jalankan lint, pengujian, dan validasi manifes sebelum publikasi.

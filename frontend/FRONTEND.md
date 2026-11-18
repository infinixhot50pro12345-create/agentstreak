# AgentStreak — Frontend

Halaman statis, satu layar, tanpa library. Hanya butuh `index.html` dan `app.js`. Semua pembacaan
chain terjadi di browser pengunjung lewat wallet mereka sendiri.

> **Lokasi file:** `index.html` dan `app.js` berada di **akar repo** (`/index.html`, `/app.js`),
> bukan di folder `frontend/`. Itu syarat GitHub Pages dengan source "main / (root)". Dokumen ini
> (`frontend/FRONTEND.md`) tetap di folder `frontend/` sebagai dokumentasi — tidak dipakai situs.
> Semua path di bawah mengacu ke akar repo.

Status per 2026-11-18: kontrak **belum di-deploy**, jadi `CONTRACT_ADDRESS` masih alamat nol dan
halaman menampilkan banner "Kontrak belum di-deploy — segera hadir" dengan tombol check-in mati.

---

## 1. Jalankan di lokal

Buka langsung:

```
xdg-open index.html      # Linux
open index.html          # macOS
```

Atau lewat static server (lebih mirip kondisi hosting, dan menghindari batasan `file://` di
beberapa browser) — jalankan dari **akar repo** supaya `/app.js` ikut tersaji:

```
# dari akar repo (folder yang berisi index.html dan app.js)
python3 -m http.server 8000
# buka http://localhost:8000
```

Catatan: tanpa `window.ethereum` (browser biasa, bukan dApp browser wallet) halaman akan menampilkan
banner "Wallet tidak terdeteksi". Itu perilaku yang benar, bukan bug. Untuk uji interaktif penuh,
buka dari dApp browser wallet (lihat bagian 4).

## 2. Publikasikan di GitHub Pages

Repo: `infinixhot50pro12345-create/agentstreak` (dibuat oleh user, bukan oleh agen).

1. `index.html` dan `app.js` harus berada di **akar repo** (bukan di dalam subfolder `frontend/`).
   Di repo ini keduanya sudah di akar, jadi tidak ada yang perlu dipindah lagi. Folder
   `frontend/` hanya berisi dokumen ini dan tidak memengaruhi situs.
2. GitHub → repo → **Settings** → **Pages**.
3. **Source: Deploy from a branch** → **Branch: `main`** → folder **`/ (root)`** → **Save**.
4. Tunggu 1–2 menit. Alamatnya: `https://infinixhot50pro12345-create.github.io/agentstreak/`.
5. Uji di desktop dulu: halaman harus memuat tanpa error, dan (karena kontrak masih nol) banner
   "Kontrak belum di-deploy" harus muncul.

Kalau repo-nya private, GitHub Pages butuh paket berbayar — pakai repo **public**.

## 3. Setelah kontrak di-deploy — yang harus diisi

Semua konfigurasi ada di **baris paling atas `app.js` di akar repo** (`/app.js`):

```js
var CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // ganti dengan alamat AgentStreak
var DEPLOY_BLOCK = 0;                                                  // ganti dengan blok deploy
```

- `CONTRACT_ADDRESS` — alamat kontrak AgentStreak hasil deploy di BNB Chain (chain 56).
- `DEPLOY_BLOCK` — nomor blok tempat kontrak di-deploy. Ambil dari halaman transaksi deploy di
  BscScan ("Block" pada detail transaksi) atau dari output `forge script` / Remix. Ini titik awal
  pembacaan event leaderboard; kalau diisi 0 halaman tetap jalan, tapi `eth_getLogs` akan memindai
  seluruh riwayat chain dan sebagian RPC akan menolak.

Setelah mengubah, commit + push ke `main`; GitHub Pages otomatis memperbarui (1–2 menit).
`AGENT_ID_ADDRESS` dan `BSC_CHAIN_ID` tidak perlu diubah.

Selama `CONTRACT_ADDRESS` masih nol, halaman **tidak** mengklaim kontrak live: banner peringatan
tampil, tombol check-in berlabel "Kontrak Belum Deploy" dan nonaktif, leaderboard menampilkan
"Leaderboard aktif setelah kontrak di-deploy."

## 4. Uji di HP

1. Buka halaman GitHub Pages **dari dApp browser di dalam wallet** (bukan Chrome/Safari biasa) —
   wallet yang mendukung BNB Chain dan menyuntikkan `window.ethereum`.
2. Tekan **Hubungkan Wallet** → setujui di wallet.
3. Kalau wallet di jaringan lain: banner kuning muncul + tombol **Ganti ke BNB Chain**. Kalau wallet
   belum mengenal chain 56, tambahkan manual di pengaturan wallet (RPC publik BNB Chain).
4. Status **Agent ID** harus "Pemegang Agent ID" untuk wallet yang memegang Agent ID
   (`balanceOf > 0`). Wallet tanpa Agent ID akan melihat "Tidak memegang Agent ID" dan tombol
   check-in mati.
5. Tekan **Check-in Hari Ini** → wallet menampilkan layar konfirmasi transaksi. Periksa:
   tujuan = alamat kontrak, nilai = 0, data hanya pemanggilan `checkIn()`. Setujui.
6. Setelah konfirmasi blok, pesan sukses muncul dan angka streak/total ikut berubah.

Check-in hanya bisa sekali per hari UTC. Batas hari berganti pukul **00:00 UTC = 07:00 WIB**.

## 5. Hal-hal teknis (untuk Dicek Kalau Ada Masalah)

### Selector dan topik event — diverifikasi dengan `cast` (foundry 1.9.0)

Perintah: `export PATH="$HOME/.foundry/bin:$PATH"` lalu `cast sig "<signature>"`.

| Fungsi | Signature | Selector |
|---|---|---|
| Check-in | `checkIn()` | `0x183ff085` |
| Streak saat ini | `streakOf(address)` | `0x4fc1854a` |
| Bisa check-in hari ini | `canCheckInToday(address)` | `0x591ff3e0` |
| Hari check-in terakhir | `lastCheckInDay(address)` | `0xc483da22` |
| Total check-in | `totalCheckIns(address)` | `0x828e1ffd` |
| Streak terpanjang | `longestStreak(address)` | `0xde96303b` |
| Hari UTC saat ini | `currentDay()` | `0x5c9302c9` |
| Saldo Agent ID | `balanceOf(address)` | `0x70a08231` |

Topik event (keccak256, `cast keccak "CheckIn(address,uint256,uint256,uint256)"`):

```
0xf70c8ccfb49937cb9079ffa719be60366bdb8f901313f28dd3da4e482977a7fa
```

Encoding panggilan dibuat manual: selector + alamat di-pad 32 byte. Hasilnya dicocokkan dengan
`cast calldata`:

```
cast calldata "streakOf(address)" 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F
# 0x4fc1854a00000000000000000000000060b9262456de011f7d15a54cdd8c48baaa8b022f
```

### RPC yang dipakai

Hanya provider wallet (`window.ethereum`), tanpa endpoint tambahan:

`eth_requestAccounts`, `eth_accounts`, `eth_chainId`, `wallet_switchEthereumChain`, `eth_call`,
`eth_sendTransaction`, `eth_getTransactionReceipt`, `eth_blockNumber`, `eth_getLogs`.

### Transaksi check-in

Satu transaksi saja: `{ from: <akun>, to: <CONTRACT_ADDRESS>, data: "0x183ff085", value: "0x0" }`.
Tidak ada approval, tidak ada `approve`/`transfer`, tidak ada nilai BNB terkirim. Konfirmasi tetap
di layar wallet — halaman tidak pernah menandatangani apa pun sendiri.

### Leaderboard

Event `CheckIn` diambil dengan `eth_getLogs` (alamat kontrak, `fromBlock = DEPLOY_BLOCK`,
`toBlock = latest`, `topics = [eventTopic]`). Untuk setiap address diambil event dengan hari
terbesar sebagai streak terbaru, lalu diurutkan menurun dan ditampilkan 10 teratas.
Alamat selalu dipotong (`0x1234…abcd`); halaman tidak melakukan pencarian nama wallet dan tidak
menampilkan data di luar chain.

Kalau RPC membatasi rentang blok, halaman otomatis mengecilkan ukuran potongan sampai permintaan
diterima (maksimal 80 permintaan). Kalau `eth_getLogs` tetap gagal, muncul "Belum ada data" beserta
satu baris info teknis di halaman.

## 6. Batasan yang diketahui

- **Tanpa WalletConnect.** Hanya injected provider, jadi halaman harus dibuka dari dApp browser
  wallet. Di browser desktop biasa, halaman tetap tampil tapi tidak bisa membaca/mengirim apa pun.
- **Leaderboard bergantung pada `eth_getLogs`.** Sebagian wallet/RPC membatasi atau memblokirnya;
  halaman menampilkan "Belum ada data", bukan error mentah, dan bagian lain tetap berfungsi.
- **Butuh BNB untuk gas.** Check-in gratis biaya kontrak, tapi transaksi tetap membayar gas jaringan.
  Wallet tanpa BNB akan gagal saat broadcast (pesan: "Saldo BNB tidak cukup untuk gas").
- **Batas hari mengikuti UTC** dari `block.timestamp` kontrak, bukan jam HP. Angka "hari ke-N" di
  halaman adalah nilai on-chain; sebelum wallet terhubung, halaman menampilkan perkiraan dari jam
  perangkat (ditandai "perkiraan").
- **Tombol check-in tidak menghitung ulang batas hari secara real time.** Halaman memuat ulang status
  setelah transaksi, saat akun/jaringan berubah, atau saat halaman dibuka ulang. Kalau halaman
  dibiarkan terbuka melewati 00:00 UTC, tekan muat ulang untuk memperbarui status.
- **Belum diuji di perangkat asli.** Verifikasi lokal hanya: `node --check app.js` (sintaks, dijalankan
  dari akar repo), uji
  encoding/decoding di Node, dan simulasi DOM + provider palsu. Uji di HP dengan wallet nyata tetap
  wajib sebelum launch.
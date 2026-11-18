# AgentStreak

Check-in harian gratis untuk pemegang **Agent ID** di **BNB Chain** (chain id 56).
Sekali sehari, streak tercatat on-chain. Tanpa token, tanpa biaya, hanya gas.

> **Status: kontrak BELUM di-deploy.** Alamat kontrak masih *TBD* (dijadwalkan deploy
> 20 November 2026). Selama alamat masih kosong, situs menampilkan banner
> "Kontrak belum di-deploy" dan tombol check-in nonaktif — halaman tidak mengklaim
> apa pun yang belum ada.

---

## Apa itu AgentStreak

AgentStreak adalah dApp satu halaman: pemegang Agent ID memanggil `checkIn()` sekali per
hari UTC. Kontrak mencatat streak berjalan, streak terpanjang, dan total check-in per
alamat. Semua angka bisa dibaca siapa saja langsung dari chain, dan daftar 10 streak
teratas ditampilkan di halaman sebagai leaderboard.

Agent ID adalah satu-satunya gerbang akses: hanya alamat dengan `balanceOf > 0` pada
kontrak Agent ID yang bisa check-in. Karena Agent ID non-transferable, streak terikat ke
identitas on-chain yang tetap dan tidak bisa dipindah ke wallet lain untuk di-farm.

## Cara kerjanya

1. **Gerbang identitas** — `checkIn()` memanggil `balanceOf` pada kontrak Agent ID dan
   revert (`AgentStreak: no Agent ID`) kalau alamat tidak memegang Agent ID.
2. **Satu kali per hari UTC** — batas hari adalah `block.timestamp / 86400`, bukan jam HP.
   Check-in kedua di hari yang sama revert (`AgentStreak: already checked in today`).
   Hari berganti pukul **00:00 UTC = 07:00 WIB**.
3. **Streak** — naik +1 kalau hari sebelumnya juga check-in, reset ke 1 kalau ada hari
   yang terlewat. `longestStreak` menyimpan rekor tertinggi dan tidak ikut reset.
4. **Hanya gas** — transaksi `checkIn()` bernilai **0 BNB**, tanpa approval, tanpa deposit.
   Kontrak tidak menyimpan dana siapa pun.

Kontrak sengaja dibuat minimal: **tanpa owner, tanpa admin, tanpa fee, tanpa token, tanpa
upgradeability, tanpa pause**. Satu-satunya ketergantungan eksternal adalah pembacaan
`balanceOf` dari kontrak Agent ID resmi — read-only, tidak pernah memanggil transfer.

## Status kontrak

| Item | Status |
|---|---|
| Source + test | Selesai — `contracts/src/AgentStreak.sol`, `forge test`: 7 passed |
| Build | Selesai — runtime 1.600 byte, deploy gas 398.657 (diukur lokal) |
| Input verifikasi BscScan | Siap — `contracts/verify/` dan `contracts/flattened/` |
| **Deploy mainnet** | **Belum** — direncanakan 20 November 2026 |
| **Alamat kontrak** | **TBD** — diisi setelah deploy |
| Verifikasi BscScan | Belum — dilakukan manual di browser setelah deploy |
| Situs live | Belum — menunggu GitHub Pages diaktifkan |

## Struktur repo

```
/
├── index.html              # situs (akar repo — syarat GitHub Pages "main / root")
├── app.js                  # logika situs, tanpa dependency
├── README.md               # dokumen ini
├── LICENSE                 # MIT
├── SUBMISSION.md           # persiapan submission (belum disubmit)
├── PUSH-MANIFEST.md        # rencana upload file ke GitHub
├── contracts/
│   ├── src/AgentStreak.sol             # kontrak
│   ├── test/AgentStreak.t.sol          # 7 test
│   ├── test/MockAgentID.sol            # mock khusus test
│   ├── script/DeployAgentStreak.s.sol  # script deploy (simulasi saja)
│   ├── flattened/AgentStreak.flattened.sol      # untuk Remix / verifikasi
│   ├── verify/AgentStreak.standard-input.json   # input verifikasi byte-exact
│   ├── DEPLOY.md                       # gas, selector, cara deploy + verifikasi
│   └── foundry.toml
└── frontend/
    └── FRONTEND.md         # dokumentasi frontend (bukan bagian situs)
```

`index.html` dan `app.js` ada di akar karena GitHub Pages menyajikan dari root branch
`main`. Folder `frontend/` hanya berisi dokumentasi.

## Jalankan situs secara lokal

Tanpa build, tanpa dependency. Cukup buka `index.html`, atau sajikan lewat static server
dari akar repo:

```bash
# dari akar repo (folder yang berisi index.html dan app.js)
python3 -m http.server 8000
# buka http://localhost:8000
```

Catatan: halaman memakai `window.ethereum` (injected provider), jadi untuk mencoba
connect wallet dan check-in, buka dari **dApp browser di dalam wallet** yang mendukung
BNB Chain — bukan dari browser desktop biasa. Di browser biasa halaman tetap tampil, tapi
menampilkan "Wallet tidak terdeteksi". Tidak ada WalletConnect.

Detail teknis frontend (selector, topik event, batasan): [`frontend/FRONTEND.md`](frontend/FRONTEND.md).

## Deploy dan verifikasi kontrak

Langkah lengkap — bytecode, biaya gas, opsi Remix/Foundry, dan prosedur verifikasi
BscScan — ada di **[`contracts/DEPLOY.md`](contracts/DEPLOY.md)**.

Ringkasnya:

1. Deploy `AgentStreak` (tanpa constructor args, tanpa value) ke BNB Chain chain 56.
2. Catat alamat kontrak dan nomor blok deploy.
3. Isi dua baris di paling atas `app.js`:
   ```js
   var CONTRACT_ADDRESS = "0x..."; // alamat hasil deploy
   var DEPLOY_BLOCK = 0;           // nomor blok deploy
   ```
4. Verifikasi source di BscScan memakai `contracts/verify/AgentStreak.standard-input.json`
   (route Standard-Json-Input, compiler 0.8.20, optimizer on / 200 runs, evmVersion paris).

> Jangan pernah menjalankan `forge script --broadcast` dari repo ini. Deploy dilakukan
> manual oleh pemilik wallet setelah parameter dikonfirmasi.

## Tautan

- Pengumuman hackathon: <https://www.binance.com/en/square/post/389517345917641>
- Kontrak Agent ID (BNB Chain): [`0x60b9262456de011f7d15a54cdd8c48baaa8b022f`](https://bscscan.com/address/0x60b9262456de011f7d15a54cdd8c48baaa8b022f)

## Catatan jujur

- **Tidak ada token.** AgentStreak tidak menerbitkan token dan tidak menjual apa pun.
- **Tidak ada biaya.** Selain gas jaringan, tidak ada pembayaran ke kontrak atau ke
  pengembang. Tidak ada deposit, tidak ada approval.
- **Tidak ada janji penghasilan.** Check-in tidak menghasilkan uang, reward, airdrop,
  atau imbalan finansial apa pun. Hasilnya hanya catatan streak on-chain yang bisa dibaca
  publik.
- **Bukan produk Binance.** Proyek ini ikut serta dalam hackathon yang diselenggarakan
  Binance; nama hackathon disebut sebagai konteks, bukan sebagai afiliasi atau
  endorsement.
- **Masih awal.** Kontrak belum di-deploy, situs belum live, dan belum ada pengguna.
  Proyek ini kecil dengan sengaja — satu kontrak, satu halaman, tanpa dependency.

---

## English summary

**AgentStreak** is a free daily check-in dApp for **Agent ID** holders on **BNB Chain**
(chain id 56). A holder calls `checkIn()` once per UTC day; the contract records the
current streak, longest streak, and total check-ins on-chain, readable by anyone.

Agent ID is the sole access gate: `checkIn()` reads `balanceOf` on the Agent ID contract
and reverts for addresses that do not hold one. Because Agent ID is non-transferable, a
streak is bound to a persistent on-chain identity and cannot be moved to another wallet to
farm it.

The contract has **no owner, no admin, no fee, no token, and no upgradeability**, and holds
no user funds — check-in costs gas only. The **contract is not deployed yet** (planned
20 November 2026; address TBD); until the address is filled in, the site explicitly shows
a not-deployed state. Deployment and BscScan verification steps are in
[`contracts/DEPLOY.md`](contracts/DEPLOY.md).

There is no token, no fee, and no earnings promise. Not a Binance product — participating
in the Binance hackathon.

## License

MIT — see [`LICENSE`](LICENSE).
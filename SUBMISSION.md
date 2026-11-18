# AgentStreak — Submission Prep

> **Status: BELUM DISUBMIT.** Dokumen ini disiapkan sebagai bahan submission.
> Submission ditargetkan **9 Desember 2026, sebelum 15:00**. Jangan submit sebelum
> semua item di checklist §5 terpenuhi — terutama alamat kontrak yang sudah
> di-deploy dan diverifikasi.

---

## 1. Data proyek

| Field | Value |
|---|---|
| Project name | **AgentStreak** |
| One-line pitch | Free daily check-in streak tracker for Agent ID holders on BNB Chain — once a day, gas only. |
| Website | <https://infinixhot50pro12345-create.github.io/agentstreak/> — *pending: GitHub Pages belum diaktifkan* |
| Contract address | **TBD** — diisi setelah deploy 20 Nov 2026 (BNB Chain, chain id 56) |
| Chain | BNB Smart Chain mainnet (chain id 56) |
| Repo | <https://github.com/infinixhot50pro12345-create/agentstreak> (public) |
| X / social post | **TBD** — link post komunitas (lihat checklist §5) |
| Award target | **Innovation Award** (utama); **Pioneer Award** sebagai stretch |

## 2. Agent ID usage description (English, untuk form)

> AgentStreak uses Agent ID as its sole access gate and identity layer: `checkIn()` calls
> `balanceOf` on the Agent ID contract and reverts for any address that does not hold one.
> Because Agent ID is non-transferable, a streak is bound to a persistent on-chain identity
> and cannot be moved to another wallet to farm it. Holding an Agent ID is the only
> requirement — there is no token, no payment, and no admin.

*(Disalin dari draft di `PLAN.md`. Kontrak Agent ID: `0x60b9262456de011f7d15a54cdd8c48baaa8b022f`.)*

## 3. Ringkasan proyek (untuk form / deskripsi)

AgentStreak adalah dApp check-in harian gratis untuk pemegang Agent ID di BNB Chain.
Pemegang memanggil `checkIn()` sekali per hari UTC; hanya gas, tanpa biaya, tanpa token.
Kontrak mencatat streak berjalan, streak terpanjang, dan total check-in per alamat —
semuanya bisa dibaca on-chain dan ditampilkan sebagai leaderboard 10 teratas.

Kontrak sengaja minimal: **tanpa owner, tanpa admin, tanpa fee, tanpa token, tanpa
upgradeability, tanpa pause**, dan tidak menyimpan dana siapa pun. Satu-satunya ketergantungan
eksternal adalah pembacaan `balanceOf` dari kontrak Agent ID resmi — read-only.

## 4. Status kesiapan per 18 Nov 2026

| Komponen | Status |
|---|---|
| Kontrak + 7 test (`forge test`) | ✅ Selesai, lolos |
| Input verifikasi BscScan | ✅ Siap (`contracts/verify/`, `contracts/flattened/`) |
| Frontend + dokumen | ✅ Selesai, tanpa dependency |
| Situs live di GitHub Pages | ⬜ Belum — perlu upload + enable Pages |
| Kontrak deploy + verified | ⬜ Belum — rencana 20 Nov 2026 |
| 30+ alamat Agent ID berinteraksi | ⬜ Belum — target 25 Nov – 8 Des |
| Post X / komunitas | ⬜ Belum — draft ada di `x-draft.txt` (internal) |

## 5. Checklist sebelum submit

Wajib — submission tidak layak tanpa ini:

- [ ] **Kontrak sudah di-deploy** ke BNB Chain (chain 56) dan **alamatnya dicatat**
      → isi ke §1 dan ke `CONTRACT_ADDRESS` + `DEPLOY_BLOCK` di `app.js`.
- [ ] **Source terverifikasi di BscScan** (route Standard-Json-Input, compiler 0.8.20,
      optimizer on / 200 runs, evmVersion paris, tanpa constructor args).
      Langkah: `contracts/DEPLOY.md` §7a.
- [ ] **Situs live** di <https://infinixhot50pro12345-create.github.io/agentstreak/>
      (Settings → Pages → main / root). Uji halaman memuat tanpa error dan **tidak**
      menampilkan banner "belum di-deploy".
- [ ] **Minimal 30 alamat Agent ID unik** benar-benar memanggil `checkIn()` (bukan wallet
      kosong, bukan hasil rekayasa volume). Cek lewat leaderboard / event `CheckIn`.
- [ ] **Link post X** untuk survei komunitas — post dari akun sendiri, lalu salin URL-nya
      ke §1.
- [ ] **Alamat kontrak di §1 diisi** dan konsisten dengan yang ada di situs.
- [ ] Uji ulang di HP dari dApp browser wallet: connect, status Agent ID, check-in, streak.

Sebaiknya:

- [ ] Uji satu check-in nyata dari wallet pemilik untuk memastikan end-to-end jalan.
- [ ] Pastikan tidak ada klaim token / fee / penghasilan di halaman, README, atau post.
- [ ] Simpan tx hash deploy + hash verifikasi untuk lampiran.

## 6. Yang TIDAK diklaim

Supaya konsisten dengan isi repo dan halaman:

- Tidak ada token, tidak ada penjualan, tidak ada airdrop.
- Tidak ada biaya selain gas jaringan; tidak ada deposit atau approval.
- Tidak ada janji penghasilan, reward, atau "passive income".
- AgentStreak **bukan produk Binance** dan tidak berafiliasi dengan Binance; proyek ini
  hanya ikut serta dalam hackathon yang mereka selenggarakan.
- Inovasi yang diklaim terbatas: mekanik check-in/streak adalah pola lama; kebaruannya
  hanya konteks identitas Agent ID yang non-transferable. Tidak ada klaim lebih.

## 7. Catatan strategi (jujur)

- Peluang terkuat ada di **Innovation** lewat eksekusi rapi dan produk yang benar-benar
  hidup, bukan lewat kebaruan ide.
- **Pioneer** sebagai stretch: butuh 30+ alamat unik; volume transaksi hampir nol karena
  hanya +1 tx/hari/orang.
- Kalau per 8 Des target 30 alamat belum tercapai, **submit apa adanya dengan angka riil**.
  Submission jujur dengan produk live lebih baik daripada klaim yang dibesar-besarkan.
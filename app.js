/*
 * AgentStreak — frontend tanpa dependency.
 * Hanya memakai window.ethereum (injected provider) dari wallet.
 *
 * Tidak ada transaksi otomatis. Tombol check-in mengirim SATU transaksi
 * (checkIn, value 0) dan konfirmasi tetap di layar wallet.
 */

// ======== KONFIGURASI — ISI SETELAH KONTRAK DI-DEPLOY ========
var CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
var DEPLOY_BLOCK = 0; // nomor blok deploy AgentStreak (dari BscScan / output forge)
// ============================================================

var AGENT_ID_ADDRESS = "0x60b9262456de011f7d15a54cdd8c48baaa8b022f";
var BSC_CHAIN_ID = 56;
var BSC_CHAIN_ID_HEX = "0x38";
var ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
var SECONDS_PER_DAY = 86400;

// Selector dihitung dengan `cast sig` (foundry 1.9.0) — lihat FRONTEND.md.
var SEL = {
  checkIn: "0x183ff085",          // checkIn()
  streakOf: "0x4fc1854a",         // streakOf(address)
  canCheckInToday: "0x591ff3e0",  // canCheckInToday(address)
  lastCheckInDay: "0xc483da22",   // lastCheckInDay(address)
  totalCheckIns: "0x828e1ffd",    // totalCheckIns(address)
  longestStreak: "0xde96303b",    // longestStreak(address)
  currentDay: "0x5c9302c9",       // currentDay()
  balanceOf: "0x70a08231"         // balanceOf(address)
};

// keccak256("CheckIn(address,uint256,uint256,uint256)")
var CHECKIN_TOPIC = "0xf70c8ccfb49937cb9079ffa719be60366bdb8f901313f28dd3da4e482977a7fa";

// Sebagian RPC membatasi rentang blok untuk eth_getLogs. Kalau satu permintaan
// gagal, rentangnya dibelah dua terus sampai berhasil (dengan batas bawah
// LOG_MIN_SPAN dan anggaran total permintaan LOG_MAX_CALLS).
var LOG_MIN_SPAN = 16;
var LOG_MAX_CALLS = 80;

// ---- state ----
var state = {
  account: null,
  chainId: null,
  agentIdBalance: null,   // BigInt atau null
  streak: null,
  longest: null,
  total: null,
  canCheckIn: null,
  currentDay: null,
  busy: false
};

// ---- elemen ----
function el(id) { return document.getElementById(id); }

var ui = {};

function cacheEls() {
  ui.connectBtn = el("connectBtn");
  ui.walletInfo = el("walletInfo");
  ui.walletAddr = el("walletAddr");
  ui.agentIdStatus = el("agentIdStatus");
  ui.walletMsg = el("walletMsg");
  ui.statStreak = el("statStreak");
  ui.statLongest = el("statLongest");
  ui.statTotal = el("statTotal");
  ui.checkInBtn = el("checkInBtn");
  ui.checkInMsg = el("checkInMsg");
  ui.todayInfo = el("todayInfo");
  ui.boardBox = el("boardBox");
  ui.deployBanner = el("deployBanner");
  ui.networkBanner = el("networkBanner");
  ui.providerBanner = el("providerBanner");
  ui.switchChainBtn = el("switchChainBtn");
  ui.contractAddr = el("contractAddr");
}

// ---- helper ----
function isZeroAddress(addr) {
  return !addr || String(addr).toLowerCase() === ZERO_ADDRESS;
}

function contractReady() {
  return !isZeroAddress(CONTRACT_ADDRESS);
}

function shortAddr(addr) {
  if (!addr) return "—";
  var a = String(addr);
  if (a.length < 12) return a;
  return a.slice(0, 6) + "…" + a.slice(-4);
}

function showMsg(node, kind, text) {
  if (!node) return;
  node.className = "msg" + (kind ? " " + kind : "");
  node.textContent = text || "";
}

function clearMsg(node) {
  if (!node) return;
  node.className = "msg";
  node.textContent = "";
}

function showBanner(node, show) {
  if (!node) return;
  if (show) node.classList.add("show");
  else node.classList.remove("show");
}

// Wallet kadang mengirim error dengan .message berbahasa Inggris.
// Terjemahkan kasus umum ke kalimat Indonesia yang jelas.
function friendlyError(err, fallback) {
  var raw = "";
  if (err) {
    if (typeof err === "string") raw = err;
    else if (err.message) raw = err.message;
    else if (err.data && err.data.message) raw = err.data.message;
    else raw = String(err);
  }
  var low = raw.toLowerCase();

  if (err && (err.code === 4001 || low.indexOf("user rejected") >= 0 || low.indexOf("user denied") >= 0 || low.indexOf("rejected by user") >= 0 || low.indexOf("denied transaction") >= 0)) {
    return "Transaksi dibatalkan di wallet. Tidak ada yang terkirim.";
  }
  if (low.indexOf("insufficient funds") >= 0) {
    return "Saldo BNB tidak cukup untuk gas. Isi sedikit BNB lalu coba lagi.";
  }
  if (low.indexOf("chain") >= 0 && low.indexOf("disconnect") >= 0) {
    return "Jaringan wallet terputus. Periksa jaringan di wallet lalu coba lagi.";
  }
  if (low.indexOf("execution reverted") >= 0) {
    if (low.indexOf("no agent id") >= 0) return "Wallet ini tidak memegang Agent ID, jadi tidak bisa check-in.";
    if (low.indexOf("already checked in") >= 0) return "Kamu sudah check-in hari ini (UTC). Coba lagi setelah 00:00 UTC.";
    return "Transaksi ditolak oleh kontrak. Kemungkinan syarat check-in belum terpenuhi.";
  }
  if (low.indexOf("no agent id") >= 0) return "Wallet ini tidak memegang Agent ID, jadi tidak bisa check-in.";
  if (low.indexOf("already checked in") >= 0) return "Kamu sudah check-in hari ini (UTC). Coba lagi setelah 00:00 UTC.";
  if (low.indexOf("network") >= 0 && low.indexOf("error") >= 0) return "Gagal menghubungi jaringan. Periksa koneksi internet lalu coba lagi.";
  if (low.indexOf("not supported") >= 0 || low.indexOf("does not support") >= 0 || low.indexOf("unsupported method") >= 0) {
    return "Wallet/RPC ini tidak mendukung permintaan tersebut.";
  }
  return fallback || ("Terjadi kesalahan. Detail: " + (raw || "tidak diketahui"));
}

function setBusy(busy) {
  state.busy = busy;
  if (ui.connectBtn) ui.connectBtn.disabled = busy;
  if (ui.switchChainBtn) ui.switchChainBtn.disabled = busy;
  updateCheckInButton();
}

// ---- ABI encoding minimal ----
function pad32(hexNo0x) {
  var h = hexNo0x;
  while (h.length < 64) h = "0" + h;
  return h;
}

function encodeCallSelectorOnly(selector) {
  return selector;
}

function encodeCallAddress(selector, address) {
  var a = String(address).toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{40}$/.test(a)) throw new Error("Alamat tidak valid");
  return selector + pad32(a);
}

function parseUint(hex) {
  if (!hex || typeof hex !== "string" || hex === "0x") return null;
  try { return BigInt(hex); } catch (e) { return null; }
}

function shortHex(hex) {
  // RPC bisa balas 0x atau 32 byte. Ambil 32 byte terakhir per konvensi ABI.
  if (!hex || typeof hex !== "string") return null;
  var h = hex.replace(/^0x/, "");
  if (h.length === 0) return null;
  if (h.length > 64) h = h.slice(-64);
  return "0x" + h;
}

function uintToDisplay(v) {
  if (v === null || v === undefined) return "—";
  return v.toString();
}

// ---- provider ----
function getProvider() {
  return (typeof window !== "undefined" && window.ethereum) ? window.ethereum : null;
}

function rpc(method, params) {
  var provider = getProvider();
  if (!provider) return Promise.reject(new Error("Wallet tidak terdeteksi"));
  return provider.request({ method: method, params: params || [] });
}

function ethCall(to, data) {
  return rpc("eth_call", [{ to: to, data: data }, "latest"]);
}

function sameAddr(a, b) {
  return !!a && !!b && String(a).toLowerCase() === String(b).toLowerCase();
}

// ---- UI: status deploy ----
function renderDeployState() {
  if (ui.contractAddr) ui.contractAddr.textContent = contractReady() ? CONTRACT_ADDRESS : "belum di-deploy";
  showBanner(ui.deployBanner, !contractReady());
  updateCheckInButton();
}

function renderProviderState() {
  var hasProvider = !!getProvider();
  showBanner(ui.providerBanner, !hasProvider);
  if (ui.connectBtn && !hasProvider) {
    ui.connectBtn.disabled = true;
    ui.connectBtn.textContent = "Wallet Tidak Terdeteksi";
  }
}

function renderNetworkState() {
  var wrongChain = state.account !== null && state.chainId !== null && Number(state.chainId) !== BSC_CHAIN_ID;
  showBanner(ui.networkBanner, wrongChain);
  return wrongChain;
}

function setAgentIdTag(kind, text) {
  if (!ui.agentIdStatus) return;
  ui.agentIdStatus.className = "tag" + (kind ? " " + kind : "");
  ui.agentIdStatus.textContent = text;
}

function renderWallet() {
  var connected = !!state.account;
  if (ui.walletInfo) ui.walletInfo.classList.toggle("hidden", !connected);
  if (ui.connectBtn) {
    if (!getProvider()) {
      ui.connectBtn.disabled = true;
      ui.connectBtn.textContent = "Wallet Tidak Terdeteksi";
    } else if (connected) {
      ui.connectBtn.disabled = false;
      ui.connectBtn.textContent = "Hubungkan Ulang / Ganti Akun";
    } else {
      ui.connectBtn.disabled = false;
      ui.connectBtn.textContent = "Hubungkan Wallet";
    }
  }
  if (ui.walletAddr) ui.walletAddr.textContent = connected ? shortAddr(state.account) : "—";
  if (!connected) setAgentIdTag("", "Belum terhubung");
}

function renderStats() {
  var s = state.streak;
  var l = state.longest;
  var t = state.total;
  if (ui.statStreak) {
    ui.statStreak.textContent = s === null ? "—" : s.toString();
    ui.statStreak.className = "value" + (s === null || s === 0n ? " zero" : "");
  }
  if (ui.statLongest) {
    ui.statLongest.textContent = l === null ? "—" : l.toString();
    ui.statLongest.className = "value" + (l === null || l === 0n ? " zero" : "");
  }
  if (ui.statTotal) {
    ui.statTotal.textContent = t === null ? "—" : t.toString();
    ui.statTotal.className = "value" + (t === null || t === 0n ? " zero" : "");
  }
  if (ui.todayInfo) {
    if (state.currentDay === null) {
      ui.todayInfo.textContent = "hari ke-" + localDay().toString() + " (perkiraan)";
    } else {
      ui.todayInfo.textContent = "hari ke-" + state.currentDay.toString();
    }
  }
}

function localDay() {
  return BigInt(Math.floor(Date.now() / 1000 / SECONDS_PER_DAY));
}

function updateCheckInButton() {
  var btn = ui.checkInBtn;
  if (!btn) return;

  if (state.busy) {
    btn.disabled = true;
    btn.textContent = "Memproses…";
    return;
  }
  if (!contractReady()) {
    btn.disabled = true;
    btn.textContent = "Kontrak Belum Deploy";
    return;
  }
  if (!state.account) {
    btn.disabled = true;
    btn.textContent = "Hubungkan Wallet Dulu";
    return;
  }
  if (state.chainId !== null && Number(state.chainId) !== BSC_CHAIN_ID) {
    btn.disabled = true;
    btn.textContent = "Ganti ke BNB Chain Dulu";
    return;
  }
  if (state.agentIdBalance === null) {
    btn.disabled = true;
    btn.textContent = "Memeriksa Agent ID…";
    return;
  }
  if (state.agentIdBalance === 0n) {
    btn.disabled = true;
    btn.textContent = "Butuh Agent ID untuk Check-in";
    return;
  }
  if (state.canCheckIn === false) {
    btn.disabled = true;
    btn.textContent = "Sudah Check-in Hari Ini";
    return;
  }
  if (state.canCheckIn === null) {
    btn.disabled = true;
    btn.textContent = "Memuat…";
    return;
  }
  btn.disabled = false;
  btn.textContent = "Check-in Hari Ini";
}

// ---- baca on-chain ----
function fetchAgentIdBalance(account) {
  return ethCall(AGENT_ID_ADDRESS, encodeCallAddress(SEL.balanceOf, account)).then(function (res) {
    var v = parseUint(shortHex(res));
    return v === null ? 0n : v;
  });
}

function fetchStreakData(account) {
  return Promise.all([
    ethCall(CONTRACT_ADDRESS, encodeCallAddress(SEL.streakOf, account)),
    ethCall(CONTRACT_ADDRESS, encodeCallAddress(SEL.longestStreak, account)),
    ethCall(CONTRACT_ADDRESS, encodeCallAddress(SEL.totalCheckIns, account)),
    ethCall(CONTRACT_ADDRESS, encodeCallAddress(SEL.canCheckInToday, account)),
    ethCall(CONTRACT_ADDRESS, SEL.currentDay)
  ]).then(function (r) {
    var canRaw = parseUint(shortHex(r[3]));
    return {
      streak: parseUint(shortHex(r[0])),
      longest: parseUint(shortHex(r[1])),
      total: parseUint(shortHex(r[2])),
      canCheckIn: canRaw !== null && canRaw !== 0n,
      currentDay: parseUint(shortHex(r[4]))
    };
  });
}

function resetStreakData() {
  state.streak = null;
  state.longest = null;
  state.total = null;
  state.canCheckIn = null;
  state.currentDay = null;
}

function refreshAll() {
  clearMsg(ui.walletMsg);
  clearMsg(ui.checkInMsg);

  if (!getProvider()) {
    renderProviderState();
    return;
  }
  renderProviderState();
  var wrongChain = renderNetworkState();

  if (!state.account) {
    state.agentIdBalance = null;
    resetStreakData();
    renderWallet();
    renderStats();
    updateCheckInButton();
    return;
  }

  if (wrongChain) {
    // Jangan baca kontrak di jaringan yang salah — hasilnya menyesatkan.
    state.agentIdBalance = null;
    resetStreakData();
    setAgentIdTag("warn", "Jaringan salah");
    renderWallet();
    renderStats();
    updateCheckInButton();
    return;
  }

  setAgentIdTag("", "Memeriksa…");
  updateCheckInButton();

  fetchAgentIdBalance(state.account).then(function (bal) {
    state.agentIdBalance = bal;
    if (bal > 0n) setAgentIdTag("ok", "Pemegang Agent ID");
    else setAgentIdTag("bad", "Tidak memegang Agent ID");
  }).catch(function (err) {
    state.agentIdBalance = null;
    setAgentIdTag("warn", "Gagal memeriksa");
    showMsg(ui.walletMsg, "error", friendlyError(err, "Gagal membaca status Agent ID. Periksa koneksi lalu coba lagi."));
  }).then(function () {
    if (!contractReady()) {
      resetStreakData();
      renderStats();
      updateCheckInButton();
      return null;
    }
    return fetchStreakData(state.account).then(function (d) {
      state.streak = d.streak;
      state.longest = d.longest;
      state.total = d.total;
      state.canCheckIn = d.canCheckIn;
      state.currentDay = d.currentDay;
    }).catch(function (err) {
      resetStreakData();
      showMsg(ui.checkInMsg, "error", friendlyError(err, "Gagal membaca data streak dari kontrak. Coba lagi sebentar lagi."));
    });
  }).then(function () {
    renderWallet();
    renderStats();
    updateCheckInButton();
  });
}

// ---- connect ----
function connectWallet() {
  if (!getProvider()) {
    renderProviderState();
    return;
  }
  setBusy(true);
  clearMsg(ui.walletMsg);

  rpc("eth_requestAccounts", []).then(function (accounts) {
    if (!accounts || !accounts.length) {
      throw new Error("Tidak ada akun yang diberikan wallet. Buka wallet lalu pilih akun.");
    }
    return rpc("eth_chainId", []).then(function (cid) {
      state.account = accounts[0];
      state.chainId = cid;
      setBusy(false);
      renderWallet();
      renderNetworkState();
      refreshAll();
      refreshLeaderboard();
    });
  }).catch(function (err) {
    setBusy(false);
    renderWallet();
    showMsg(ui.walletMsg, "error", friendlyError(err, "Gagal menghubungkan wallet. Coba lagi."));
  });
}

function switchChain() {
  if (!getProvider()) { renderProviderState(); return; }
  setBusy(true);
  clearMsg(ui.walletMsg);

  rpc("wallet_switchEthereumChain", [{ chainId: BSC_CHAIN_ID_HEX }]).then(function () {
    return rpc("eth_chainId", []);
  }).then(function (cid) {
    state.chainId = cid;
    setBusy(false);
    renderNetworkState();
    if (Number(cid) === BSC_CHAIN_ID) {
      showMsg(ui.walletMsg, "ok", "Jaringan sudah BNB Chain. Data dimuat ulang.");
    } else {
      showMsg(ui.walletMsg, "warn", "Wallet masih di jaringan lain. Ganti manual ke BNB Chain (chain 56).");
    }
    refreshAll();
    refreshLeaderboard();
  }).catch(function (err) {
    setBusy(false);
    // 4902 = chain belum dikenal wallet; sebagian wallet tidak bisa menambah chain sendiri.
    if (err && Number(err.code) === 4902) {
      showMsg(ui.walletMsg, "warn", "Wallet belum mengenal BNB Chain (chain 56). Tambahkan jaringan BNB Chain secara manual di pengaturan wallet, lalu kembali ke halaman ini.");
    } else {
      showMsg(ui.walletMsg, "error", friendlyError(err, "Gagal mengganti jaringan. Ganti manual ke BNB Chain (chain 56) di wallet."));
    }
  });
}

// ---- check-in ----
function checkIn() {
  if (state.busy) return; // cegah klik ganda saat transaksi masih berjalan
  if (!contractReady()) {
    showMsg(ui.checkInMsg, "warn", "Kontrak belum di-deploy. Check-in belum tersedia.");
    return;
  }
  if (!state.account) {
    showMsg(ui.checkInMsg, "warn", "Hubungkan wallet dulu.");
    return;
  }
  if (state.chainId !== null && Number(state.chainId) !== BSC_CHAIN_ID) {
    showMsg(ui.checkInMsg, "warn", "Ganti wallet ke BNB Chain (chain 56) dulu.");
    return;
  }
  if (state.agentIdBalance === 0n) {
    showMsg(ui.checkInMsg, "warn", "Wallet ini tidak memegang Agent ID, jadi tidak bisa check-in.");
    return;
  }
  if (state.canCheckIn === false) {
    showMsg(ui.checkInMsg, "warn", "Sudah check-in hari ini (UTC). Kembali setelah 00:00 UTC.");
    return;
  }

  setBusy(true);
  showMsg(ui.checkInMsg, "info", "Menunggu konfirmasi di wallet… Periksa detail transaksi sebelum menyetujui.");

  var txParams = {
    from: state.account,
    to: CONTRACT_ADDRESS,
    data: encodeCallSelectorOnly(SEL.checkIn),
    value: "0x0"
  };

  rpc("eth_sendTransaction", [txParams]).then(function (txHash) {
    showMsg(ui.checkInMsg, "info", "Transaksi terkirim: " + shortAddr(txHash) + ". Menunggu konfirmasi blok…");
    return waitForReceipt(txHash, 45).then(function (receipt) {
      if (receipt && receipt.status !== undefined) {
        var okStatus = (receipt.status === "0x1" || receipt.status === 1 || receipt.status === true);
        if (okStatus) {
          return { kind: "ok", text: "Check-in berhasil. Streak sudah tercatat on-chain." };
        }
        return { kind: "error", text: "Transaksi masuk blok tetapi gagal. Kemungkinan sudah check-in hari ini atau Agent ID tidak terdeteksi." };
      }
      return { kind: "info", text: "Transaksi terkirim. Status belum terkonfirmasi — cek kembali beberapa saat lagi." };
    });
  }).catch(function (err) {
    return { kind: "error", text: friendlyError(err, "Check-in gagal. Tidak ada transaksi terkirim.") };
  }).then(function (result) {
    setBusy(false);
    // refreshAll() mengosongkan pesan, jadi tampilkan hasilnya sesudah refresh.
    refreshAll();
    refreshLeaderboard();
    showMsg(ui.checkInMsg, result.kind, result.text);
    return result;
  });
}

// Polling receipt lewat provider wallet. Kalau wallet tidak mendukung
// eth_getTransactionReceipt, kita menyerah dengan tenang (bukan error keras).
function waitForReceipt(txHash, maxTries) {
  var tries = 0;
  return new Promise(function (resolve) {
    function tick() {
      tries += 1;
      rpc("eth_getTransactionReceipt", [txHash]).then(function (receipt) {
        if (receipt && receipt.blockNumber) { resolve(receipt); return; }
        if (tries >= maxTries) { resolve(null); return; }
        setTimeout(tick, 2000);
      }).catch(function () {
        resolve(null);
      });
    }
    setTimeout(tick, 2500);
  });
}

// ---- leaderboard ----
function decodeCheckInLog(log) {
  // topics: [event, user, day] ; data: streak, totalCheckIns (masing-masing 32 byte)
  if (!log || !log.topics || log.topics.length < 3) return null;
  var userTopic = log.topics[1];
  var dayTopic = log.topics[2];
  if (!userTopic || !dayTopic) return null;

  var user = "0x" + userTopic.slice(-40);
  var day = parseUint("0x" + dayTopic.slice(-64));

  var data = (log.data || "0x").replace(/^0x/, "");
  if (data.length < 128) return null;
  var streak = parseUint("0x" + data.slice(0, 64));
  var total = parseUint("0x" + data.slice(64, 128));
  if (streak === null) return null;

  return { user: user, day: day, streak: streak, total: total };
}

function getLogsRange(fromBlock, toBlock) {
  return rpc("eth_getLogs", [{
    address: CONTRACT_ADDRESS,
    fromBlock: "0x" + fromBlock.toString(16),
    toBlock: "0x" + toBlock.toString(16),
    topics: [CHECKIN_TOPIC]
  }]).then(function (logs) {
    return Array.isArray(logs) ? logs : [];
  });
}

// Ambil semua log CheckIn. RPC dengan batas rentang blok akan membalas error
// untuk rentang besar; respons itu kita pakai untuk mengecilkan ukuran
// potongan (bukan membelah dua terus-menerus), lalu potongan berikutnya
// memakai ukuran yang sudah terbukti diterima.
function fetchLogsChunked(fromBlock, toBlock) {
  var total = toBlock - fromBlock + 1;
  var chunk = total;          // percobaan pertama: seluruh rentang
  var calls = 0;
  var collected = [];
  var anySuccess = false;

  function next() {
    if (calls >= LOG_MAX_CALLS) {
      if (!anySuccess) throw new Error("Terlalu banyak permintaan log. Coba lagi nanti.");
      return collected;
    }
    if (fromBlock > toBlock) return collected;

    var end = Math.min(fromBlock + chunk - 1, toBlock);
    calls += 1;
    return getLogsRange(fromBlock, end).then(function (logs) {
      anySuccess = true;
      collected = collected.concat(logs);
      fromBlock = end + 1;
      return next();
    }).catch(function (err) {
      // Batas rentang dari RPC: kecilkan potongan, ulangi blok yang sama.
      if (chunk <= LOG_MIN_SPAN) {
        // Potongan sekecil ini masih ditolak → method ini tidak bisa dipakai.
        if (!anySuccess) throw err;
        fromBlock = end + 1;
        return next();
      }
      chunk = Math.max(LOG_MIN_SPAN, Math.floor(chunk / 2));
      return next();
    });
  }

  return Promise.resolve().then(next).then(function (logs) {
    if (!anySuccess) throw new Error("eth_getLogs tidak didukung oleh wallet/RPC ini");
    return logs;
  });
}

function refreshLeaderboard() {
  if (!ui.boardBox) return;

  if (!contractReady()) {
    ui.boardBox.innerHTML = "";
    var p0 = document.createElement("p");
    p0.className = "empty";
    p0.textContent = "Leaderboard aktif setelah kontrak di-deploy.";
    ui.boardBox.appendChild(p0);
    return;
  }
  if (!getProvider()) {
    ui.boardBox.innerHTML = "";
    var p1 = document.createElement("p");
    p1.className = "empty";
    p1.textContent = "Hubungkan wallet untuk memuat leaderboard.";
    ui.boardBox.appendChild(p1);
    return;
  }
  if (state.chainId !== null && Number(state.chainId) !== BSC_CHAIN_ID) {
    ui.boardBox.innerHTML = "";
    var p2 = document.createElement("p");
    p2.className = "empty";
    p2.textContent = "Ganti ke BNB Chain (chain 56) untuk memuat leaderboard.";
    ui.boardBox.appendChild(p2);
    return;
  }

  ui.boardBox.innerHTML = "";
  var loading = document.createElement("p");
  loading.className = "empty";
  loading.textContent = "Memuat leaderboard…";
  ui.boardBox.appendChild(loading);

  rpc("eth_blockNumber", []).then(function (bnHex) {
    var latest = parseInt(bnHex, 16);
    if (!isFinite(latest)) throw new Error("Blok terbaru tidak valid");
    var from = Math.min(Number(DEPLOY_BLOCK) || 0, latest);
    return fetchLogsChunked(from, latest);
  }).then(function (logs) {
    renderLeaderboard(logs);
  }).catch(function (err) {
    ui.boardBox.innerHTML = "";
    var p = document.createElement("p");
    p.className = "empty";
    p.textContent = "Belum ada data. Leaderboard tidak bisa dimuat saat ini.";
    ui.boardBox.appendChild(p);
    // Detail teknis tetap ditampilkan di halaman (bukan console saja).
    var d = document.createElement("p");
    d.className = "meta";
    d.style.textAlign = "center";
    d.textContent = "Info: " + friendlyError(err, "RPC wallet menolak permintaan log.");
    ui.boardBox.appendChild(d);
  });
}

function renderLeaderboard(logs) {
  if (!ui.boardBox) return;
  ui.boardBox.innerHTML = "";

  var rows = [];
  for (var i = 0; i < logs.length; i++) {
    var d = decodeCheckInLog(logs[i]);
    if (d) rows.push(d);
  }

  if (!rows.length) {
    var p = document.createElement("p");
    p.className = "empty";
    p.textContent = "Belum ada data. Jadilah yang pertama check-in.";
    ui.boardBox.appendChild(p);
    return;
  }

  // Ambil streak terbaru per user (berdasarkan hari terbesar, lalu urutan log).
  var byUser = {};
  rows.forEach(function (r) {
    var key = r.user.toLowerCase();
    var prev = byUser[key];
    var day = r.day === null ? -1n : r.day;
    if (!prev || day > prev.day || (day === prev.day && r.streak >= prev.streak)) {
      byUser[key] = r;
    }
  });

  var list = Object.keys(byUser).map(function (k) { return byUser[k]; });
  list.sort(function (a, b) {
    if (a.streak !== b.streak) return a.streak > b.streak ? -1 : 1;
    if (a.day !== null && b.day !== null && a.day !== b.day) return a.day > b.day ? -1 : 1;
    return a.user.toLowerCase() < b.user.toLowerCase() ? -1 : 1;
  });

  var top = list.slice(0, 10);
  var ul = document.createElement("ul");
  ul.className = "board";

  top.forEach(function (r, idx) {
    var li = document.createElement("li");
    if (state.account && sameAddr(r.user, state.account)) li.className = "me";

    var rank = document.createElement("span");
    rank.className = "rank";
    rank.textContent = String(idx + 1);

    var addr = document.createElement("span");
    addr.className = "addr mono";
    addr.textContent = shortAddr(r.user);

    var streak = document.createElement("span");
    streak.className = "streak";
    streak.textContent = r.streak.toString();
    var small = document.createElement("small");
    small.textContent = " hari";
    streak.appendChild(small);

    li.appendChild(rank);
    li.appendChild(addr);
    li.appendChild(streak);
    ul.appendChild(li);
  });

  ui.boardBox.appendChild(ul);
}

// ---- provider events ----
function handleAccountsChanged(accounts) {
  if (!accounts || !accounts.length) {
    state.account = null;
    state.agentIdBalance = null;
    state.streak = null;
    state.longest = null;
    state.total = null;
    state.canCheckIn = null;
    setAgentIdTag("", "Belum terhubung");
    showMsg(ui.walletMsg, "warn", "Wallet terputus. Hubungkan lagi untuk melanjutkan.");
    renderWallet();
    renderStats();
    updateCheckInButton();
    refreshLeaderboard();
    return;
  }
  state.account = accounts[0];
  refreshAll();
  refreshLeaderboard();
}

function handleChainChanged(chainId) {
  state.chainId = chainId;
  renderNetworkState();
  refreshAll();
  refreshLeaderboard();
}

function attachProviderEvents() {
  var provider = getProvider();
  if (!provider || !provider.on) return;
  provider.on("accountsChanged", handleAccountsChanged);
  provider.on("chainChanged", handleChainChanged);
}

// ---- init ----
function init() {
  cacheEls();
  renderDeployState();
  renderProviderState();
  renderWallet();
  renderStats();

  if (ui.todayInfo) {
    ui.todayInfo.textContent = "hari ke-" + localDay().toString() + " (perkiraan)";
  }

  if (ui.connectBtn) ui.connectBtn.addEventListener("click", connectWallet);
  if (ui.switchChainBtn) ui.switchChainBtn.addEventListener("click", switchChain);
  if (ui.checkInBtn) ui.checkInBtn.addEventListener("click", checkIn);

  attachProviderEvents();
  updateCheckInButton();

  // Kalau wallet sudah pernah mengizinkan situs ini, tampilkan akun tanpa popup.
  if (getProvider() && typeof getProvider().request === "function") {
    rpc("eth_accounts", []).then(function (accounts) {
      return rpc("eth_chainId", []).then(function (cid) {
        state.chainId = cid;
        if (accounts && accounts.length) {
          state.account = accounts[0];
          refreshAll();
        } else {
          renderNetworkState();
        }
        refreshLeaderboard();
      });
    }).catch(function () {
      // Tidak fatal: user tinggal tekan Hubungkan Wallet.
      renderNetworkState();
      refreshLeaderboard();
    });
  } else {
    refreshLeaderboard();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Ekspor kecil untuk pengujian lokal di Node (bukan dipakai halaman).
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SEL: SEL,
    CHECKIN_TOPIC: CHECKIN_TOPIC,
    encodeCallAddress: encodeCallAddress,
    parseUint: parseUint,
    shortHex: shortHex,
    decodeCheckInLog: decodeCheckInLog,
    shortAddr: shortAddr,
    pad32: pad32
  };
}
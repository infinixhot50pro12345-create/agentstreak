# AgentStreak — Deployment Notes

**Contract:** `AgentStreak` — `src/AgentStreak.sol`
**Compiler:** Solidity `0.8.20+commit.a1b79de6`
**Settings:** optimizer enabled, `runs = 200`, `evmVersion = paris`, no `viaIR`, no libraries
**Constructor args:** none

> ⚠️ This file is a record of a **local-only** build. Nothing here was broadcast, signed,
> or sent to a real network. Every gas figure below was measured on a local Anvil chain.
> BscScan is unreachable from the build VM — contract verification must be done manually
> in a browser later (see §7).

---

## 1. Build summary

| Item | Value |
|---|---|
| Runtime bytecode | 1,600 bytes |
| Creation (init) bytecode | 1,632 bytes |
| Contract size limit margin | 22,976 bytes free of 24,576 |
| Deployment gas used (measured) | **398,657 gas** |
| Tests | 7 passed, 0 failed (`forge test`) |

### Function selectors

| Function | Selector |
|---|---|
| `checkIn()` | `0x183ff085` |
| `streakOf(address)` | `0x4fc1854a` |
| `canCheckInToday(address)` | `0x591ff3e0` |
| `currentDay()` | `0x5c9302c9` |

Auto-generated public getters (from the public mappings / constants / immutable-like constant):

| Function | Selector |
|---|---|
| `lastCheckInDay(address)` | `0xc483da22` |
| `currentStreak(address)` | `0x5c45f739` |
| `longestStreak(address)` | `0xde96303b` |
| `totalCheckIns(address)` | `0x828e1ffd` |
| `SECONDS_PER_DAY()` | `0x74f0314f` |
| `AGENT_ID()` | `0xe905182a` |

### Event

```solidity
event CheckIn(address indexed user, uint256 indexed day, uint256 streak, uint256 totalCheckIns);
```

Topic0 (`cast keccak "CheckIn(address,uint256,uint256,uint256)"`):
`0xf70c8ccfb49937cb9079ffa719be60366bdb8f901313f28dd3da4e482977a7fa`

---

## 2. Creation bytecode (full hex)

Compiled exactly as configured above. This reproduces byte-for-byte with the standard-JSON
input in §7 (`verify/AgentStreak.standard-input.json`).

```
0x608060405234801561001057600080fd5b50610640806100206000396000f3fe608060405234801561001057600080fd5b506004361061009e5760003560e01c806374f0314f1161006657806374f0314f1461011e578063828e1ffd14610128578063c483da2214610148578063de96303b14610168578063e905182a1461018857600080fd5b8063183ff085146100a35780634fc1854a146100ad578063591ff3e0146100d35780635c45f739146100f65780635c9302c914610116575b600080fd5b6100ab6101bb565b005b6100c06100bb366004610563565b610426565b6040519081526020015b60405180910390f35b6100e66100e1366004610563565b61049c565b60405190151581526020016100ca565b6100c0610104366004610563565b60016020526000908152604090205481565b6100c061054f565b6100c06201518081565b6100c0610136366004610563565b60036020526000908152604090205481565b6100c0610156366004610563565b60006020819052908152604090205481565b6100c0610176366004610563565b60026020526000908152604090205481565b6101a37360b9262456de011f7d15a54cdd8c48baaa8b022f81565b6040516001600160a01b0390911681526020016100ca565b6040516370a0823160e01b81523360048201526000907360b9262456de011f7d15a54cdd8c48baaa8b022f906370a0823190602401602060405180830381865afa15801561020d573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102319190610593565b116102835760405162461bcd60e51b815260206004820152601860248201527f4167656e7453747265616b3a206e6f204167656e74204944000000000000000060448201526064015b60405180910390fd5b600061028d61054f565b336000908152602081905260409020549091508190036102fd5760405162461bcd60e51b815260206004820152602560248201527f4167656e7453747265616b3a20616c726561647920636865636b656420696e20604482015264746f64617960d81b606482015260840161027a565b6103086001826105c2565b336000908152602081905260409020540361034a57336000908152600160208190526040822080549192909161033f9084906105d5565b9091555061035e9050565b336000908152600160208190526040909120555b33600090815260026020908152604080832054600190925290912054111561039d57336000908152600160209081526040808320546002909252909120555b33600090815260208181526040808320849055600390915281208054600192906103c89084906105d5565b9091555050336000818152600160209081526040808320546003835292819020548151938452918301919091528392917ff70c8ccfb49937cb9079ffa719be60366bdb8f901313f28dd3da4e482977a7fa910160405180910390a350565b60008061043161054f565b6001600160a01b0384166000908152602081905260409020549091508082148061046f575060008211801561046f575061046c6001836105c2565b81145b15610492575050506001600160a01b031660009081526001602052604090205490565b5060009392505050565b6040516370a0823160e01b81526001600160a01b038216600482015260009081907360b9262456de011f7d15a54cdd8c48baaa8b022f906370a0823190602401602060405180830381865afa1580156104f9573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061051d9190610593565b118015610549575061052d61054f565b6001600160a01b03831660009081526020819052604090205414155b92915050565b600061055e62015180426105e8565b905090565b60006020828403121561057557600080fd5b81356001600160a01b038116811461058c57600080fd5b9392505050565b6000602082840312156105a557600080fd5b5051919050565b634e487b7160e01b600052601160045260246000fd5b81810381811115610549576105496105ac565b80820180821115610549576105496105ac565b60008261060557634e487b7160e01b600052601260045260246000fd5b50049056fea26469706673582212205707b6b49d2173dcdfbe2c538d5a0d10d5a730830d6a3b926d2fce0280dd8c5d64736f6c63430008140033
```

Runtime bytecode is embedded in the init code above (first `0xfe` marker separates
constructor logic from the returned runtime). Size 1,600 bytes.

---

## 3. Deployment cost

Measured gas: **398,657**.

| Gas price | Cost in BNB |
|---|---|
| 0.05 gwei | **0.0000199329 BNB** |
| 0.1 gwei | **0.0000398657 BNB** |
| 1 gwei | **0.0003986570 BNB** |

Derivation: `398,657 × gasPrice(gwei) × 1e-9` BNB, e.g.
`398657 * 0.05e-9 = 1.993285e-5` BNB.

The deployer's ~0.00237 BNB covers the 0.05 gwei case with ~119× headroom, and the
1 gwei case with ~5.9× headroom.

Gas breakdown (for reference): 21,000 intrinsic + 25,200 calldata + 32,000 CREATE +
320,000 code deposit (200 × 1,600 runtime bytes) + 457 initcode execution = 398,657.

The `forge script` simulation reports 458,600 gas for the whole script run (harness
overhead included); when simulated against a local Anvil node it estimates 518,254 total
for the script. The on-chain CREATE transaction itself costs 398,657, which is what the
table above is based on (measured from an actual `CREATE` on local Anvil).

---

## 4. Files

| Path | Purpose |
|---|---|
| `src/AgentStreak.sol` | the contract, no external dependencies |
| `test/AgentStreak.t.sol` | 7 tests covering the full spec |
| `test/MockAgentID.sol` | test-only mock exposing settable `balanceOf` |
| `script/DeployAgentStreak.s.sol` | deploy script (simulation only) |
| `flattened/AgentStreak.flattened.sol` | flattened source, for BscScan/Remix |
| `verify/AgentStreak.standard-input.json` | solc standard-JSON input, reproduces bytecode exactly |
| `foundry.toml` | pins solc 0.8.20, optimizer on, 200 runs, paris |

---

## 5. Test notes

The contract hardcodes the mainnet Agent ID address as a `constant`, so tests cannot simply
inject a mock through a constructor. Instead `setUp()` deploys `MockAgentID` and uses
`vm.etch` to place its runtime code at `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`.
No mainnet RPC, fork, or real call is ever used. Time is controlled with `vm.warp`, starting
at day 2000 (`2,000 × 86400`) so `day - 1` arithmetic is meaningful.

Covered: non-holder revert; single check-in state + event + double check-in revert;
consecutive-day growth 1→2→3 with longest tracking; missed-day reset with longest preserved;
`streakOf` decay (same day, yesterday, missed); `canCheckInToday` for holder/non-holder
before/after; two users fully independent.

Run: `forge test`

---

## 6. Deployment instructions (manual, by the user)

**Do not run `--broadcast` from the build environment.** These steps are for the user's own
machine, with their own wallet, after they have confirmed the parameters.

1. **Network:** BNB Smart Chain mainnet (chain id **56**). In your wallet, select BSC.
2. **Confirm the target:** you are deploying a new `AgentStreak` with **no constructor args**
   and **no value**. It has no owner and no admin; it cannot be changed after deployment.
3. **Estimated cost:** 398,657 gas. At 0.1 gwei that is 0.0000398657 BNB; at 1 gwei,
   0.0003986570 BNB. Keep a small buffer for gas-price movement.
4. **Deploy** by either route:
   - **Remix:** open https://remix.ethereum.org → create `AgentStreak.sol` → paste
     `flattened/AgentStreak.flattened.sol` → Compiler tab: version `0.8.20`, Enable
     optimization, runs `200`, EVM version `paris` → Compile → Deploy & Run → Environment
     "Injected Provider - MetaMask" → confirm the wallet is on chain 56 → Deploy → confirm
     in the wallet. Note the deployed address from the Remix console.
   - **Foundry (your own machine):**
     ```
     forge create src/AgentStreak.sol:AgentStreak \
       --rpc-url <your BSC RPC> \
       --account <your keystore/ledger account> \
       --legacy
     ```
     (`--legacy` is appropriate for BSC, which does not use EIP-1559.) Never paste a raw
     private key on a command line; use `--account` / `--ledger`.
5. **Post-deploy smoke test:** call `currentDay()` (should return `block.timestamp / 86400`),
   `canCheckInToday(<holder>)`, and from a holder wallet call `checkIn()` once. A second
   `checkIn()` in the same day must revert with `AgentStreak: already checked in today`.
6. Keep the address + tx hash; you need them for verification.

---

## 7. BscScan verification (browser only)

BscScan is **blocked from the build VM**, so nothing here was submitted. Verify manually
in a browser after deploying. **Use the Standard-Json-Input route below** — it is the only
route confirmed to reproduce the recorded creation bytecode exactly.

### 7a. Recommended: Standard-Json-Input (byte-exact)

1. Go to `https://bscscan.com/address/<deployed-address>#code`.
2. Click **Verify and Publish**.
3. Compiler type: **Solidity (Standard-Json-Input)**.
4. Compiler version: **v0.8.20+commit.a1b79de6**.
5. Upload/paste `verify/AgentStreak.standard-input.json`.
6. Constructor arguments: **none** (leave the field empty).
7. Submit.

That input contains the source under the original path `src/AgentStreak.sol` with the exact
settings used for the recorded bytecode; it was compiled locally with solc 0.8.20 and
produced a **byte-for-byte identical** creation bytecode, including the metadata suffix.

### 7b. Fallback: single-file with the flattened source

If the Standard-Json form is unavailable, verify as **Solidity (Single file)**,
compiler `v0.8.20+commit.a1b79de6`, license **MIT**, optimization **Yes / 200 runs**,
pasting `flattened/AgentStreak.flattened.sol`.

Important caveat, measured locally: solc embeds a 53-byte metadata suffix (CBOR with the
IPFS hash and compiler version) at the end of the bytecode, and that hash covers the source
*path* and full compiler settings. Compiling the flattened file as
`AgentStreak.flattened.sol` therefore yields **1,632-byte init code that differs from the
recorded bytecode only in those final 53 metadata bytes** — all executable code, the
runtime size (1,600 bytes) and the gas estimate (398,657) are identical. If BscScan reports
a bytecode mismatch on single-file verification, that difference is why: switch to 7a.

**Tip for a clean single-file match:** deploy via Remix from
`flattened/AgentStreak.flattened.sol` (settings above). The deployed bytecode then carries
the *flattened* metadata hash, and single-file verification with the same file and settings
matches it directly. Only the metadata suffix differs from this repo's recorded hex; the
contract logic is byte-identical.

### Verification inputs prepared

- Flattened source: `flattened/AgentStreak.flattened.sol`
- Standard JSON: `verify/AgentStreak.standard-input.json`
- Compiler: `0.8.20+commit.a1b79de6`
- Optimizer: on, 200 runs
- EVM version: paris
- License: MIT
- Constructor args: none

---

## 8. Spec deviations

None in contract behaviour. Three implementation notes:

1. **Address checksum.** The spec's lowercase literal
   `0x60b9262456de011f7d15a54cdd8c48baaa8b022f` is not a valid Solidity address literal
   (solc rejects non-checksummed mixed-case-sensitive literals). It is written in source
   as its EIP-55 form `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F` — the same address.
2. **`streakOf` day-zero guard.** The spec's condition is `last == day || last == day - 1`.
   In Solidity 0.8.x, `day - 1` underflows and reverts when `day == 0` (timestamps before
   1970-01-02). A guard `day > 0 &&` was added; behaviour is identical for all real
   timestamps.
3. **`--dry-run` flag.** Forge 1.9.0 removed `forge script --dry-run`; omitting `--broadcast`
   is the simulation mode. The gas figures above were measured with `forge script`
   (no broadcast) and cross-checked against a real `CREATE` on a local Anvil chain only.

No passive-income or earnings claims, no branding, no owner/admin/fee/token/upgrade hook
exists in the code.

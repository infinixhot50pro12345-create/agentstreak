# AgentStreak — contracts

Daily check-in streak tracker gated on holding an Agent ID.

- `src/AgentStreak.sol` — the contract (no external dependencies)
- `test/AgentStreak.t.sol` — 7 tests
- `script/DeployAgentStreak.s.sol` — deploy script (simulation only)
- `DEPLOY.md` — bytecode, gas costs, selectors, deployment + verification steps

## Usage

```shell
forge build
forge test
forge script script/DeployAgentStreak.s.sol        # simulates; add --rpc-url to simulate on a node
```

Never run `--broadcast` from this workspace. See `DEPLOY.md` for the manual deployment and
BscScan verification procedure.
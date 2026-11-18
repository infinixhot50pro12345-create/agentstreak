// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {AgentStreak} from "../src/AgentStreak.sol";

/// @notice Deploys AgentStreak. No constructor args.
/// @dev Gas estimate only: run with
///        forge script script/DeployAgentStreak.s.sol --dry-run
///      Do NOT run with --broadcast from this workspace.
contract DeployAgentStreak is Script {
    function run() external returns (AgentStreak streak) {
        vm.startBroadcast();
        streak = new AgentStreak();
        vm.stopBroadcast();

        console2.log("AgentStreak deployed at", address(streak));
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Minimal test-only stand-in for the Agent ID ERC-721.
///         Only balanceOf is needed by AgentStreak; balances are settable.
contract MockAgentID {
    mapping(address => uint256) public balanceOf;

    function setBalance(address account, uint256 balance) external {
        balanceOf[account] = balance;
    }
}
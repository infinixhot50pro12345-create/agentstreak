// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAgentID {
    function balanceOf(address account) external view returns (uint256);
}

/// @title AgentStreak
/// @notice Daily check-in streak tracker gated on holding an Agent ID.
/// @dev Deliberately minimal: no owner, no admin, no fees, no token,
///      no upgradeability, no selfdestruct, no pausing.
contract AgentStreak {
    IAgentID public constant AGENT_ID = IAgentID(0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F);
    uint256 public constant SECONDS_PER_DAY = 86400;

    mapping(address => uint256) public lastCheckInDay;
    mapping(address => uint256) public currentStreak;
    mapping(address => uint256) public longestStreak;
    mapping(address => uint256) public totalCheckIns;

    event CheckIn(address indexed user, uint256 indexed day, uint256 streak, uint256 totalCheckIns);

    function currentDay() public view returns (uint256) {
        return block.timestamp / SECONDS_PER_DAY;
    }

    function checkIn() external {
        require(AGENT_ID.balanceOf(msg.sender) > 0, "AgentStreak: no Agent ID");

        uint256 day = currentDay();
        require(lastCheckInDay[msg.sender] != day, "AgentStreak: already checked in today");

        if (lastCheckInDay[msg.sender] == day - 1) {
            currentStreak[msg.sender] += 1;
        } else {
            currentStreak[msg.sender] = 1;
        }

        if (currentStreak[msg.sender] > longestStreak[msg.sender]) {
            longestStreak[msg.sender] = currentStreak[msg.sender];
        }

        lastCheckInDay[msg.sender] = day;
        totalCheckIns[msg.sender] += 1;

        emit CheckIn(msg.sender, day, currentStreak[msg.sender], totalCheckIns[msg.sender]);
    }

    function streakOf(address user) external view returns (uint256) {
        uint256 day = currentDay();
        uint256 last = lastCheckInDay[user];
        if (last == day || (day > 0 && last == day - 1)) {
            return currentStreak[user];
        }
        return 0;
    }

    function canCheckInToday(address user) external view returns (bool) {
        return AGENT_ID.balanceOf(user) > 0 && lastCheckInDay[user] != currentDay();
    }
}
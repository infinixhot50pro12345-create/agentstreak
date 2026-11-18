// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {AgentStreak} from "../src/AgentStreak.sol";
import {MockAgentID} from "./MockAgentID.sol";

contract AgentStreakTest is Test {
    AgentStreak internal streak;
    MockAgentID internal agentId;

    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);
    address internal carol = address(0xCA201);

    // The contract hardcodes the mainnet Agent ID address as a constant.
    // In tests we place the mock's code at that address so no real network is touched.
    address internal constant AGENT_ID_ADDR = 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F;

    uint256 internal constant DAY = 86400;
    // Start at a realistic day index so day-1 arithmetic is well-defined.
    uint256 internal constant START_TS = 2_000 * DAY; // day 2000

    event CheckIn(address indexed user, uint256 indexed day, uint256 streak, uint256 totalCheckIns);

    function setUp() public {
        vm.warp(START_TS);

        MockAgentID impl = new MockAgentID();
        vm.etch(AGENT_ID_ADDR, address(impl).code);
        agentId = MockAgentID(AGENT_ID_ADDR);

        streak = new AgentStreak();
    }

    function _mint(address user) internal {
        agentId.setBalance(user, 1);
    }

    // 1. Non-holder cannot check in.
    function test_NonHolderCannotCheckIn() public {
        vm.prank(carol);
        vm.expectRevert("AgentStreak: no Agent ID");
        streak.checkIn();
    }

    // 2. Holder checks in once.
    function test_HolderChecksInOnce() public {
        _mint(alice);
        uint256 today = streak.currentDay();

        vm.expectEmit(true, true, false, true, address(streak));
        emit CheckIn(alice, today, 1, 1);

        vm.prank(alice);
        streak.checkIn();

        assertEq(streak.currentStreak(alice), 1, "current streak");
        assertEq(streak.longestStreak(alice), 1, "longest streak");
        assertEq(streak.totalCheckIns(alice), 1, "total check-ins");
        assertEq(streak.lastCheckInDay(alice), today, "last check-in day");

        vm.prank(alice);
        vm.expectRevert("AgentStreak: already checked in today");
        streak.checkIn();
    }

    // 3. Consecutive days grow the streak and longest tracks.
    function test_ConsecutiveDaysStreakGrows() public {
        _mint(alice);

        vm.prank(alice);
        streak.checkIn();
        assertEq(streak.streakOf(alice), 1);

        vm.warp(START_TS + 1 * DAY);
        vm.prank(alice);
        streak.checkIn();
        assertEq(streak.streakOf(alice), 2);
        assertEq(streak.longestStreak(alice), 2);

        vm.warp(START_TS + 2 * DAY);
        vm.prank(alice);
        streak.checkIn();
        assertEq(streak.streakOf(alice), 3);
        assertEq(streak.longestStreak(alice), 3);
        assertEq(streak.totalCheckIns(alice), 3);
    }

    // 4. Missed day resets streak to 1, longest preserved.
    function test_MissedDayResetsStreak() public {
        _mint(alice);

        // Build a 2-day streak.
        vm.prank(alice);
        streak.checkIn();
        vm.warp(START_TS + 1 * DAY);
        vm.prank(alice);
        streak.checkIn();
        assertEq(streak.currentStreak(alice), 2);
        assertEq(streak.longestStreak(alice), 2);

        // Skip a day.
        vm.warp(START_TS + 3 * DAY);
        vm.prank(alice);
        streak.checkIn();

        assertEq(streak.currentStreak(alice), 1, "streak reset to 1");
        assertEq(streak.longestStreak(alice), 2, "longest preserved");
        assertEq(streak.totalCheckIns(alice), 3, "total still counts");
    }

    // 5. streakOf decay semantics.
    function test_StreakOfDecaysAfterMissedDay() public {
        _mint(alice);

        vm.prank(alice);
        streak.checkIn();

        // Same day: stored streak.
        assertEq(streak.streakOf(alice), 1, "same day");

        // Yesterday: stored streak (still live until end of today).
        vm.warp(START_TS + 1 * DAY);
        assertEq(streak.streakOf(alice), 1, "yesterday");

        // Two days later with no check-in: zero.
        vm.warp(START_TS + 2 * DAY);
        assertEq(streak.streakOf(alice), 0, "missed a day");
    }

    // 6. canCheckInToday cases.
    function test_CanCheckInToday() public {
        // Non-holder.
        assertFalse(streak.canCheckInToday(carol), "non-holder false");

        // Holder before check-in.
        _mint(alice);
        assertTrue(streak.canCheckInToday(alice), "holder before true");

        // Holder after check-in.
        vm.prank(alice);
        streak.checkIn();
        assertFalse(streak.canCheckInToday(alice), "holder after false");

        // Next day: true again.
        vm.warp(START_TS + 1 * DAY);
        assertTrue(streak.canCheckInToday(alice), "next day true");
    }

    // 7. Two users have independent streaks.
    function test_TwoUsersIndependent() public {
        _mint(alice);
        _mint(bob);

        vm.prank(alice);
        streak.checkIn();

        vm.warp(START_TS + 1 * DAY);
        vm.prank(alice);
        streak.checkIn(); // alice: 2
        vm.prank(bob);
        streak.checkIn(); // bob: 1

        assertEq(streak.currentStreak(alice), 2, "alice streak");
        assertEq(streak.currentStreak(bob), 1, "bob streak");
        assertEq(streak.totalCheckIns(alice), 2, "alice total");
        assertEq(streak.totalCheckIns(bob), 1, "bob total");
        assertEq(streak.longestStreak(alice), 2, "alice longest");
        assertEq(streak.longestStreak(bob), 1, "bob longest");

        // Bob skipping the next day does not affect Alice, and Bob's own
        // streak decays to 0 only once a full day has passed since his
        // last check-in (day+1 -> "yesterday" at day+2 still counts).
        vm.warp(START_TS + 2 * DAY);
        vm.prank(alice);
        streak.checkIn(); // alice: 3
        assertEq(streak.streakOf(alice), 3, "alice unaffected");
        assertEq(streak.streakOf(bob), 1, "bob last check-in was yesterday");

        vm.warp(START_TS + 3 * DAY);
        assertEq(streak.streakOf(alice), 3, "alice unaffected (yesterday)");
        assertEq(streak.streakOf(bob), 0, "bob decayed after two days");
        assertEq(streak.currentStreak(alice), 3, "alice stored streak intact");
        assertEq(streak.currentStreak(bob), 1, "bob stored streak intact");
    }
}
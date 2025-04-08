// Raffle
// Enter the lottery (paying some amount)
// Pick a random winner (verifiably random)
// Winner to be selected every X minutes -> completely automate
// Chainlink Oracle -> Randomness, Automated Execute, (Chainlink Keepers)

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";

error Raffle__NotEnoughETH();
error Raffle__TransferFailed();
error Raffle__NotOpen();
error Raffle__UpKeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);

/** @title A sample Raffle Contract
 * @author Louie
 * @notice This is for creating an untamperable, decentrelized smart contract
 * @dev This implements Chainlink VRF v2Plus and Chainlink Automation
 */
contract Raffle is VRFConsumerBaseV2Plus, AutomationCompatibleInterface {
  /* Types */
  enum RaffleState {
    OPEN,
    CALCULATING
  }

  /* State Variables */
  uint256 private immutable i_entranceFee;
  address payable[] private s_players;
  bytes32 private immutable i_keyHash;
  uint256 private immutable i_subscriptionId;
  uint32 private immutable i_callbackGasLimit;
  uint16 private constant REQUEST_CONFORMATIONS = 3;
  uint32 private constant NUM_WORDS = 1;

  /* Lottery Variables */
  address private s_recentWinner;
  RaffleState private s_raffleState;

  /* Events */
  event RaffleEnter(address indexed player);
  event RequestedRaffleWinner(uint256 indexed requestId);
  event WinnerPicked(address indexed winner);
  uint256 private s_lastTimeStamp;
  uint256 private immutable i_interval;

  /* Constructor */
  constructor(
    address vrfCoordinatorV2Plus,
    uint256 entranceFee,
    bytes32 keyHash,
    uint256 subscriptionId,
    uint32 callbackGasLimit,
    uint256 interval
  ) VRFConsumerBaseV2Plus(vrfCoordinatorV2Plus) {
    i_entranceFee = entranceFee;
    i_keyHash = keyHash;
    i_subscriptionId = subscriptionId;
    i_callbackGasLimit = callbackGasLimit;
    s_raffleState = RaffleState.OPEN;
    s_lastTimeStamp = block.timestamp;
    i_interval = interval;
  }

  function enterRaffle() public payable {
    if (msg.value < i_entranceFee) {
      revert Raffle__NotEnoughETH();
    }
    if (s_raffleState != RaffleState.OPEN) {
      revert Raffle__NotOpen();
    } 

    s_players.push(payable(msg.sender));

    emit RaffleEnter(msg.sender);
  }

  // Conditions
  function checkUpkeep(
    bytes memory /* checkData */
  ) public view override returns (bool upkeepNeeded, bytes memory /* performData */) {
    bool isOpen = (RaffleState.OPEN == s_raffleState);
    bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
    bool hasPlayers = (s_players.length > 0);
    bool hasBalance = address(this).balance > 0;

    upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);
    return (upkeepNeeded, "0x0");
  }

  // Execution
  function performUpkeep(bytes calldata /*  performData */) external override {
    (bool upKeepNeeded, ) = checkUpkeep("");
    if (!upKeepNeeded) {
      revert Raffle__UpKeepNotNeeded(
        address(this).balance,
        s_players.length,
        uint256(s_raffleState)
      );
    }

    s_raffleState = RaffleState.CALCULATING;

    uint256 requestId = s_vrfCoordinator.requestRandomWords(
      VRFV2PlusClient.RandomWordsRequest({ 
        keyHash: i_keyHash,
        subId: i_subscriptionId,
        requestConfirmations: REQUEST_CONFORMATIONS,
        callbackGasLimit: i_callbackGasLimit,
        numWords: NUM_WORDS,
        extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: false}))
      })
    );

    // redundant
    emit RequestedRaffleWinner(requestId);
  }

  // Actions
  function fulfillRandomWords(
    uint256 /* requestId */,
    uint256[] calldata randomWords
  ) internal override {
    uint256 indexOfWinner = randomWords[0] % s_players.length;
    address payable recentWinner = s_players[indexOfWinner];
    s_recentWinner = recentWinner;
    s_raffleState = RaffleState.OPEN;

    (bool success, ) = recentWinner.call{value: address(this).balance}("");
    if (!success) {
      revert Raffle__TransferFailed();
    }

    emit WinnerPicked(recentWinner);

    s_players = new address payable[](0); // Reset players array
    s_lastTimeStamp = block.timestamp;
  }

  /* Getters Function */
  function getEntranceFee() public view returns (uint256) {
    return i_entranceFee;
  }

  function getPlayer(uint256 index) public view returns (address) {
    return s_players[index];
  }

  function getRecentWinner() public view returns (address) {
    return s_recentWinner;
  }

  function getRaffleState() public view returns (RaffleState) {
    return s_raffleState;
  }

  function getNumWords() public pure returns (uint256) {
    return NUM_WORDS;
  }

  function getNumOfPlayers() public view returns (uint256) {
    return s_players.length;
  }

  function getLatestTimestamp() public view returns (uint256) {
    return s_lastTimeStamp;
  }

  function getRequestConfirmations() public pure returns (uint256) {
    return REQUEST_CONFORMATIONS;
  }

  function getInterval() public view returns (uint256) {
    return i_interval;
  }
}

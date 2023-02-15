/**
 * 
• Code compiles
• Code accomplishes task described in prompt
• Code has no glaring security issues
• Code is readable and organized
• Demonstrates ability to create and use modifiers appropriately
• Demonstrates ability to create and emit events appropriately
• Demonstrates ability to use contract inheritance appropriately
• Demonstrates ability to validate conditions and throw sensible errors
• Demonstrates ability to appropriately use global functions to access
information about the transaction, block, address, etc.
• Demonstrates ability to choose appropriate memory types for
parameters, variables, etc.
• Smart contract can quickly and easily be run on a local network
• Project demonstrates understanding of common EVM developer
tooling, e.g. truffle, ganache, hardhat, etc.
• Contract is upgradeable
 */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Crowdfund is Initializable {
    /* ========== STATE VARIABLES ========== */

    /**
     * @dev struct containing information about each crowdfunding campaign
     * @member id - unique number identifying each campaign
     * @member creator - the address of the person launching the campaign
     * @member goal - the amount of tokens the campaign aims to reach
     * @member pledged - the amount of tokens currently pledged to the campaign
     * @member startAt - the block.timestamp at which the campaign will begin
     * @member endAt - the block.timestamp at which the campaign will be over (must be less than 90 days from when th creator calls the function to launch the campaign)
     * @member claimed - whether or not the crowdfunded tokens for the campaign have been claimed
     */

    struct Campaign {
        uint256 id;
        address creator;
        uint256 goal;
        uint256 pledged;
        uint32 startAt;
        uint32 endAt;
        bool claimed;
    }
    /**
     * @dev custom ERC20 which funds take the form of
     */
    using SafeERC20 for IERC20;
    IERC20 public token;
    /**
     * @dev used to track and update unique campaign ids
     */
    uint256 public count;
    /**
     * @dev mapping of id to Campaign struct
     */
    mapping(uint256 => Campaign) public campaigns;
    /**
     * @dev mapping of campaign id to pledger to amount pledged
     */
    mapping(uint256 => mapping(address => uint256)) public pledgedAmount;

    /* ========== EVENTS ========== */
    /**
     * dApps using the contract can observe state changes in transaction logs
     */
    event Launch(
        uint256 id,
        address indexed creator,
        uint256 goal,
        uint32 startAt,
        uint32 endAt
    );
    event Cancel(uint256 id);
    event Pledged(uint256 indexed id, address indexed caller, uint256 amount);
    event Unpledged(uint256 indexed id, address indexed caller, uint256 amount);
    event Claim(uint256 id);
    event Refund(uint256 indexed id, address indexed caller, uint256 amount);

    /* ========== INITIALIZER ========== */

    /**
     * @dev dunction from @openzeppelin to initialize this as the base contract for upgrades
     * @dev must be the first function called
     */
    
    function initialize(address _token) public initializer {
        token = IERC20(_token);
    }

    /**
     * @dev function called by campaign creator to create the crowdfunding campaign and add Campaign to mapping
     * @param _goal - the amount of tokens the campaign aims to receive
     * @param _startAt - the time the campaign will begin (note: _startAt time is passed in by creator and not necessarily the time the creator calls the launch function)
     * @param _endAt - the block.timestamp at which the campaign will end (note: must be less than 90 days from when the creator calls the launch function)
     */

    function launch(uint256 _goal, uint32 _startAt, uint32 _endAt) external {
        require(_startAt >= block.timestamp, "start at < now");
        require(_endAt >= _startAt, "end at < start at");
        require(_endAt <= block.timestamp + 90 days, "end at > max duration");
        count += 1;
        campaigns[count] = Campaign({
            id: count,
            creator: msg.sender,
            goal: _goal,
            pledged: 0,
            startAt: _startAt,
            endAt: _endAt,
            claimed: false
        });
        emit Launch(count, msg.sender, _goal, _startAt, _endAt);
    }

    /**
     * @dev function called by campaign creator to cancel a crowdfunding campaign
     * @dev the campaign must not have already started
     * @param _id - the uinique uint256 id of the campaign to be cancelled
     */
    function cancel(uint256 _id) external {
        Campaign memory campaign = campaigns[_id];
        require(campaign.id != 0, "campaign does not exist");
        require(msg.sender == campaign.creator, "not creator");
        require(block.timestamp < campaign.startAt, "started");
        delete campaigns[_id];
        emit Cancel(_id);
    }

    /**
     * @dev function to transfer tokens from pledger into the contract
     * @dev sender must first call approve on the ERC20 token for this contract address and _amount
     * @param _id - the uinique uint256 id of the campaign to be pledged
     * @param _amount - the amount of tokens trasferred from pledger into contract
     */
    function pledge(uint256 _id, uint256 _amount) external {
        Campaign storage campaign = campaigns[_id];
        require(block.timestamp >= campaign.startAt, "not started");
        require(block.timestamp <= campaign.endAt, "ended");

        campaign.pledged += _amount;
        pledgedAmount[_id][msg.sender] += _amount;
        token.safeTransferFrom(msg.sender, address(this), _amount);
        emit Pledged(_id, msg.sender, _amount);
    }

    /**
     * @dev function for pledger to unpledge their tokens and receive them back before a campaign has ended
     * @param _id - the uinique uint256 id of the campaign to be unpledged
     * @param _amount - the amount of tokens transferred from contract back to pledger
     */

    function unpledge(uint256 _id, uint256 _amount) external {
        Campaign storage campaign = campaigns[_id];
        require(pledgedAmount[_id][msg.sender] <= _amount, "invalid amount");
        require(block.timestamp <= campaign.endAt, "ended");

        campaign.pledged -= _amount;
        pledgedAmount[_id][msg.sender] -= _amount;
        token.safeApprove(msg.sender, _amount);
        token.safeTransfer(msg.sender, _amount);

        emit Unpledged(_id, msg.sender, _amount);
    }

    /**
     * @dev function called by campaign creator to receive funds
     * @dev called must be creator, campaign must have passed end at time, the campaign goal must have been met or exceeded
     * @dev this function can only be called once by creator
     * @param _id - the uinique uint256 id of the campaign which funds are claimed
     */
    function claim(uint256 _id) external {
        Campaign storage campaign = campaigns[_id];
        require(msg.sender == campaign.creator, "not creator");
        require(block.timestamp > campaign.endAt, "not ended");
        require(campaign.pledged >= campaign.goal, "pledged < goal");
        require(!campaign.claimed, "claimed");

        campaign.claimed = true;
        token.safeApprove(msg.sender, campaign.pledged);
        token.safeTransfer(msg.sender, campaign.pledged);

        emit Claim(_id);
    }

    /**
     * @dev function to refund tokens from this contract back to the pledger
     * @dev when a funding goal is not met, pledgers are be able to get a refund of their pledged funds
     * @param _id - the uinique uint256 id of the campaign to refund from
     */
    function refund(uint256 _id) external {
        Campaign storage campaign = campaigns[_id];
        require(campaign.id != 0, "campaign does not exist");
        require(block.timestamp > campaign.endAt, "not ended");
        require(campaign.pledged < campaign.goal, "pledged >= goal");

        uint256 bal = pledgedAmount[_id][msg.sender];
        pledgedAmount[_id][msg.sender] = 0;
        token.safeApprove(msg.sender, bal);
        token.safeTransfer(msg.sender, bal);

        emit Refund(_id, msg.sender, bal);
    }
}

/**
 * 3. When a funding goal is not met, customers are be able to get a refund of their pledged funds
 * 4. dApps using the contract can observe state changes in transaction logs
 * 5. Optional bonus: contract is upgradeable
 */
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Crowdfund {

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
    IERC20 public immutable token;
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

    /* ========== CONSTRUCTOR ========== */

    constructor(address _token) {
        token = IERC20(_token);
    }

    /**
     * @dev function called by campaign creator to create the crowdfunding campaign
     * @param 
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

    function cancel(uint256 _id) external {
        Campaign memory campaign = campaigns[_id];
        require(msg.sender == campaign.creator, "not creator");
        require(block.timestamp < campaign.startAt, "started");
        delete campaigns[_id];
        emit Cancel(_id);
    }

    function pledge(uint256 _id, uint256 _amount) external {
        Campaign storage campaign = campaigns[_id];
        require(block.timestamp >= campaign.startAt, "not started");
        require(block.timestamp <= campaign.endAt, "ended");

        campaign.pledged += _amount;
        pledgedAmount[_id][msg.sender] += _amount;
        token.transferFrom(msg.sender, address(this), _amount);
        emit Pledged(_id, msg.sender, _amount);
    }

    function unpledge(uint256 _id, uint256 _amount) external {
        Campaign storage campaign = campaigns[_id];
        require(block.timestamp <= campaign.endAt, "ended");

        campaign.pledged -= _amount;
        pledgedAmount[_id][msg.sender] -= _amount;
        token.transfer(msg.sender, _amount);

        emit Unpledged(_id, msg.sender, _amount);
    }

    function claim(uint256 _id) external {
        Campaign storage campaign = campaigns[_id];
        require(msg.sender == campaign.creator, "not creator");
        require(block.timestamp > campaign.endAt, "not ended");
        require(campaign.pledged >= campaign.goal, "pledged < goal");
        require(!campaign.claimed, "claimed");

        campaign.claimed = true;
        token.transfer(msg.sender, campaign.pledged);

        emit Claim(_id);
    }

    function refund(uint256 _id) external {
        Campaign storage campaign = campaigns[_id];
        require(block.timestamp > campaign.endAt, "not ended");
        require(campaign.pledged < campaign.goal, "pledged >= goal");

        uint256 bal = pledgedAmount[_id][msg.sender];
        pledgedAmount[_id][msg.sender] = 0;
        token.transfer(msg.sender, bal);

        emit Refund(_id, msg.sender, bal);
    }
}

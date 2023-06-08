pragma solidity ^0.5.16;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract StakingContract {
    struct Stake {
        uint256 amount;
        uint256 startTime;
    }

    mapping(address => Stake) public stakes;
    mapping(address => uint256) public rewards;

    uint256 public totalStaked;
    uint256 public rewardRate = 100; // Reward rate (in percentage)
    uint256 public rewardDuration = 1 days; // Duration for which rewards will be calculated

    IERC20 public token;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    constructor(address tokenAddress) public {
        token = IERC20(tokenAddress);
    }

    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(stakes[msg.sender].amount == 0, "Already staked");

        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");

        stakes[msg.sender] = Stake(amount, block.timestamp);
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    function unstake() external {
        Stake memory userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake found");

        uint256 stakingDuration = block.timestamp - userStake.startTime;
        uint256 reward = (userStake.amount * rewardRate * stakingDuration) / (rewardDuration * 100);
        rewards[msg.sender] += reward;

        delete stakes[msg.sender];
        totalStaked -= userStake.amount;

        require(token.transfer(msg.sender, userStake.amount), "Token transfer failed");

        emit Unstaked(msg.sender, userStake.amount);
    }

    function claimReward() external {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to claim");

        rewards[msg.sender] = 0;

        require(token.transfer(msg.sender, reward), "Token transfer failed");

        emit RewardClaimed(msg.sender, reward);
    }

    function getStakeAmount(address account) public view returns (uint256) {
        return stakes[account].amount;
    }

    function getRewardAmount(address account) public view returns (uint256) {
        return rewards[account];
    }
}

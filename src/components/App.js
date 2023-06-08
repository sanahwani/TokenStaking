import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import StakingContract from '../abis/StakingContract.json';

function App() {
  const [web3, setWeb3] = useState(null);
  const [stakingContract, setStakingContract] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [stakedAmount, setStakedAmount] = useState(0);
  const [rewards, setRewards] = useState(0);
  const [stakeAmount, setStakeAmount] = useState('');

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          await window.ethereum.enable();
          setWeb3(web3);
        } catch (error) {
          console.error('User denied account access');
        }
      } else if (window.web3) {
        const web3 = new Web3(window.web3.currentProvider);
        setWeb3(web3);
      } else {
        console.error('No Ethereum provider detected');
      }
    };

    initWeb3();
  }, []);

  useEffect(() => {
    if (web3) {
      const stakingContract = new web3.eth.Contract(
        StakingContract.abi,
        '0xCD59653238981871fce5B41068d1c6eB049fA009'
      );
      setStakingContract(stakingContract);
    }
  }, [web3]);

  useEffect(() => {
    if (stakingContract) {
      updateTokenBalance();
      updateStakedAmount();
      updateRewards();
    }
  }, [stakingContract]);

  const updateTokenBalance = async () => {
    if (web3.eth.defaultAccount) {
      const balance = await stakingContract.methods.balanceOf(web3.eth.defaultAccount).call();
      setTokenBalance(balance);
    }
  };

  const updateStakedAmount = async () => {
    if (web3.eth.defaultAccount) {
      const stake = await stakingContract.methods.stakes(web3.eth.defaultAccount).call();
      setStakedAmount(stake.amount);
    }
  };

  const updateRewards = async () => {
    if (web3.eth.defaultAccount) {
      const reward = await stakingContract.methods.rewards(web3.eth.defaultAccount).call();
      setRewards(reward);
    }
  };

  const handleStake = async () => {
    if (web3.eth.defaultAccount) {
      try {
        const amountToStake = web3.utils.toWei(stakeAmount, 'ether');
        const options = {
          from: web3.eth.defaultAccount,
          value: amountToStake,
        };

        await stakingContract.methods.stake(amountToStake).send(options);
        updateTokenBalance();
        updateStakedAmount();
        setStakeAmount('');
      } catch (error) {
        console.error('Error staking tokens:', error);
      }
    }
  };

  const handleUnstake = async () => {
    if (web3.eth.defaultAccount) {
      try {
        await stakingContract.methods.unstake().send({ from: web3.eth.defaultAccount });
        updateTokenBalance();
        updateStakedAmount();
      } catch (error) {
        console.error('Error unstaking tokens:', error);
      }
    }
  };

  const handleClaimReward = async () => {
    if (web3.eth.defaultAccount) {
      try {
        await stakingContract.methods.claimReward().send({ from: web3.eth.defaultAccount });
        updateRewards();
        updateTokenBalance();
      } catch (error) {
        console.error('Error claiming reward:', error);
      }
    }
  };

  return (
    <div>
      <h1>Token Staking</h1>
      <p>Token Balance: {tokenBalance}</p>
      <p>Staked Amount: {stakedAmount}</p>
      <p>Rewards: {rewards}</p>
      <input type="text" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} />
      <button onClick={handleStake}>Stake</button>
      <button onClick={handleUnstake}>Unstake</button>
      <button onClick={handleClaimReward}>Claim Reward</button>
    </div>
  );
}

export default App;

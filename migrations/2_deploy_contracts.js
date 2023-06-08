const StakingContract = artifacts.require('StakingContract');
const Token = artifacts.require('Token');

module.exports = async function (deployer) {
  // Deploy Token contract first if needed
  await deployer.deploy(Token);

  // Get the deployed Token contract instance
  const tokenInstance = await Token.deployed();

  // Deploy StakingContract and pass the Token contract address as a parameter
  await deployer.deploy(StakingContract, tokenInstance.address);
};







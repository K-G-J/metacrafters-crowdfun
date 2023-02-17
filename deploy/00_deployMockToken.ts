import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ethers } from 'ethers';
import { MockToken } from '../typechain-types/contracts/MockToken';

const developmentChains = ['hardhat', 'localhost'];
const VERIFICATION_BLOCK_CONFIRMATIONS = 6;

const deployMockToken: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  // @ts-ignore
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = network.config.chainId;
  let mockToken: MockToken;

  if (chainId == 31337) {
    const waitBlockConfirmations = developmentChains.includes(network.name)
      ? 1
      : VERIFICATION_BLOCK_CONFIRMATIONS;

    log('----------------------------------------------------');

    await deploy('MockToken', {
      from: deployer,
      log: true,
      waitConfirmations: waitBlockConfirmations
    });
    
    // mockToken = await ethers.getContract('MockToken');

    log('----------------------------------------------------');
  }
};

export default deployMockToken;
deployMockToken.tags = ['all', 'MockToken'];

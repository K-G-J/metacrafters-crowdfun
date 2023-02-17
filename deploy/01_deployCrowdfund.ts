import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { BigNumber, ethers } from 'ethers';
import { MockToken } from '../typechain-types/contracts/MockToken';
import { Crowdfund } from '../typechain-types';
import verify from '../utils/verify';

interface IInitArgs {
  tokenAddress: string;
  min_duration: BigNumber;
  max_duration: BigNumber;
}

const developmentChains = ['hardhat', 'localhost'];
const VERIFICATION_BLOCK_CONFIRMATIONS = 6;

// If not deploying on localhost
const tokenAddress = 'custom token address';
const min_duration = ethers.BigNumber.from('30'); // 30 seconds
const max_duration = ethers.BigNumber.from('120'); // 2 minutes

const deployCrowdfund: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  // @ts-ignore
  const { deployments, getNamedAccounts, network, ethers } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = network.config.chainId;
  let mockToken: MockToken, crowdfund: Crowdfund;

  if (chainId == 31337) {
    mockToken = await ethers.getContract('MockToken');

    const waitBlockConfirmations = developmentChains.includes(network.name)
      ? 1
      : VERIFICATION_BLOCK_CONFIRMATIONS;

    log('----------------------------------------------------');

    const initArgs: IInitArgs = {
      tokenAddress: mockToken.address,
      min_duration: ethers.BigNumber.from('30'), // 30 seconds
      max_duration: ethers.BigNumber.from('120') // two minutes
    };

    await deploy('Crowdfund', {
      from: deployer,
      log: true,
      waitConfirmations: waitBlockConfirmations
    });

    log('----------------------------------------------------');

    log('Initializing Crowdfund');
    crowdfund = await ethers.getContract('Crowdfund');
    const initTx = await crowdfund.initialize(
      initArgs.tokenAddress,
      initArgs.min_duration,
      initArgs.max_duration
    );
    initTx.wait(1);
    log('Crowdfund initialized');
  } else {
    const waitBlockConfirmations = developmentChains.includes(network.name)
      ? 1
      : VERIFICATION_BLOCK_CONFIRMATIONS;

    log('----------------------------------------------------');

    const initArgs: IInitArgs = {
      tokenAddress: tokenAddress,
      min_duration: min_duration,
      max_duration: max_duration
    };

    await deploy('Crowdfund', {
      from: deployer,
      log: true,
      waitConfirmations: waitBlockConfirmations
    });

    log('Initializing Crowdfund');
    crowdfund = await ethers.getContract('Crowdfund');
    const initTx = await crowdfund.initialize(
      initArgs.tokenAddress,
      initArgs.min_duration,
      initArgs.max_duration
    );
    initTx.wait(1);
    log('Crowdfund initialized');

    // Verify the deployment
    if (
      !developmentChains.includes(network.name) &&
      process.env.ETHERSCAN_API_KEY
    ) {
      log('Verifying...');
      await verify(crowdfund.address, []);
    }
    log('----------------------------------------------------');
  }
};

export default deployCrowdfund;
deployCrowdfund.tags = ['all', 'crowdfund'];

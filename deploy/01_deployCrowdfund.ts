import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { BigNumber, ethers } from 'ethers';
import { MockToken } from '../typechain-types/contracts/MockToken';
import { Crowdfund } from '../typechain-types';
import verify from '../utils/verify';

import {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS
} from '../helper-hardhat-config';

interface IInitArgs {
  tokenAddress: string;
  min_duration: BigNumber;
  max_duration: BigNumber;
}

const deployCrowdfund: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  // @ts-ignore
  const { deployments, getNamedAccounts, network, ethers } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const chainId = network.config.chainId;
  let mockToken: MockToken, crowdfund: Crowdfund;

  const initArgs: IInitArgs = {
    tokenAddress: networkConfig[network.config.chainId!]['tokenAddress'],
    min_duration: networkConfig[network.config.chainId!]['min_duration'],
    max_duration: networkConfig[network.config.chainId!]['max_duration']
  };

  if (chainId == 31337) {
    mockToken = await ethers.getContract('MockToken');

    const waitBlockConfirmations = developmentChains.includes(network.name)
      ? 1
      : VERIFICATION_BLOCK_CONFIRMATIONS;

    log('----------------------------------------------------');

    initArgs.tokenAddress = mockToken.address;

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

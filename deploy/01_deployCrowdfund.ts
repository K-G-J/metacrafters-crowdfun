import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ethers } from "hardhat"
import { BytesLike, BigNumber } from "ethers"

const developmentChains = ['hardhat', 'localhost'];
const VERIFICATION_BLOCK_CONFIRMATIONS = 6;

import verify from '../utils/verify';

const MIN_DURATION: BigNumber = ethers.BigNumber.from("30") // 30 seconds
const MAX_DURATION = ethers.BigNumber.from("120") // two minutes
const PLEDGE_AMOUNT = ethers.utils.parseEther("1");

const deployCrowdfund: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  // @ts-ignore
  const { deployments, getNamedAccounts, network, ethers } = hre;
  const { deploy, log } = deployments;
  const { deployer, pledger1, pledger2 } = await getNamedAccounts();

  const chainId = network.config.chainId;

  if (chainId == 31337) {
    
    const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS;

  log('----------------------------------------------------');
  const initArgs: any[] = [
    // mockToken address
    MIN_DURATION,
    MAX_DURATION
  ];
  const crowdfund = await deploy('Crowdfund', {
    from: deployer,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  });

  // Verify the deployment
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log('Verifying...');
    await verify(crowdfund.address, []);
  }
  log('----------------------------------------------------');
  };
  
export default deployCrowdfund;
deployCrowdfund.tags = ['all', 'crowdfund'];

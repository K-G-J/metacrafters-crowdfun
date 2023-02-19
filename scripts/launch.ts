import { ethers, getNamedAccounts, network } from 'hardhat';
import { Crowdfund } from '../typechain-types';
import { BigNumber } from 'ethers';
import { networkConfig } from '../helper-hardhat-config';

const chainId = network.config.chainId;
const CAMPAIGN_GOAL: BigNumber = ethers.utils.parseEther('5');
const currentTimestampInSeconds = Math.round(Date.now() / 1000);

export default async function launch(
  campaignGoal: BigNumber,
  account?: string
): Promise<void> {
  if (chainId == 31337) {
    const deployer = (await getNamedAccounts()).deployer;
    const crowdfund: Crowdfund = await ethers.getContract('Crowdfund');

    const minDuation =
      networkConfig[network.config.chainId!]['min_duration'].toNumber();
    const maxDuation =
      networkConfig[network.config.chainId!]['max_duration'].toNumber();

    await crowdfund
      .connect(deployer)
      .launch(
        campaignGoal,
        currentTimestampInSeconds + minDuation,
        currentTimestampInSeconds + maxDuation
      );

    console.log('Campaign launched!');
  } else {
    const crowdfund: Crowdfund = await ethers.getContract('Crowdfund');

    const minDuation =
      networkConfig[network.config.chainId!]['min_duration'].toNumber();
    const maxDuation =
      networkConfig[network.config.chainId!]['max_duration'].toNumber();

    await crowdfund
      .connect(account!)
      .launch(
        campaignGoal,
        currentTimestampInSeconds + minDuation,
        currentTimestampInSeconds + maxDuation
      );

    console.log('Campaign launched!');
  }
}

launch(CAMPAIGN_GOAL)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

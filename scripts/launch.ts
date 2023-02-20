import { ethers, getNamedAccounts, network } from 'hardhat';
import { Crowdfund } from '../typechain-types';
import { BigNumber } from 'ethers';
import { networkConfig } from '../helper-hardhat-config';

const chainId = network.config.chainId;
const CAMPAIGN_GOAL: BigNumber = ethers.utils.parseEther('5');
const currentTimestampInSeconds = Math.round(Date.now() / 1000);

// yarn hardhat run scripts/launch.ts --network localhost

export default async function launch(
  campaignGoal: BigNumber,
  account?: string
): Promise<void> {
  if (chainId == 31337) {
    const deployer = (await getNamedAccounts()).deployer;
    const signer = ethers.provider.getSigner(deployer);

    const crowdfund: Crowdfund = await ethers.getContract('Crowdfund');

    const minDuation =
      networkConfig[network.config.chainId!]['min_duration'].toNumber();
    const maxDuation =
      networkConfig[network.config.chainId!]['max_duration'].toNumber();

    await crowdfund
      .connect(signer)
      .launch(
        campaignGoal,
        currentTimestampInSeconds + minDuation,
        currentTimestampInSeconds + maxDuation
      );

    console.log(
      `\nCampaign launched!\nCampaign Goal: ${ethers.utils.formatEther(
        campaignGoal
      )}\n`
    );
  } else {
    const crowdfund: Crowdfund = await ethers.getContract('Crowdfund');
    const signer = ethers.provider.getSigner(account!);

    const minDuation =
      networkConfig[network.config.chainId!]['min_duration'].toNumber();
    const maxDuation =
      networkConfig[network.config.chainId!]['max_duration'].toNumber();

    await crowdfund
      .connect(signer)
      .launch(
        campaignGoal,
        currentTimestampInSeconds + minDuation,
        currentTimestampInSeconds + maxDuation
      );

    console.log(
      `\nCampaign launched!\nCampaign Goal: ${ethers.utils.formatEther(
        campaignGoal
      )}\n`
    );
  }
}

launch(CAMPAIGN_GOAL)
  .then(() => process.exit(0))
  .catch((error) => {
    const reason = error.reason
      .replace(
        'Error: VM Exception while processing transaction: reverted with reason string ',
        ''
      )
      .replace(/[']/g, '');
    reason.replace("''", '');
    console.log(`\n\n${reason}\n\n`);
    process.exit(1);
  });

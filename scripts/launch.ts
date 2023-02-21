import promptSync from 'prompt-sync';
import { ethers, getNamedAccounts, network } from 'hardhat';
import { Crowdfund } from '../typechain-types';
import { BigNumber } from 'ethers';
import { networkConfig } from '../helper-hardhat-config';
import {
  getAccount,
  getCampaignGoal,
  getEndAt,
  getStartAt
} from './lib/prompts';

const chainId = network.config.chainId;
let campaignGoal: BigNumber, account: string;

// yarn hardhat run scripts/launch.ts --network localhost

export default async function launch(
  campaignGoal: BigNumber,
  account?: string
): Promise<void> {
  if (chainId == 31337) {
    const deployer = (await getNamedAccounts()).deployer;
    const signer = ethers.provider.getSigner(deployer);

    const crowdfund: Crowdfund = await ethers.getContract('Crowdfund');

    const currentTimestampInSeconds = ethers.BigNumber.from(
      Math.round(Date.now() / 1000)
    );
    const minDuation = networkConfig[network.config.chainId!]['min_duration'];
    const maxDuation = networkConfig[network.config.chainId!]['max_duration'];

    await crowdfund
      .connect(signer)
      .launch(
        campaignGoal,
        currentTimestampInSeconds.add(minDuation),
        currentTimestampInSeconds.add(maxDuation)
      );

    console.log(
      `\nCampaign launched!\nCampaign Goal: ${ethers.utils.formatEther(
        campaignGoal
      )}\n`
    );
  } else {
    const crowdfund: Crowdfund = await ethers.getContract('Crowdfund');
    const signer = ethers.provider.getSigner(account!);

    const startAt = await getStartAt();
    const endAt = await getEndAt();

    await crowdfund.connect(signer).launch(campaignGoal, startAt, endAt);

    console.log(
      `\nCampaign launched!\nCampaign Goal: ${ethers.utils.formatEther(
        campaignGoal
      )}\n`
    );
  }
}

const prompt = promptSync({ sigint: true });

(async () => {
  do {
    const answer = prompt('Are you on localhost? [y/n] ');
    switch (answer.toLowerCase()) {
      case 'y':
        campaignGoal = await getCampaignGoal();
        await launch(campaignGoal)
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
        break;
      case 'n':
        account = await getAccount();
        campaignGoal = await getCampaignGoal();
        await launch(campaignGoal, account)
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
        break;
      default:
        console.log('Invalid answer');
        continue;
    }
  } while (true);
})();

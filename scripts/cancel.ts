import { ethers, getNamedAccounts, network } from 'hardhat';
import { Crowdfund } from '../typechain-types';
import { BigNumber } from 'ethers';
import promptSync from 'prompt-sync';
import { getAccount, getCampaignId } from './lib/prompts';

const chainId = network.config.chainId;
let campaignId: number, account: string;

// yarn hardhat run scripts/cancel.ts --network localhost

export default async function cancel(
  campaignId: number,
  account?: string
): Promise<void> {
  if (chainId == 31337) {
    const deployer = (await getNamedAccounts()).deployer;
    const signer = ethers.provider.getSigner(deployer);
    const crowdfund: Crowdfund = await ethers.getContract('Crowdfund');

    await crowdfund.connect(signer).cancel(campaignId);
    console.log(`\nCancelled Campaign Id: ${campaignId}\n`);
  } else {
    const crowdfund: Crowdfund = await ethers.getContract('Crowdfund');
    const signer = ethers.provider.getSigner(account!);

    await crowdfund.connect(signer).cancel(campaignId);
    console.log(`\nCancelled Campaign Id: ${campaignId}\n`);
  }
}

const prompt = promptSync({ sigint: true });

(async () => {
  do {
    const answer = prompt('Are you on localhost? [y/n] ');
    switch (answer.toLowerCase()) {
      case 'y':
        campaignId = await getCampaignId();
        await cancel(campaignId)
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
        campaignId = await getCampaignId();
        await cancel(campaignId, account)
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

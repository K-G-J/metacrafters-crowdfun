import { ethers, getNamedAccounts, network } from 'hardhat';
import { Crowdfund } from '../typechain-types';
import { BigNumber } from 'ethers';
import promptSync from 'prompt-sync';
import { getAccount, getCampaignId } from './lib/prompts';

const chainId = network.config.chainId;
let campaignId: number, account: string;

// yarn hardhat run scripts/refund.ts --network localhost

export default async function refund(
  campaignId: number,
  account?: string
): Promise<void> {
  if (chainId == 31337) {
    const pledger1 = (await getNamedAccounts()).pledger1;
    const signer = ethers.provider.getSigner(pledger1);
    const crowdfund: Crowdfund = await ethers.getContract('Crowdfund');

    const totalDonated: BigNumber = await crowdfund
      .connect(signer)
      .pledgedAmount(campaignId, pledger1);

    await crowdfund.connect(signer).refund(campaignId);
    console.log(`\nRefunded ${ethers.utils.formatEther(totalDonated)}\n`);
  } else {
    const crowdfund: Crowdfund = await ethers.getContract('Crowdfund');
    const signer = ethers.provider.getSigner(account!);

    const totalDonated: BigNumber = await crowdfund
      .connect(signer)
      .pledgedAmount(campaignId, account!);

    await crowdfund.connect(signer).refund(campaignId);
    console.log(`\nRefunded ${ethers.utils.formatEther(totalDonated)}\n`);
  }
}

const prompt = promptSync({ sigint: true });

(async () => {
  do {
    const answer = prompt('Are you on localhost? [y/n] ');
    switch (answer.toLowerCase()) {
      case 'y':
        campaignId = await getCampaignId();
        refund(campaignId)
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
        refund(campaignId, account)
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

import { ethers, getNamedAccounts, network } from 'hardhat';
import { Crowdfund } from '../typechain-types';
import { BigNumber } from 'ethers';
import promptSync from 'prompt-sync';
import { getAccount, getAmount, getCampaignId } from './lib/prompts';

const chainId = network.config.chainId;
let campaignId: number, amount: BigNumber, account: string;

// yarn hardhat run scripts/unpledge.ts --network localhost

export default async function unpledge(
  campaignId: number,
  amount: BigNumber,
  account?: string
): Promise<void> {
  if (chainId == 31337) {
    const pledger1 = (await getNamedAccounts()).pledger1;
    const signer = ethers.provider.getSigner(pledger1);
    const crowdfund: Crowdfund = await ethers.getContract('Crowdfund');

    await crowdfund.connect(signer).unpledge(campaignId, amount);
    console.log(`\nUnpledged ${ethers.utils.formatEther(amount)}!`);

    const totalDonated: BigNumber = await crowdfund
      .connect(signer)
      .pledgedAmount(campaignId, pledger1);
    console.log(`\nTotal Donated: ${ethers.utils.formatEther(totalDonated)}\n`);
  } else {
    const crowdfund: Crowdfund = await ethers.getContract('Crowdfund');
    const signer = ethers.provider.getSigner(account!);

    await crowdfund.connect(signer).unpledge(campaignId, amount);
    console.log(`\nUnpledged ${ethers.utils.formatEther(amount)}!`);

    const totalDonated: BigNumber = await crowdfund
      .connect(signer)
      .pledgedAmount(campaignId, account!);
    console.log(`\nTotal Donated: ${ethers.utils.formatEther(totalDonated)}\n`);
  }
}

const prompt = promptSync({ sigint: true });

(async () => {
  do {
    const answer = prompt('Are you on localhost? [y/n] ');
    switch (answer.toLowerCase()) {
      case 'y':
        campaignId = await getCampaignId();
        amount = await getAmount('unpledge');
        await unpledge(campaignId, amount)
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
        amount = await getAmount('unpledge');
        await unpledge(campaignId, amount, account)
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

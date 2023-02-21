import { ethers, getNamedAccounts, network } from 'hardhat';
import { MockToken, Crowdfund, IERC20 } from '../typechain-types';
import { BigNumber } from 'ethers';
import { networkConfig } from '../helper-hardhat-config';
import { getAccount, getAmount, getCampaignId } from './lib/prompts';
import promptSync from 'prompt-sync';

const chainId = network.config.chainId;
let campaignId: number, amount: BigNumber, account: string;

// yarn hardhat run scripts/pledge.ts --network localhost

export default async function pledge(
  campaignId: number,
  amount: BigNumber,
  account?: string
): Promise<void> {
  if (chainId == 31337) {
    const pledger1 = (await getNamedAccounts()).pledger1;
    const signer = ethers.provider.getSigner(pledger1);

    const crowdfund: Crowdfund = await ethers.getContract('Crowdfund');
    const mockToken: MockToken = await ethers.getContract('MockToken');

    await mockToken.connect(signer).mint(pledger1, amount);
    await mockToken.connect(signer).approve(crowdfund.address, amount);

    await crowdfund.connect(signer).pledge(campaignId, amount);
    console.log(`\nPledged ${ethers.utils.formatEther(amount)}!`);

    const totalDonated: BigNumber = await crowdfund
      .connect(signer)
      .pledgedAmount(campaignId, pledger1);
    console.log(`\nTotal Donated: ${ethers.utils.formatEther(totalDonated)}\n`);
  } else {
    const crowdfund: Crowdfund = await ethers.getContract('Crowdfund');
    const tokenAddress = networkConfig[network.config.chainId!]['tokenAddress'];
    const token: IERC20 = await ethers.getContractAt('IERC20', tokenAddress);
    const signer = ethers.provider.getSigner(account!);

    await token.connect(signer).approve(crowdfund.address, amount);

    await crowdfund.connect(signer).pledge(campaignId, amount);
    console.log(`\nPledged ${ethers.utils.formatEther(amount)}!`);

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
        amount = await getAmount('pledge');
        await pledge(campaignId, amount)
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
        amount = await getAmount('pledge');
        await pledge(campaignId, amount, account)
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

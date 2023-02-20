import { ethers, getNamedAccounts, network } from 'hardhat';
import { Crowdfund } from '../typechain-types';
import { BigNumber } from 'ethers';

const chainId = network.config.chainId;
const UNPLEDGE_AMOUNT: BigNumber = ethers.utils.parseEther('.25');

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

    await crowdfund.connect(account!).unpledge(campaignId, amount);
    console.log(`\nUnpledged ${ethers.utils.formatEther(amount)}!`);

    const totalDonated: BigNumber = await crowdfund
      .connect(signer)
      .pledgedAmount(campaignId, account!);
    console.log(`\nTotal Donated: ${ethers.utils.formatEther(totalDonated)}\n`);
  }
}

unpledge(1, UNPLEDGE_AMOUNT)
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

import { ethers, getNamedAccounts, network } from 'hardhat';
import { MockToken, Crowdfund, IERC20 } from '../typechain-types';
import { BigNumber } from 'ethers';
import { networkConfig } from '../helper-hardhat-config';

const chainId = network.config.chainId;
const PLEDGE_AMOUNT: BigNumber = ethers.utils.parseEther('1');

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
    console.log(`\nPledged ${amount.toNumber()}!\n`);

    const totalDonated: BigNumber = await crowdfund
      .connect(signer)
      .pledgedAmount(campaignId, pledger1);
    console.log(`\nTotal Donated: ${totalDonated.toNumber()}\n`);
  } else {
    const crowdfund: Crowdfund = await ethers.getContract('Crowdfund');
    const tokenAddress = networkConfig[network.config.chainId!]['tokenAddress'];
    const token = await ethers.getContractAt('IERC20', tokenAddress);
    const signer = ethers.provider.getSigner(account!);

    await token.connect(signer).approve(crowdfund.address, amount);

    await crowdfund.connect(account!).pledge(campaignId, amount);
    console.log(`\nPledged ${amount.toNumber()}!\n`);

    const totalDonated: BigNumber = await crowdfund
      .connect(signer)
      .pledgedAmount(campaignId, account!);
    console.log(`\nTotal Donated: ${totalDonated.toNumber()}\n`);
  }
}

pledge(1, PLEDGE_AMOUNT)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

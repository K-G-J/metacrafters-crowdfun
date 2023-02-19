import { ethers, getNamedAccounts, network } from 'hardhat';
import { MockToken, Crowdfund, IERC20 } from '../typechain-types';
import { BigNumber } from 'ethers';
import { networkConfig } from '../helper-hardhat-config';

const chainId = network.config.chainId;
const UNPLEDGE_AMOUNT: BigNumber = ethers.utils.parseEther('.25');

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
    console.log(`unpledged ${amount}!`);
  } else {
    const crowdfund: Crowdfund = await ethers.getContract('Crowdfund');
    const signer = ethers.provider.getSigner(account!);

    await crowdfund.connect(account!).unpledge(campaignId, amount);
    console.log(`unpledged ${amount}!`);
  }
}

unpledge(1, UNPLEDGE_AMOUNT)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// @ts-ignore
import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';

export interface networkConfigItem {
  name: string;
  tokenAddress: string;
  min_duration: BigNumber;
  max_duration: BigNumber;
}

export interface networkConfigInfo {
  [key: number]: networkConfigItem;
}

export const networkConfig: networkConfigInfo = {
  31337: {
    name: 'localhost',
    tokenAddress: '', // will be set to MockToken address in 01_deployCrowdfund script
    min_duration: ethers.BigNumber.from('30'), // 30 seconds
    max_duration: ethers.BigNumber.from('120') // two minutes
  },
  5: {
    name: 'goerli',
    tokenAddress: 'custom token address',
    min_duration: ethers.BigNumber.from('30'), // 30 seconds
    max_duration: ethers.BigNumber.from('120') // two minutes
  }
};

export const developmentChains = ['hardhat', 'localhost'];
export const VERIFICATION_BLOCK_CONFIRMATIONS = 6;

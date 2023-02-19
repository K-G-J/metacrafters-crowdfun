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

const exampleMinDuration = ethers.BigNumber.from(1 * 24 * 60 * 60); // 1 day in seconds
const exampleMaxDuration = ethers.BigNumber.from(30 * 24 * 60 * 60); // 30 days in seconds

export const networkConfig: networkConfigInfo = {
  31337: {
    name: 'localhost',
    tokenAddress: '', // will be set to MockToken address in 01_deployCrowdfund script
    min_duration: ethers.BigNumber.from('30'), // 30 seconds
    max_duration: ethers.BigNumber.from('60') // 1 minute
  },
  5: {
    name: 'goerli',
    tokenAddress: 'custom token address',
    min_duration: exampleMinDuration,
    max_duration: exampleMaxDuration
  },
  137: {
    name: 'polygon',
    tokenAddress: 'custom token address',
    min_duration: exampleMinDuration,
    max_duration: exampleMaxDuration
  },
  1: {
    name: 'mainnet',
    tokenAddress: 'custom token address',
    min_duration: exampleMinDuration,
    max_duration: exampleMaxDuration
  }
};

export const developmentChains = ['hardhat', 'localhost'];
export const VERIFICATION_BLOCK_CONFIRMATIONS = 6;

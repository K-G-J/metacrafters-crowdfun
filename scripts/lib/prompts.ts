import promptSync from 'prompt-sync';
import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';

export const isNumber = (n: any): boolean => {
  return !isNaN(parseFloat(n)) && !isNaN(n - 0);
};

const prompt = promptSync({ sigint: true });

export const getCampaignId = async (): Promise<number> => {
  let id = prompt('What is the campaign ID?  ');
  while (!isNumber(id)) {
    console.log(`${id} is not a valid number`);
    id = prompt('What is the campaign ID?  ');
  }
  return Number(id);
};

export const getAccount = async (): Promise<string> => {
  let address = prompt('What is your address?  ');
  while (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
    console.log(`\n${address} is not a valid address\n`);
    address = prompt('What is your address?  ');
  }
  return address;
};

export const getAmount = async (
  choice: 'pledge' | 'unpledge'
): Promise<BigNumber> => {
  let amount = prompt(`How much would you like to ${choice}?  `);
  while (!isNumber(amount)) {
    console.log(`${amount} is not a valid number`);
    amount = prompt(`How much would you like to ${choice}?  `);
  }
  return ethers.utils.parseEther(amount);
};

export const getCampaignGoal = async (): Promise<BigNumber> => {
  let goal = prompt('What is the campaign goal?  ');
  while (!isNumber(goal)) {
    console.log(`${goal} is not a valid number`);
    goal = prompt('What is the campaign goal?  ');
  }
  return ethers.utils.parseEther(goal);
};

export const getStartAt = async (): Promise<BigNumber> => {
  let startAt = prompt('When does the campaign start?  ');
  while (!isNumber(startAt)) {
    console.log(`${startAt} is not a valid number`);
    startAt = prompt('When does the campaign start?  ');
  }
  return ethers.BigNumber.from(startAt);
};

export const getEndAt = async (): Promise<BigNumber> => {
  let endAt = prompt('When does the campaign end?  ');
  while (!isNumber(endAt)) {
    console.log(`${endAt} is not a valid number`);
    endAt = prompt('When does the campaign end?  ');
  }
  return ethers.BigNumber.from(endAt);
};

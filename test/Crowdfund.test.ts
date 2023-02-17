import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { assert, expect } from 'chai';
import { BigNumber } from 'ethers';
import { network, deployments, ethers, getNamedAccounts } from 'hardhat';
import { developmentChains } from '../helper-hardhat-config';
import { MockToken, Crowdfund } from '../typechain-types';
import { expectValue, expectRevert, expectEvent } from './utils/expectValue';

let mockToken: MockToken,
  crowdfund: Crowdfund,
  deployer: string,
  pledger1: string,
  pledger2: string,
  minDuration: BigNumber,
  maxDuration: BigNumber,
  donationAmount: BigNumber,
  campaignGoal: BigNumber;

async function setUp(): Promise<void> {
  const accounts = await getNamedAccounts();
  deployer = accounts.deployer;
  pledger1 = accounts.pledger1;
  pledger2 = accounts.pledger2;
  await deployments.fixture(['mockToken', 'crowdfund']);
  mockToken = await ethers.getContract('MockToken');
  crowdfund = await ethers.getContract('Crowdfund');
  minDuration = await crowdfund.minDuration();
  maxDuration = await crowdfund.maxDuration();
  donationAmount = ethers.utils.parseEther('1');
  campaignGoal = ethers.utils.parseEther('5');
}

// hh test --grep "Crowdfund Unit Tests"

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('Crowdfund Unit Tests', function () {
      beforeEach(async () => {
        await setUp();
      });
      describe('initialize', function () {});
      describe('launch', function () {});
      describe('cancel', function () {});
      describe('pledge', function () {});
      describe('unpledge', function () {});
      describe('claim', function () {});
      describe('refund', function () {});
    });

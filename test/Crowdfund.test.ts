import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { assert, expect } from 'chai';
import { BigNumber } from 'ethers';
import {
  network,
  deployments,
  ethers,
  getNamedAccounts,
  getChainId
} from 'hardhat';
import { developmentChains, networkConfig } from '../helper-hardhat-config';
import { MockToken, Crowdfund } from '../typechain-types';
import { expectValue, expectRevert, expectEvent } from './utils/expectValue';

let mockToken: MockToken,
  crowdfund: Crowdfund,
  deployer: SignerWithAddress,
  pledger1: SignerWithAddress,
  pledger2: SignerWithAddress,
  minDuration: BigNumber,
  maxDuration: BigNumber,
  donationAmount: BigNumber,
  campaignGoal: BigNumber;

async function setUp(): Promise<void> {
  const accounts = await ethers.getNamedSigners();
  deployer = accounts.deployer;
  pledger1 = accounts.pledger1;
  pledger2 = accounts.pledger2;
  await deployments.fixture(['mocktoken', 'crowdfund']);
  mockToken = await ethers.getContract('MockToken');
  crowdfund = await ethers.getContract('Crowdfund');
  minDuration = await crowdfund.minDuration();
  maxDuration = await crowdfund.maxDuration();
  donationAmount = ethers.utils.parseEther('1');
  campaignGoal = ethers.utils.parseEther('5');
}

// hh test --network localhost --grep "Crowdfund Unit Tests"

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('Crowdfund Unit Tests', function () {
      beforeEach(async () => {
        await setUp();
      });
      describe('initialize', function () {
        it('should not allow contract to be initialized again', async () => {
          await expectRevert(
            crowdfund.initialize(
              mockToken.address,
              ethers.BigNumber.from('60'),
              ethers.BigNumber.from('180')
            ),
            'Initializable: contract is already initialized'
          );
        });
        it('should initialize the contract', async () => {
          expectValue(await crowdfund.token(), mockToken.address);
          expectValue(
            await crowdfund.minDuration(),
            networkConfig[network.config.chainId!].min_duration
          );
          expectValue(
            await crowdfund.maxDuration(),
            networkConfig[network.config.chainId!].max_duration
          );
          assert.equal(await crowdfund.token(), mockToken.address);
          assert.equal(
            (await crowdfund.minDuration()).toString(),
            ethers.BigNumber.from('30').toString()
          );
          assert.equal(
            (await crowdfund.maxDuration()).toString(),
            ethers.BigNumber.from('60').toString()
          );
        });
      });
      describe('launch', function () {
        let blockTimestamp: number;
        beforeEach(async () => {
          blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
        });
        it('should revert if campaign start < now', async () => {
          const startAt = blockTimestamp - 30;
          await expectRevert(
            crowdfund.launch(
              campaignGoal,
              startAt,
              blockTimestamp + Number(minDuration)
            ),
            'start at < now'
          );
          expectValue((await crowdfund.campaigns(1)).id, 0);
        });
        it('should revert if campaign too short', async () => {
          const startAt = blockTimestamp + 30;
          const endAt = startAt + (Number(minDuration) - 10);
          assert(endAt < startAt + Number(minDuration));
          await expectRevert(
            crowdfund.launch(campaignGoal, startAt, endAt),
            'not in min & max duration'
          );
          expectValue((await crowdfund.campaigns(1)).id, 0);
        });
        it('should revert if campaign too long', async () => {
          const startAt = blockTimestamp + 30;
          const endAt = startAt + (Number(maxDuration) + 30);
          assert(endAt > startAt + Number(maxDuration));
          await expectRevert(
            crowdfund.launch(campaignGoal, startAt, endAt),
            'not in min & max duration'
          );
          expectValue((await crowdfund.campaigns(1)).id, 0);
        });
        it('should create a campaign', async () => {
          const startAt = blockTimestamp + 30;
          const minTime = startAt + Number(minDuration);
          const maxTime = startAt + Number(maxDuration);
          const endAt = minTime + 15; // minDuration + 15 seconds
          assert(minTime < endAt && endAt < maxTime);
          await crowdfund.launch(campaignGoal, startAt, endAt);
          expectValue((await crowdfund.campaigns(1)).id, 1);
          expectValue((await crowdfund.campaigns(1)).creator, deployer.address);
          expectValue((await crowdfund.campaigns(1)).goal, campaignGoal);
          expectValue((await crowdfund.campaigns(1)).pledged, 0);
          expectValue((await crowdfund.campaigns(1)).startAt, startAt);
          expectValue((await crowdfund.campaigns(1)).endAt, endAt);
          expectValue((await crowdfund.campaigns(1)).claimed, 0);
          expectValue((await crowdfund.campaigns(1)).cancelled, false);
        });
        it('should admit a Launch event', async () => {
          const startAt = blockTimestamp + 30;
          const minTime = startAt + Number(minDuration);
          const endAt = minTime + 15; // minDuration + 15 seconds
          expectEvent(
            await crowdfund.launch(campaignGoal, startAt, endAt),
            crowdfund,
            'Launch',
            [1, deployer.address, campaignGoal, startAt, endAt]
          );
        });
      });
      describe('cancel', function () {});
      describe('pledge', function () {});
      describe('unpledge', function () {});
      describe('claim', function () {});
      describe('refund', function () {});
    });

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
import { time } from '@nomicfoundation/hardhat-network-helpers';
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
  campaignGoal: BigNumber,
  startAt: number,
  endAt: number;

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
  await mockToken.mint(pledger1.address, donationAmount);
  await mockToken.mint(pledger2.address, donationAmount);
  const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
  startAt = blockTimestamp + 30;
  endAt = startAt + Number(minDuration) + 15;
}

async function launchCampaign(): Promise<void> {
  await crowdfund.launch(campaignGoal, startAt, endAt);
  await expectValue((await crowdfund.campaigns(1)).id, 1);
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
          await expectValue(await crowdfund.token(), mockToken.address);
          await expectValue(
            await crowdfund.minDuration(),
            networkConfig[network.config.chainId!].min_duration
          );
          await expectValue(
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
          await expectValue((await crowdfund.campaigns(1)).id, 0);
        });
        it('should revert if campaign too short', async () => {
          const startAt = blockTimestamp + 30;
          const endAt = startAt + (Number(minDuration) - 10);
          assert(endAt < startAt + Number(minDuration));
          await expectRevert(
            crowdfund.launch(campaignGoal, startAt, endAt),
            'not in min & max duration'
          );
          await expectValue((await crowdfund.campaigns(1)).id, 0);
        });
        it('should revert if campaign too long', async () => {
          const startAt = blockTimestamp + 30;
          const endAt = startAt + (Number(maxDuration) + 30);
          assert(endAt > startAt + Number(maxDuration));
          await expectRevert(
            crowdfund.launch(campaignGoal, startAt, endAt),
            'not in min & max duration'
          );
          await expectValue((await crowdfund.campaigns(1)).id, 0);
        });
        it('should create a campaign', async () => {
          const startAt = blockTimestamp + 30;
          const minTime = startAt + Number(minDuration);
          const maxTime = startAt + Number(maxDuration);
          const endAt = minTime + 15; // minDuration + 15 seconds
          assert(minTime < endAt && endAt < maxTime);
          await crowdfund.launch(campaignGoal, startAt, endAt);
          await expectValue((await crowdfund.campaigns(1)).id, 1);
          await expectValue(
            (
              await crowdfund.campaigns(1)
            ).creator,
            deployer.address
          );
          await expectValue((await crowdfund.campaigns(1)).goal, campaignGoal);
          await expectValue((await crowdfund.campaigns(1)).pledged, 0);
          await expectValue((await crowdfund.campaigns(1)).startAt, startAt);
          await expectValue((await crowdfund.campaigns(1)).endAt, endAt);
          await expectValue((await crowdfund.campaigns(1)).claimed, false);
          await expectValue((await crowdfund.campaigns(1)).cancelled, false);
        });
        it('should admit a Launch event', async () => {
          const startAt = blockTimestamp + 30;
          const minTime = startAt + Number(minDuration);
          const endAt = minTime + 15; // minDuration + 15 seconds
          await expectEvent(
            await crowdfund.launch(campaignGoal, startAt, endAt),
            crowdfund,
            'Launch',
            [1, deployer.address, campaignGoal, startAt, endAt]
          );
        });
      });
      describe('cancel', function () {
        beforeEach(async () => {
          await launchCampaign();
        });
        it('should revert if campaign does not exist', async () => {
          await expectRevert(crowdfund.cancel(2), 'campaign does not exist');
          await expectValue((await crowdfund.campaigns(1)).cancelled, false);
        });
        it('should revert if not creator', async () => {
          await expectRevert(
            crowdfund.connect(pledger1).cancel(1),
            'not creator'
          );
          await expectValue((await crowdfund.campaigns(1)).cancelled, false);
        });
        it('should cancel the campaign', async () => {
          await crowdfund.cancel(1);
          await expectValue((await crowdfund.campaigns(1)).cancelled, true);
        });
        it('should revert if already cancelled', async () => {
          await crowdfund.cancel(1);
          await expectValue((await crowdfund.campaigns(1)).cancelled, true);
          await expectRevert(crowdfund.cancel(1), 'campaign cancelled');
          await expectValue((await crowdfund.campaigns(1)).cancelled, true);
        });
        it('should admit a Cancel event', async () => {
          await expectEvent(await crowdfund.cancel(1), crowdfund, 'Cancel', [
            1
          ]);
          await expectValue((await crowdfund.campaigns(1)).cancelled, true);
        });
      });
      describe('pledge', function () {
        beforeEach(async () => {
          await launchCampaign();
        });
        it('should revert if campaign does not exist', async () => {
          await expectRevert(
            crowdfund.connect(pledger1).pledge(2, donationAmount),
            'campaign does not exist'
          );
          await expectValue((await crowdfund.campaigns(1)).pledged, 0);
        });
        it('should revert if campaign cancelled', async () => {
          await crowdfund.cancel(1);
          await expectValue((await crowdfund.campaigns(1)).cancelled, true);
          await expectRevert(
            crowdfund.connect(pledger1).pledge(1, donationAmount),
            'campaign cancelled'
          );
          await expectValue((await crowdfund.campaigns(1)).pledged, 0);
        });
        it('should revert if campaign not started', async () => {
          await expectRevert(
            crowdfund.connect(pledger1).pledge(1, donationAmount),
            'campaign not started'
          );
          await expectValue((await crowdfund.campaigns(1)).pledged, 0);
        });
        it('should revert if campaign ended', async () => {
          await time.increaseTo(endAt + 30);
          await expectRevert(
            crowdfund.connect(pledger1).pledge(1, donationAmount),
            'campaign ended'
          );
          await expectValue((await crowdfund.campaigns(1)).pledged, 0);
        });
        it('should pledge donation amount to campaign', async () => {
          await time.increaseTo(startAt);
          await mockToken
            .connect(pledger1)
            .approve(crowdfund.address, donationAmount);
          await crowdfund.connect(pledger1).pledge(1, donationAmount);
          await expectValue(
            (
              await crowdfund.campaigns(1)
            ).pledged,
            donationAmount
          );
        });
        it('should emit a Pledged event', async () => {
          await time.increaseTo(startAt);
          await mockToken
            .connect(pledger1)
            .approve(crowdfund.address, donationAmount);
          await expectEvent(
            await crowdfund.connect(pledger1).pledge(1, donationAmount),
            crowdfund,
            'Pledged',
            [1, pledger1.address, donationAmount]
          );
        });
      });
      describe('unpledge', function () {});
      describe('claim', function () {});
      describe('refund', function () {});
    });

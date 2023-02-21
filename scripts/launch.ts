import * as readline from 'readline';
import { ethers, getNamedAccounts, network } from 'hardhat';
import { Crowdfund } from '../typechain-types';
import { BigNumber } from 'ethers';
import { networkConfig } from '../helper-hardhat-config';

const chainId = network.config.chainId;
let campaignGoal: BigNumber, account: string;

// yarn hardhat run scripts/launch.ts --network localhost

export default async function launch(
  campaignGoal: BigNumber,
  account?: string
): Promise<void> {
  if (chainId == 31337) {
    const deployer = (await getNamedAccounts()).deployer;
    const signer = ethers.provider.getSigner(deployer);

    const crowdfund: Crowdfund = await ethers.getContract('Crowdfund');

    const currentTimestampInSeconds = ethers.BigNumber.from(
      Math.round(Date.now() / 1000)
    );
    const minDuation = networkConfig[network.config.chainId!]['min_duration'];
    const maxDuation = networkConfig[network.config.chainId!]['max_duration'];

    await crowdfund
      .connect(signer)
      .launch(
        campaignGoal,
        currentTimestampInSeconds.add(minDuation),
        currentTimestampInSeconds.add(maxDuation)
      );

    console.log(
      `\nCampaign launched!\nCampaign Goal: ${ethers.utils.formatEther(
        campaignGoal
      )}\n`
    );
  } else {
    const crowdfund: Crowdfund = await ethers.getContract('Crowdfund');
    const signer = ethers.provider.getSigner(account!);

    const startAt = await getStartAt();
    const endAt = await getEndAt();

    await crowdfund.connect(signer).launch(campaignGoal, startAt, endAt);

    console.log(
      `\nCampaign launched!\nCampaign Goal: ${ethers.utils.formatEther(
        campaignGoal
      )}\n`
    );
  }
}

let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

export const getCampaignGoal = async (): Promise<BigNumber> => {
  let goal: BigNumber = ethers.BigNumber.from(0);
  rl.question('What is the campaign goal?  ', (answer) => {
    while (!isNaN(parseInt(answer))) {
      getCampaignGoal();
    }
    goal = ethers.BigNumber.from(answer);
    rl.close();
  });
  return goal;
};

export const getAccount = async (): Promise<string> => {
  let account: string = '';
  rl.question('What is your address?  ', (answer) => {
    while (!/^(0x)?[0-9a-f]{40}$/i.test(answer)) {
      console.log('\nThat is not a valid address\n');
      getAccount();
    }
    account = answer;
    rl.close();
  });
  return account;
};

export const getStartAt = async (): Promise<BigNumber> => {
  let startAt: BigNumber = ethers.BigNumber.from(0);
  rl.question('When does the campaign start?  ', (answer) => {
    while (!isNaN(parseInt(answer))) {
      getStartAt();
    }
    startAt = ethers.BigNumber.from(answer);
    rl.close();
  });
  return startAt;
};

export const getEndAt = async (): Promise<BigNumber> => {
  let endAt: BigNumber = ethers.BigNumber.from(0);
  rl.question('When does the campaign end?  ', (answer) => {
    while (!isNaN(parseInt(answer))) {
      getEndAt();
    }
    endAt = ethers.BigNumber.from(answer);
    rl.close();
  });
  return endAt;
};

(() => {
  rl.question('Are you on localhost? [y/n] ', (answer) => {
    switch (answer.toLowerCase()) {
      case 'y':
        campaignGoal = await getCampaignGoal();
        launch(campaignGoal)
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
        campaignGoal = await getCampaignGoal();
        launch(campaignGoal, account)
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
    }
    rl.close();
  });
})();

# Metacrafters Solidity Challenge: Crowdfund

## Description

Crowdfunding campaign where users can pledge funds to and claim funds from the Crowdfund contract. The funds take the form of a custom ERC20 token (MockToken contract is used for localhost deployments). Crowdfunding projects have a funding goal set when launched. Campaign creators may cancel the campaign after launch. Pledgers are be able to get a refund of their pledged funds durring campaign runtime or after campaign ends and funding goal is not met. dApps using the contract can observe state changes in transaction logs and events. The Crowdfund contract is upgradeable.

This project is made to fulfill the [METACRAFTERS](https://www.metacrafters.io) Talent Collective Solidity challenge

## Installation

1. Clone this repository
2. Run command: `yarn` to install dependencies
3. Use .env.example to create and fill out .env file
4. Open `helper-hardhat-config.ts` and change example Crowdfund initialization parameters

## Commands

For local testing use the flag ```--network localhost``` with each command

```shell
yarn hardhat deploy
yarn hardhat test
REPORT_GAS=true yarn hardhat test
yarn hardhat node
yarn hardhat run scripts/launch.ts
yarn hardhat run scripts/pledge.ts
yarn hardhat run scripts/unpledge.ts
```

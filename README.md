# ZkJump Contracts
## Install Dependencies

`npm install`

## Compile contracts

Setting up the target network via NET:

`NET=zklinkSepolia npx hardhat compile`

## Environment Settings

Copy `.env.example` to `.env` and fill in the correct settings:

`cp .env.example .env`

## Deploy

`NET=zklinkSepolia npx hardhat deployZkjump`

## Run tests

Run all unit tests:

`npm run test`

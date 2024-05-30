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
`--witness`: Required parameters. For signature use only, on the server.

`NET=zklinkSepolia npx hardhat deployZkjump --witness "witness adress"`

## Run tests

Run all unit tests:

`npm run test`

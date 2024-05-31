# ZkJump Contracts
## Install Dependencies

`npm install`

## Environment Settings

Create an `.env` file by copying `.env.example`:

`cp .env.example .env`

## Compile contracts

Setting up the target network via NET:

`NET=zklinkSepolia npx hardhat compile`

## Deploy
- `--witness`: Required parameters. For signature use only, on the server.

`NET=zklinkSepolia npx hardhat deployZkjump --witness "witness adress"`

## Run tests

Run all unit tests:

`npm run test`

## Grant Role

Authorization for special roles:
- `--role`: Role hash
- `--account`: Account address

`NET=arbitrumSepolia npx hardhat grantRole --role "role hash" --account "account address"`

> Role hash:
>
> `EXECUTOR_ROLE`: 0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63
> `EMERGENCIER_ROLE`: 0xdb208a64691d3c21ac31bc89c1a7cb7fc26fffcaf229cccfdd242a36a0f87fba
> `WITNESS_ROLE`: 0x01e3814859e1fb52a3619fc87e5bf0e88a404a49d305aef38ab09dc39741b1a7

## Upgrade

`NET=zklinkSepolia npx hardhat upgradeZkjump`
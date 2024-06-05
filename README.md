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

`NET=zklinkSepolia npx hardhat deployZkjump --witness "witness adress"`

- `--witness`: Required parameters. For signature use only, on the server.

## Run tests

Run all unit tests:

`npm run test`

## Grant Role

Authorization for special roles:
`NET=arbitrumSepolia npx hardhat grantRole --role "role hash" --account "account address"`

- `--role`: Role hash
- `--account`: Account address


> Role hash:
>
> `EXECUTOR_ROLE`: 0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63
> `EMERGENCIER_ROLE`: 0xdb208a64691d3c21ac31bc89c1a7cb7fc26fffcaf229cccfdd242a36a0f87fba
> `WITNESS_ROLE`: 0x01e3814859e1fb52a3619fc87e5bf0e88a404a49d305aef38ab09dc39741b1a7

## Rebalance

`npx hardhat rebalance --token "token address" --amount 1000000 --is-deposit false --private-key "your private key"`

- `--token`: Token address
- `--amount`: The amount to rebalance (ether)
- `--is-deposit`: True: Deposit, False: Withdraw
- `--private-key`: The private key of EMERGENCIER_ROLE

## Upgrade

`NET=zklinkSepolia npx hardhat upgradeZkjump`
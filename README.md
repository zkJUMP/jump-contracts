# ZkJump Contracts

zkJump aims to build a secure cross-chain bridge network linking all blockchains. We have adopted a highly scalable technical solution that can connect any two chains and bridge native assets between them without packaging tokens or swaping through media. 

When you initiate a cross-chain order, the auction market will provide you with the best quotes from brokers. If you confirm the transaction in your wallet, your assets will be transferred to the smart contract on the source chain and locked. Then the auction marketplace will request the executor to transfer your assets for you on the target chain . The entire bridge travel will be processed and signed by multiple independent services in sequence, then be verified by the smart contract with the multi-signature, finally complete the transfer. 

The security of your assets will be guaranteed by multi-signatures and smart contracts. We adopt mature smart contracts to ensure the security of vault and multi-signatures to protect the other process. As long as there is any unhacked service at the same time, the security of the system can be guaranteed. In addition, zkJump is constantly exploring the combination of bridges and zk technology. zkJump's vision is to build a borderless cross-chain bridge network with Ethereum security levels through zk technology.

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

`NET=zklinkSepolia npx hardhat rebalance --token "token address" --amount 1000000 --is-deposit false --private-key "your private key"`

- `--token`: Token address
- `--amount`: The amount to rebalance (ether)
- `--is-deposit`: True: Deposit, False: Withdraw
- `--private-key`: The private key of EMERGENCIER_ROLE

## Upgrade

`NET=zklinkSepolia npx hardhat upgradeZkjump`
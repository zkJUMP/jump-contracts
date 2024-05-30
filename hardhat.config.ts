import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@openzeppelin/hardhat-upgrades';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-verify';
import '@matterlabs/hardhat-zksync-upgradable';
import * as dotenv from 'dotenv';
import { NetworksUserConfig, NetworkUserConfig } from 'hardhat/src/types/config';

import './script/deploy_zkjump';
import './script/deploy_mock_token';

dotenv.config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config: HardhatUserConfig = {
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v6',
  },
  solidity: {
    compilers: [
      {
        version: '0.8.23',
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  defaultNetwork: process.env.NET || 'hardhat',
  networks: {
    hardhat: {
      zksync: false,
    },
    zklinkSepolia: {
      url: 'https://sepolia.rpc.zklink.io',
      ethNetwork: 'sepolia',
      verifyURL: 'https://sepolia.explorer.zklink.io/contract_verification',
      zksync: true,
    },
    zklinkNova: {
      url: 'https://rpc.zklink.io',
      ethNetwork: 'mainnet',
      verifyURL: 'https://explorer.zklink.io/contract_verification',
      zksync: true,
    },
    arbitrumSepolia: {
      url: 'https://sepolia-rollup.arbitrum.io/rpc',
      zksync: false,
    },
    arbitrumOne: {
      url: 'https://arb1.arbitrum.io/rpc',
      zksync: false,
    },
    baseSepolia: {
      url: 'https://sepolia.base.org',
      zksync: false,
    },
    base: {
      url: 'https://mainnet.base.org',
      zksync: false,
    },
    lineaSepolia: {
      url: 'https://rpc.sepolia.linea.build',
      zksync: false,
    },
    linea: {
      url: 'https://rpc.linea.build',
      zksync: false,
    },
    mantleSepolia: {
      url: 'https://rpc.sepolia.mantle.xyz',
      zksync: false,
    },
    mantle: {
      url: 'https://rpc.mantle.xyz',
      zksync: false,
    },
    mantaSepolia: {
      url: 'https://pacific-rpc.sepolia-testnet.manta.network/http',
      zksync: false,
    },
    manta: {
      url: 'https://pacific-rpc.manta.network/http',
      zksync: false,
    },
    optimismSepolia: {
      url: 'https://sepolia.optimism.io',
      zksync: false,
    },
    optimism: {
      url: 'https://mainnet.optimism.io',
      zksync: false,
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      zksync: false,
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      zksync: false,
    },
    zksyncSepolia: {
      url: 'https://sepolia.era.zksync.dev',
      ethNetwork: 'sepolia',
      zksync: true,
      verifyURL: 'https://explorer.sepolia.era.zksync.dev/contract_verification',
    },
    zksync: {
      url: 'https://mainnet.era.zksync.io',
      ethNetwork: 'mainnet',
      zksync: true,
      verifyURL: 'https://zksync2-mainnet-explorer.zksync.io/contract_verification',
    },
  },
  etherscan: {
    apiKey: {
      arbitrumSepolia: process.env.ARBISCAN_API_KEY ?? '',
      arbitrumOne: process.env.ARBISCAN_API_KEY ?? '',
      baseSepolia: process.env.BASESCAN_API_KEY ?? '',
      base: process.env.BASESCAN_API_KEY ?? '',
      lineaSepolia: process.env.LINEASCAN_API_KEY ?? '',
      linea: process.env.LINEASCAN_API_KEY ?? '',
      mantleSepolia: process.env.ETHERSCAN_API_KEY ?? '',
      mantle: process.env.ETHERSCAN_API_KEY ?? '',
      mantaSepolia: process.env.OPTIMISMSCAN_API_KEY ?? '',
      manta: process.env.OPTIMISMSCAN_API_KEY ?? '',
      optimismSepolia: process.env.OPTIMISMSCAN_API_KEY ?? '',
      optimism: process.env.OPTIMISMSCAN_API_KEY ?? '',
      sepolia: process.env.ETHERSCAN_API_KEY ?? '',
      mainnet: process.env.ETHERSCAN_API_KEY ?? '',
    },
    customChains: [
      {
        network: 'lineaSepolia',
        chainId: 59141,
        urls: {
          apiURL: 'https://api-sepolia.lineascan.build/api',
          browserURL: 'https://sepolia.lineascan.build/',
        },
      },
      {
        network: 'linea',
        chainId: 59144,
        urls: {
          apiURL: 'https://api.lineascan.build/api',
          browserURL: 'https://lineascan.build/',
        },
      },
      {
        network: 'mantleSepolia',
        chainId: 5003,
        urls: {
          apiURL: 'https://explorer.sepolia.mantle.xyz/api',
          browserURL: 'https://explorer.sepolia.mantle.xyz',
        },
      },
      {
        network: 'mantle',
        chainId: 5000,
        urls: {
          apiURL: 'https://explorer.mantle.xyz/api',
          browserURL: 'https://explorer.mantle.xyz',
        },
      },
      {
        network: 'mantaSepolia',
        chainId: 3441006,
        urls: {
          apiURL: 'https://pacific-explorer.sepolia-testnet.manta.network/api',
          browserURL: 'https://pacific-explorer.sepolia-testnet.manta.network',
        },
      },
      {
        network: 'manta',
        chainId: 169,
        urls: {
          apiURL: 'https://pacific-explorer.manta.network/api',
          browserURL: 'https://pacific-explorer.manta.network/',
        },
      },
      {
        network: 'optimismSepolia',
        chainId: 11155420,
        urls: {
          apiURL: 'https://api-sepolia-optimistic.etherscan.io/api',
          browserURL: 'https://sepolia-optimistic.etherscan.io',
        },
      },
      {
        network: 'optimism',
        chainId: 10,
        urls: {
          apiURL: 'https://api-optimistic.etherscan.io/api',
          browserURL: 'https://explorer.optimism.io',
        },
      },
    ],
  },
  zksolc: {
    version: '1.3.22',
    settings: {},
  },
  mocha: {
    timeout: 600000,
  },
};

if (!!config.defaultNetwork && config.defaultNetwork !== 'hardhat' && !!process.env.WALLET_PRIVATE_KEY) {
  const ns = config.networks as NetworksUserConfig;
  const nu = ns[config.defaultNetwork] as NetworkUserConfig;
  nu.accounts = [process.env.WALLET_PRIVATE_KEY];
}

export default config;

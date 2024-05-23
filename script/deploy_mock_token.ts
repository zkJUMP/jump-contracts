import * as fs from 'fs';
import { getImplementationAddress } from '@openzeppelin/upgrades-core';
import { verifyContractCode, createOrGetDeployLog, ChainContractDeployer, getDeployTx } from './utils';
import {
    DEPLOY_LOG_DEPLOYER,
    DEPLOY_LOG_DEPLOY_TX_HASH,
    DEPLOY_LOG_DEPLOY_BLOCK_NUMBER,
    DEPLOY_MOCK_TOKEN_LOG_PREFIX,
    DEPLOY_LOG_MOCK_TOKEN_PROXY,
    DEPLOY_LOG_MOCK_TOKEN_TARGET,
    DEPLOY_LOG_MOCK_TOKEN_TARGET_VERIFIED,
    DEPLOY_LOG_MOCK_TOKEN_PROXY_VERIFIED,
} from './deploy_log_name';
import { task, types } from 'hardhat/config';

function getMockTokenContractName() {
    return 'ZkLinkToken';
}

task('deployMockToken', 'Deploy mock zklink token')
    .addParam('skipVerify', 'Skip verify', false, types.boolean, true)
    .setAction(async (taskArgs, hardhat) => {
        const skipVerify = taskArgs.skipVerify;
        console.log('skip verify contracts?', skipVerify);

        const contractDeployer = new ChainContractDeployer(hardhat);
        await contractDeployer.init();
        const deployerWallet = contractDeployer.deployerWallet;

        const { deployLogPath, deployLog } = createOrGetDeployLog(DEPLOY_MOCK_TOKEN_LOG_PREFIX, hardhat.network.name);
        const dLog = deployLog as any;
        dLog[DEPLOY_LOG_DEPLOYER] = await deployerWallet?.getAddress();
        fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));

        // deploy mockToken
        let mockTokenAddr;
        if (!(DEPLOY_LOG_MOCK_TOKEN_PROXY in dLog)) {
            console.log('deploy mockToken...');
            const contractName = getMockTokenContractName();
            const contract = await contractDeployer.deployProxy(contractName, [], {});
            const transaction = await getDeployTx(contract);
            mockTokenAddr = await contract.getAddress();
            dLog[DEPLOY_LOG_MOCK_TOKEN_PROXY] = mockTokenAddr;
            dLog[DEPLOY_LOG_DEPLOY_TX_HASH] = transaction?.hash;
            dLog[DEPLOY_LOG_DEPLOY_BLOCK_NUMBER] = transaction?.blockNumber;
            fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
        } else {
            mockTokenAddr = dLog[DEPLOY_LOG_MOCK_TOKEN_PROXY];
        }
        console.log('mockToken', mockTokenAddr);

        let mockTokenTargetAddr;
        if (!(DEPLOY_LOG_MOCK_TOKEN_TARGET in dLog)) {
            console.log('get mockToken target...');
            mockTokenTargetAddr = await getImplementationAddress(hardhat.ethers.provider, mockTokenAddr);
            dLog[DEPLOY_LOG_MOCK_TOKEN_TARGET] = mockTokenTargetAddr;
            fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
        } else {
            mockTokenTargetAddr = dLog[DEPLOY_LOG_MOCK_TOKEN_TARGET];
        }
        console.log('mockToken target', mockTokenTargetAddr);

        // verify target contract
        if (!(DEPLOY_LOG_MOCK_TOKEN_TARGET_VERIFIED in dLog) && !skipVerify) {
            await verifyContractCode(hardhat, mockTokenTargetAddr, []);
            dLog[DEPLOY_LOG_MOCK_TOKEN_TARGET_VERIFIED] = true;
            fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
        }

        // verify proxy contract
        if (!(DEPLOY_LOG_MOCK_TOKEN_PROXY_VERIFIED in dLog) && !skipVerify) {
            await verifyContractCode(hardhat, mockTokenAddr, []);
            dLog[DEPLOY_LOG_MOCK_TOKEN_PROXY_VERIFIED] = true;
            fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
        }
    });

task('upgradeMockToken', 'Upgrade mockToken')
    .addParam('skipVerify', 'Skip verify', false, types.boolean, true)
    .setAction(async (taskArgs, hardhat) => {
        const skipVerify = taskArgs.skipVerify;
        console.log('skipVerify', skipVerify);

        const { deployLogPath, deployLog } = createOrGetDeployLog(DEPLOY_MOCK_TOKEN_LOG_PREFIX, hardhat.network.name);
        const dLog = deployLog as any;
        const contractAddr = dLog[DEPLOY_LOG_MOCK_TOKEN_PROXY];
        if (contractAddr === undefined) {
            console.log('mockToken address not exist');
            return;
        }
        console.log('mockToken', contractAddr);
        const oldContractTargetAddr = dLog[DEPLOY_LOG_MOCK_TOKEN_TARGET];
        if (oldContractTargetAddr === undefined) {
            console.log('mockToken target address not exist');
            return;
        }
        console.log('mockToken old target', oldContractTargetAddr);

        const contractDeployer = new ChainContractDeployer(hardhat);
        await contractDeployer.init();

        console.log('upgrade mockToken...');
        const contractName = getMockTokenContractName();
        const contract = await contractDeployer.upgradeProxy(contractName, contractAddr, {
            unsafeAllow: ['constructor'],
        });
        const tx = await getDeployTx(contract);
        console.log('upgrade tx', tx?.hash);
        const newContractTargetAddr = await getImplementationAddress(hardhat.ethers.provider, contractAddr);
        dLog[DEPLOY_LOG_MOCK_TOKEN_TARGET] = newContractTargetAddr;
        console.log('mockToken new target', newContractTargetAddr);
        fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));

        // verify target contract
        if (!skipVerify) {
            await verifyContractCode(hardhat, newContractTargetAddr, []);
            dLog[DEPLOY_LOG_MOCK_TOKEN_TARGET_VERIFIED] = true;
            fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
        }
    });

task('deployMockTokenTarget', 'Deploy mockToken target')
    .addOptionalParam('skipVerify', 'Skip verify', false, types.boolean)
    .setAction(async (taskArgs, hardhat) => {
        const skipVerify = taskArgs.skipVerify;
        console.log('skip verify contracts?', skipVerify);

        const contractDeployer = new ChainContractDeployer(hardhat);
        await contractDeployer.init();
        const deployerWallet = contractDeployer.deployerWallet;

        const { deployLogPath, deployLog } = createOrGetDeployLog(DEPLOY_MOCK_TOKEN_LOG_PREFIX, hardhat.network.name);
        const dLog = deployLog as any;
        dLog[DEPLOY_LOG_DEPLOYER] = await deployerWallet?.getAddress();
        fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));

        // deploy mockToken target
        console.log('deploy mockToken target...');
        const contractName = getMockTokenContractName();
        const contract = await contractDeployer.deployContract(contractName, []);
        const transaction = await getDeployTx(contract);
        console.log('deploy tx hash', transaction?.hash);
        const mockTokenTargetAddr = await contract.getAddress();
        dLog[DEPLOY_LOG_MOCK_TOKEN_TARGET] = mockTokenTargetAddr;
        fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
        console.log('mockToken', mockTokenTargetAddr);

        // verify target contract
        if (!skipVerify) {
            await verifyContractCode(hardhat, mockTokenTargetAddr, []);
            dLog[DEPLOY_LOG_MOCK_TOKEN_TARGET_VERIFIED] = true;
            fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
        }
    });

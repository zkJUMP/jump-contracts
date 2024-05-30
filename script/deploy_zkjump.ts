import * as fs from 'fs';
import { getImplementationAddress } from '@openzeppelin/upgrades-core';
import { verifyContractCode, createOrGetDeployLog, ChainContractDeployer, getDeployTx } from './utils';
import {
  DEPLOY_LOG_DEPLOYER,
  DEPLOY_LOG_DEPLOY_TX_HASH,
  DEPLOY_LOG_DEPLOY_BLOCK_NUMBER,
  DEPLOY_ZKJUMP_LOG_PREFIX,
  DEPLOY_LOG_ZKJUMP_PROXY,
  DEPLOY_LOG_ZKJUMP_TARGET,
  DEPLOY_LOG_ZKJUMP_VERIFIED,
  DEPLOY_LOG_ZKJUMP_WITNESS,
} from './deploy_log_name';
import { task, types } from 'hardhat/config';

function getZkJumpContractName() {
  return 'ZkJump';
}

task('deployZkjump', 'Deploy zkJump')
  .addParam('witness', 'The default witness address', undefined, types.string, false)
  .addParam('skipVerify', 'Skip verify', false, types.boolean, true)
  .setAction(async (taskArgs, hardhat) => {
    const witnessAddress = taskArgs.witness;
    const skipVerify = taskArgs.skipVerify;
    console.log('default witness address', witnessAddress);
    console.log('skip verify contracts?', skipVerify);

    const contractDeployer = new ChainContractDeployer(hardhat);
    await contractDeployer.init();
    const deployerWallet = contractDeployer.deployerWallet;

    const { deployLogPath, deployLog } = createOrGetDeployLog(DEPLOY_ZKJUMP_LOG_PREFIX, hardhat.network.name);
    const dLog = deployLog as any;
    dLog[DEPLOY_LOG_DEPLOYER] = await deployerWallet?.getAddress();
    dLog[DEPLOY_LOG_ZKJUMP_WITNESS] = witnessAddress;
    fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));

    // deploy zkjump
    let zkjumpAddr;
    if (!(DEPLOY_LOG_ZKJUMP_PROXY in dLog)) {
      console.log('deploy zkjump...');
      const contractName = getZkJumpContractName();
      const contract = await contractDeployer.deployProxy(contractName, [witnessAddress], {
        unsafeAllow: ['constructor'],
      });
      const transaction = await getDeployTx(contract);
      zkjumpAddr = await contract.getAddress();
      dLog[DEPLOY_LOG_ZKJUMP_PROXY] = zkjumpAddr;
      dLog[DEPLOY_LOG_DEPLOY_TX_HASH] = transaction?.hash;
      dLog[DEPLOY_LOG_DEPLOY_BLOCK_NUMBER] = transaction?.blockNumber;
      fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
    } else {
      zkjumpAddr = dLog[DEPLOY_LOG_ZKJUMP_PROXY];
    }
    console.log('zkjump', zkjumpAddr);

    let zkjumpTargetAddr;
    if (!(DEPLOY_LOG_ZKJUMP_TARGET in dLog)) {
      console.log('get zkjump target...');
      zkjumpTargetAddr = await getImplementationAddress(hardhat.ethers.provider, zkjumpAddr);
      dLog[DEPLOY_LOG_ZKJUMP_TARGET] = zkjumpTargetAddr;
      fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
    } else {
      zkjumpTargetAddr = dLog[DEPLOY_LOG_ZKJUMP_TARGET];
    }
    console.log('zkjump target', zkjumpTargetAddr);

    // verify proxy contract
    if (!(DEPLOY_LOG_ZKJUMP_VERIFIED in dLog) && !skipVerify) {
      await verifyContractCode(hardhat, zkjumpAddr, [], getZkJumpContractName());
      dLog[DEPLOY_LOG_ZKJUMP_VERIFIED] = true;
      fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
    }
  });

task('upgradeZkjump', 'Upgrade zkjump')
  .addParam('skipVerify', 'Skip verify', false, types.boolean, true)
  .setAction(async (taskArgs, hardhat) => {
    const skipVerify = taskArgs.skipVerify;
    console.log('skipVerify', skipVerify);

    const { deployLogPath, deployLog } = createOrGetDeployLog(DEPLOY_ZKJUMP_LOG_PREFIX, hardhat.network.name);
    const dLog = deployLog as any;
    const contractAddr = dLog[DEPLOY_LOG_ZKJUMP_PROXY];
    if (contractAddr === undefined) {
      console.log('zkjump address not exist');
      return;
    }
    console.log('zkjump', contractAddr);
    const oldContractTargetAddr = dLog[DEPLOY_LOG_ZKJUMP_TARGET];
    if (oldContractTargetAddr === undefined) {
      console.log('zkjump target address not exist');
      return;
    }
    console.log('zkjump old target', oldContractTargetAddr);

    const contractDeployer = new ChainContractDeployer(hardhat);
    await contractDeployer.init();

    console.log('upgrade zkjump...');
    const contractName = getZkJumpContractName();
    const contract = await contractDeployer.upgradeProxy(contractName, contractAddr, {
      unsafeAllow: ['constructor'],
    });
    const tx = await getDeployTx(contract);
    console.log('upgrade tx', tx?.hash);
    const newContractTargetAddr = await getImplementationAddress(hardhat.ethers.provider, contractAddr);
    dLog[DEPLOY_LOG_ZKJUMP_TARGET] = newContractTargetAddr;
    console.log('zkjump new target', newContractTargetAddr);
    fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));

    // verify target contract
    if (!skipVerify) {
      await verifyContractCode(hardhat, newContractTargetAddr, [], getZkJumpContractName());
      dLog[DEPLOY_LOG_ZKJUMP_VERIFIED] = true;
      fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
    }
  });

task('deployZkjumpTarget', 'Deploy zkjump target')
  .addOptionalParam('skipVerify', 'Skip verify', false, types.boolean)
  .setAction(async (taskArgs, hardhat) => {
    const skipVerify = taskArgs.skipVerify;
    console.log('skip verify contracts?', skipVerify);

    const contractDeployer = new ChainContractDeployer(hardhat);
    await contractDeployer.init();
    const deployerWallet = contractDeployer.deployerWallet;

    const { deployLogPath, deployLog } = createOrGetDeployLog(DEPLOY_ZKJUMP_LOG_PREFIX, hardhat.network.name);
    const dLog = deployLog as any;
    dLog[DEPLOY_LOG_DEPLOYER] = await deployerWallet?.getAddress();
    fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));

    // deploy zkjump target
    console.log('deploy zkjump target...');
    const contractName = getZkJumpContractName();
    const contract = await contractDeployer.deployContract(contractName, []);
    const transaction = await getDeployTx(contract);
    console.log('deploy tx hash', transaction?.hash);
    const zkjumpTargetAddr = await contract.getAddress();
    dLog[DEPLOY_LOG_ZKJUMP_TARGET] = zkjumpTargetAddr;
    fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
    console.log('zkjump', zkjumpTargetAddr);

    // verify target contract
    if (!skipVerify) {
      await verifyContractCode(hardhat, zkjumpTargetAddr, [], getZkJumpContractName());
      dLog[DEPLOY_LOG_ZKJUMP_VERIFIED] = true;
      fs.writeFileSync(deployLogPath, JSON.stringify(dLog, null, 2));
    }
  });

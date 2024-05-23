import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer, parseEther, encodeBytes32String } from 'ethers';
import { ZkJump, ZkLinkToken } from '../typechain';
import { upgrades } from 'hardhat';

async function getBridgeSignature(
  contractAddr: string,
  token: string,
  sender: string,
  receiver: string,
  orgChainId: number,
  dstChainId: number,
  amount: bigint,
  nonce: number,
  signer: Signer,
) {
  const domain = {
    name: 'ZKJUMP',
    version: '1.0',
    chainId: 31337,
    verifyingContract: contractAddr,
  };
  const types = {
    BridgeAuth: [
      { name: 'token', type: 'address' },
      { name: 'sender', type: 'address' },
      { name: 'receiver', type: 'address' },
      { name: 'orgChainId', type: 'uint256' },
      { name: 'dstChainId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
    ],
  };

  const expiry = (new Date().getTime() / 1000) | (0 + 60 * 100);
  const message = {
    token: token,
    sender: sender,
    receiver: receiver,
    orgChainId: orgChainId,
    dstChainId: dstChainId,
    amount: amount,
    nonce: nonce,
    expiry: expiry,
  };

  const signature = await signer.signTypedData(domain, types, message);
  return {
    expiry: expiry,
    signature: signature,
  };
}

async function getReleaseSignature(
  contractAddr: string,
  token: string,
  receiver: string,
  orgChainId: number,
  dstChainId: number,
  amount: bigint,
  nonce: number,
  txHash: string,
  signer: Signer,
) {
  const domain = {
    name: 'ZKJUMP',
    version: '1.0',
    chainId: 31337,
    verifyingContract: contractAddr,
  };
  const types = {
    ReleaseAuth: [
      { name: 'token', type: 'address' },
      { name: 'receiver', type: 'address' },
      { name: 'orgChainId', type: 'uint256' },
      { name: 'dstChainId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'bridgeTxHash', type: 'bytes32' },
    ],
  };

  const message = {
    token: token,
    receiver: receiver,
    orgChainId: orgChainId,
    dstChainId: dstChainId,
    amount: amount,
    nonce: nonce,
    bridgeTxHash: encodeBytes32String(txHash),
  };

  const signature = await signer.signTypedData(domain, types, message);
  return signature;
}

describe('ZkJump', function () {
  const DEFAULT_AADMIN_ROLE_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';
  /// keccak256("WITNESS_ROLE")
  const WITNESS_ROLE_HASH = '0x01e3814859e1fb52a3619fc87e5bf0e88a404a49d305aef38ab09dc39741b1a7';
  /// keccak256("EXECUTOR_ROLE")
  const EXECUTOR_ROLE_HASH = '0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63';
  /// keccak256("EMERGENCIER_ROLE")
  const EMERGENCIER_ROLE_HASH = '0xdb208a64691d3c21ac31bc89c1a7cb7fc26fffcaf229cccfdd242a36a0f87fba';

  let ZkJumpFactory;
  let MockTokenFactory;
  let zkJumpContract: ZkJump;
  let mockTokenContract: ZkLinkToken;
  let zkJumpAddr: string;
  let mockTokenAddr: string;

  let owner: Signer;
  let ownerAddr: string;
  let witness: Signer;
  let witnessAddr: string;
  let executor: Signer;
  let executorAddr: string;
  let emergencier: Signer;
  let emergencierAddr: string;
  let user1: Signer;
  let user1Addr: string;
  let user2: Signer;
  let user2Addr: string;
  let user3: Signer;
  let user3Addr: string;
  let user4: Signer;
  let user4Addr: string;

  before(async function () {
    [owner, witness, executor, emergencier, user1, user2, user3, user4] = await ethers.getSigners();
    ownerAddr = await owner.getAddress();
    witnessAddr = await witness.getAddress();
    executorAddr = await executor.getAddress();
    emergencierAddr = await emergencier.getAddress();
    user1Addr = await user1.getAddress();
    user2Addr = await user2.getAddress();
    user3Addr = await user3.getAddress();
    user4Addr = await user4.getAddress();

    // deploy zkJump
    ZkJumpFactory = await ethers.getContractFactory('ZkJump');
    zkJumpContract = (await upgrades.deployProxy(ZkJumpFactory, [witnessAddr], {
      kind: 'uups',
      initializer: 'initialize',
      unsafeAllow: ['constructor'],
    })) as any as ZkJump;
    zkJumpAddr = await zkJumpContract.getAddress();

    // deploy mockToken
    MockTokenFactory = await ethers.getContractFactory('ZkLinkToken');
    mockTokenContract = (await upgrades.deployProxy(MockTokenFactory, [], {
      kind: 'uups',
    })) as any as ZkLinkToken;
    mockTokenAddr = await mockTokenContract.getAddress();

    // mint mockToken
    await mockTokenContract.mint(ownerAddr, parseEther('1000000'));
    await mockTokenContract.mint(user1Addr, parseEther('10000'));
    await mockTokenContract.mint(user2Addr, parseEther('10000'));
  });

  describe('Role Test', function () {
    it('should get default witness', async function () {
      expect(await zkJumpContract.hasRole(WITNESS_ROLE_HASH, witnessAddr)).to.equal(true);
    });

    it('should set executor', async function () {
      await zkJumpContract.grantRole(EXECUTOR_ROLE_HASH, executorAddr);
      expect(await zkJumpContract.hasRole(EXECUTOR_ROLE_HASH, executorAddr)).to.equal(true);
    });

    it('should set emergencier', async function () {
      await zkJumpContract.grantRole(EMERGENCIER_ROLE_HASH, emergencierAddr);
      expect(await zkJumpContract.hasRole(EMERGENCIER_ROLE_HASH, emergencierAddr)).to.equal(true);
    });

    it('should revoke executor', async function () {
      await zkJumpContract.revokeRole(EXECUTOR_ROLE_HASH, executorAddr);
      expect(await zkJumpContract.hasRole(EXECUTOR_ROLE_HASH, executorAddr)).to.equal(false);
    });

    it('should revoke emergencier', async function () {
      await zkJumpContract.revokeRole(EMERGENCIER_ROLE_HASH, emergencierAddr);
      expect(await zkJumpContract.hasRole(EMERGENCIER_ROLE_HASH, emergencierAddr)).to.equal(false);
    });

    it('should set default admin', async function () {
      await zkJumpContract.grantRole(DEFAULT_AADMIN_ROLE_HASH, user1Addr);
      expect(await zkJumpContract.hasRole(DEFAULT_AADMIN_ROLE_HASH, user1Addr)).to.equal(true);
    });
  });

  describe('Bridge Test', function () {
    it('should bridge', async function () {
      await zkJumpContract.setSupportedToken(mockTokenAddr, true);
      await mockTokenContract.connect(user1).approve(zkJumpAddr, parseEther('1000'));

      const userNonce = await zkJumpContract.userBridgeNonce(user1Addr);
      console.log('userNonce:', userNonce);

      const { expiry, signature } = await getBridgeSignature(
        zkJumpAddr,
        mockTokenAddr,
        user1Addr,
        user3Addr,
        31337,
        31337,
        parseEther('1000'),
        Number(userNonce) + 1,
        witness,
      );

      await zkJumpContract
        .connect(user1)
        .bridgeERC20(mockTokenAddr, user3Addr, parseEther('1000'), 31337, expiry, signature);
      expect(await mockTokenContract.balanceOf(zkJumpAddr)).to.equal(parseEther('1000'));
      expect(await mockTokenContract.balanceOf(user1Addr)).to.equal(parseEther('9000'));
    });

    it('should release', async function () {
      await mockTokenContract.connect(user2).approve(zkJumpAddr, parseEther('2000'));

      const user1Nonce = await zkJumpContract.userBridgeNonce(user1Addr);
      const user2Nonce = await zkJumpContract.userBridgeNonce(user2Addr);
      const { expiry: expiry2, signature: signature2 } = await getBridgeSignature(
        zkJumpAddr,
        mockTokenAddr,
        user2Addr,
        user4Addr,
        31337,
        31337,
        parseEther('2000'),
        Number(user2Nonce) + 1,
        witness,
      );
      await zkJumpContract
        .connect(user2)
        .bridgeERC20(mockTokenAddr, user4Addr, parseEther('2000'), 31337, expiry2, signature2);

      expect(await mockTokenContract.balanceOf(zkJumpAddr)).to.equal(parseEther('3000'));
      expect(await mockTokenContract.balanceOf(user2Addr)).to.equal(parseEther('8000'));

      await zkJumpContract.grantRole(EXECUTOR_ROLE_HASH, executorAddr);

      const releaseSignature1 = await getReleaseSignature(
        zkJumpAddr,
        mockTokenAddr,
        user3Addr,
        31337,
        31337,
        parseEther('1000'),
        Number(user1Nonce) + 1,
        'order1',
        witness,
      );
      const releaseParam1: ZkJump.ReleaseParamStruct = {
        token: mockTokenAddr,
        receiver: user3Addr,
        orgChainId: 31337,
        amount: parseEther('1000'),
        nonce: Number(user1Nonce) + 1,
        bridgeTxHash: encodeBytes32String('order1'),
        signature: releaseSignature1,
      };
      const releaseSignature2 = await getReleaseSignature(
        zkJumpAddr,
        mockTokenAddr,
        user4Addr,
        31337,
        31337,
        parseEther('2000'),
        Number(user2Nonce) + 1,
        'order2',
        witness,
      );
      const releaseParam2: ZkJump.ReleaseParamStruct = {
        token: mockTokenAddr,
        receiver: user4Addr,
        orgChainId: 31337,
        amount: parseEther('2000'),
        nonce: Number(user2Nonce) + 1,
        bridgeTxHash: encodeBytes32String('order2'),
        signature: releaseSignature2,
      };

      await zkJumpContract.connect(executor).batchReleaseERC20([releaseParam1, releaseParam2]);

      expect(await mockTokenContract.balanceOf(zkJumpAddr)).to.equal(0);
      expect(await mockTokenContract.balanceOf(user3Addr)).to.equal(parseEther('1000'));
      expect(await mockTokenContract.balanceOf(user4Addr)).to.equal(parseEther('2000'));
    });
  });
});

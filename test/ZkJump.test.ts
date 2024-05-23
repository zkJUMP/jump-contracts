import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Wallet, parseEther, encodeBytes32String } from 'ethers';
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
  signer: Wallet,
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
  signer: Wallet,
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

  let owner: Wallet;
  let witness: Wallet;
  let executor: Wallet;
  let emergencier: Wallet;
  let user1: Wallet;
  let user2: Wallet;
  let user3: Wallet;
  let user4: Wallet;

  before(async function () {
    [owner, witness, executor, emergencier, user1, user2, user3, user4] = await ethers.getSigners();
    console.log('owner:', owner.address);
    console.log('witness:', witness.address);
    console.log('executor:', executor.address);
    console.log('emergencier:', emergencier.address);
    console.log('user1:', user1.address);
    console.log('user2:', user2.address);

    // deploy zkJump
    ZkJumpFactory = await ethers.getContractFactory('ZkJump');
    zkJumpContract = (await upgrades.deployProxy(ZkJumpFactory, [witness.address], {
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
    await mockTokenContract.mint(owner.address, parseEther('1000000'));
    await mockTokenContract.mint(user1.address, parseEther('10000'));
    await mockTokenContract.mint(user2.address, parseEther('10000'));
  });

  describe('Role Test', function () {
    it('should get default witness', async function () {
      expect(await zkJumpContract.hasRole(WITNESS_ROLE_HASH, witness.address)).to.equal(true);
    });

    it('should set executor', async function () {
      await zkJumpContract.grantRole(EXECUTOR_ROLE_HASH, executor.address);
      expect(await zkJumpContract.hasRole(EXECUTOR_ROLE_HASH, executor.address)).to.equal(true);
    });

    it('should set emergencier', async function () {
      await zkJumpContract.grantRole(EMERGENCIER_ROLE_HASH, emergencier.address);
      expect(await zkJumpContract.hasRole(EMERGENCIER_ROLE_HASH, emergencier.address)).to.equal(true);
    });

    it('should revoke executor', async function () {
      await zkJumpContract.revokeRole(EXECUTOR_ROLE_HASH, executor.address);
      expect(await zkJumpContract.hasRole(EXECUTOR_ROLE_HASH, executor.address)).to.equal(false);
    });

    it('should revoke emergencier', async function () {
      await zkJumpContract.revokeRole(EMERGENCIER_ROLE_HASH, emergencier.address);
      expect(await zkJumpContract.hasRole(EMERGENCIER_ROLE_HASH, emergencier.address)).to.equal(false);
    });

    it('should set default admin', async function () {
      await zkJumpContract.grantRole(DEFAULT_AADMIN_ROLE_HASH, user1.address);
      expect(await zkJumpContract.hasRole(DEFAULT_AADMIN_ROLE_HASH, user1.address)).to.equal(true);
    });
  });

  describe('Bridge Test', function () {
    it('should bridge', async function () {
      await zkJumpContract.setSupportedToken(mockTokenAddr, true);
      await mockTokenContract.connect(user1).approve(zkJumpAddr, parseEther('1000'));

      const userNonce = await zkJumpContract.userBridgeNonce(user1.address);
      console.log('userNonce:', userNonce);

      const { expiry, signature } = await getBridgeSignature(
        zkJumpAddr,
        mockTokenAddr,
        user1.address,
        user3.address,
        31337,
        31337,
        parseEther('1000'),
        Number(userNonce) + 1,
        witness,
      );

      await zkJumpContract
        .connect(user1)
        .bridgeERC20(mockTokenAddr, user3.address, parseEther('1000'), 31337, expiry, signature);
      expect(await mockTokenContract.balanceOf(zkJumpAddr)).to.equal(parseEther('1000'));
      expect(await mockTokenContract.balanceOf(user1.address)).to.equal(parseEther('9000'));
    });

    it('should release', async function () {
      await mockTokenContract.connect(user2).approve(zkJumpAddr, parseEther('2000'));

      const user1Nonce = await zkJumpContract.userBridgeNonce(user1.address);
      const user2Nonce = await zkJumpContract.userBridgeNonce(user2.address);
      const { expiry: expiry2, signature: signature2 } = await getBridgeSignature(
        zkJumpAddr,
        mockTokenAddr,
        user2.address,
        user4.address,
        31337,
        31337,
        parseEther('2000'),
        Number(user2Nonce) + 1,
        witness,
      );
      await zkJumpContract
        .connect(user2)
        .bridgeERC20(mockTokenAddr, user4.address, parseEther('2000'), 31337, expiry2, signature2);

      expect(await mockTokenContract.balanceOf(zkJumpAddr)).to.equal(parseEther('3000'));
      expect(await mockTokenContract.balanceOf(user2.address)).to.equal(parseEther('8000'));

      await zkJumpContract.grantRole(EXECUTOR_ROLE_HASH, executor.address);

      const releaseSignature1 = await getReleaseSignature(
        zkJumpAddr,
        mockTokenAddr,
        user3.address,
        31337,
        31337,
        parseEther('1000'),
        Number(user1Nonce) + 1,
        'order1',
        witness,
      );
      const releaseParam1: ZkJump.ReleaseParamStruct = {
        token: mockTokenAddr,
        receiver: user3.address,
        orgChainId: 31337,
        amount: parseEther('1000'),
        nonce: Number(user1Nonce) + 1,
        bridgeTxHash: encodeBytes32String('order1'),
        signature: releaseSignature1,
      };
      const releaseSignature2 = await getReleaseSignature(
        zkJumpAddr,
        mockTokenAddr,
        user4.address,
        31337,
        31337,
        parseEther('2000'),
        Number(user2Nonce) + 1,
        'order2',
        witness,
      );
      const releaseParam2: ZkJump.ReleaseParamStruct = {
        token: mockTokenAddr,
        receiver: user4.address,
        orgChainId: 31337,
        amount: parseEther('2000'),
        nonce: Number(user2Nonce) + 1,
        bridgeTxHash: encodeBytes32String('order2'),
        signature: releaseSignature2,
      };

      await zkJumpContract.connect(executor).batchReleaseERC20([releaseParam1, releaseParam2]);

      expect(await mockTokenContract.balanceOf(zkJumpAddr)).to.equal(0);
      expect(await mockTokenContract.balanceOf(user3.address)).to.equal(parseEther('1000'));
      expect(await mockTokenContract.balanceOf(user4.address)).to.equal(parseEther('2000'));
    });
  });
});

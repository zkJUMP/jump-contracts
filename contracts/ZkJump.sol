// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ECDSAUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title ZkJump contract
/// @author zkJump
contract ZkJump is
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    EIP712Upgradeable
{
    using SafeERC20 for IERC20;

    /// @dev The role of the witness
    bytes32 public constant WITNESS_ROLE = keccak256("WITNESS_ROLE");
    /// @dev The role of the executor
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    /// @dev The role of the emergencier
    bytes32 public constant EMERGENCIER_ROLE = keccak256("EMERGENCIER_ROLE");

    bytes32 public constant BRIDGE_AUTH_TYPE_HASH =
        keccak256(
            "BridgeAuth(address token,address sender,uint256 orgChainId,uint256 dstChainId,uint256 amount,uint256 expiry)"
        );
    bytes32 public constant RELEASE_AUTH_TYPE_HASH =
        keccak256(
            "ReleaseAuth(address token,address receiver,uint256 orgChainId,uint256 dstChainId,uint256 amount,uint256 nonce,bytes32 bridgeTxHash)"
        );

    struct ReleaseParam {
        address token;
        address receiver;
        uint256 orgChainId;
        uint256 amount;
        uint256 nonce;
        bytes32 bridgeTxHash;
        bytes signature;
    }

    /// @dev The mapping of the supported tokens
    mapping(address token => bool) public supportedTokens;

    /// @dev The mapping of the bridge signatures
    mapping(bytes32 sign => bool) public authSignatures;

    /// @dev The mapping of the token's balances
    mapping(address token => uint256) public balances;

    event ChangeSupportToken(address indexed token, bool supported);

    event Bridge(
        address indexed token,
        address indexed sender,
        uint256 amount,
        uint256 orgChainId,
        uint256 dstChainId,
        uint256 expiry
    );

    event Release(
        address indexed token,
        address indexed receiver,
        uint256 orgChainId,
        uint256 dstChainId,
        uint256 amount,
        uint256 nonce,
        bytes32 bridgeTxHash
    );

    event Rebalance(address indexed token, address receiver, uint256 amount, bool isDeposit);

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[47] private __gap;

    /// @dev Contract is expected to be used as proxy implementation.
    /// @dev Disable the initialization to prevent Parity hack.
    constructor() {
        _disableInitializers();
    }

    function initialize(address _defaultWitness) public initializer {
        __UUPSUpgradeable_init_unchained();
        __Context_init_unchained();
        __ReentrancyGuard_init_unchained();
        __Pausable_init_unchained();
        __AccessControl_init_unchained();
        __EIP712_init_unchained("ZKJUMP", "1.0");

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(WITNESS_ROLE, _defaultWitness);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {
        // can only called by owner
    }

    function bridgeERC20(
        address _token,
        uint256 _amount,
        uint256 _dstChainId,
        uint256 _expiry,
        bytes calldata _signature
    ) external nonReentrant whenNotPaused {
        require(_amount > 0, "Invalid amount");
        // solhint-disable-next-line avoid-tx-origin
        require(_msgSender() == tx.origin, "Only EOA");

        // get original chainId
        uint256 orgChainId;
        assembly {
            orgChainId := chainid()
        }

        _checkBridgeSignature(_token, _msgSender(), orgChainId, _dstChainId, _amount, _expiry, _signature);

        balances[_token] += _amount;

        IERC20(_token).safeTransferFrom(_msgSender(), address(this), _amount);

        emit Bridge(_token, _msgSender(), _amount, orgChainId, _dstChainId, _expiry);
    }

    function batchReleaseERC20(
        ReleaseParam[] calldata _params
    ) external nonReentrant whenNotPaused onlyRole(EXECUTOR_ROLE) {
        for (uint256 i = 0; i < _params.length; i++) {
            _releaseERC20(
                _params[i].token,
                _params[i].receiver,
                _params[i].orgChainId,
                _params[i].amount,
                _params[i].nonce,
                _params[i].bridgeTxHash,
                _params[i].signature
            );
        }
    }

    function _releaseERC20(
        address _token,
        address _receiver,
        uint256 _orgChainId,
        uint256 _amount,
        uint256 _nonce,
        bytes32 bridgeTxHash,
        bytes calldata _signature
    ) internal {
        require(_receiver != address(0), "Invalid address");
        require(_amount > 0, "Invalid amount");
        require(balances[_token] >= _amount, "Insufficient balance");

        uint256 chainId;
        assembly {
            chainId := chainid()
        }

        _checkReleaseSignature(_token, _receiver, _orgChainId, chainId, _amount, _nonce, bridgeTxHash, _signature);

        balances[_token] -= _amount;

        IERC20(_token).safeTransfer(_receiver, _amount);

        emit Release(_token, _receiver, _orgChainId, chainId, _amount, _nonce, bridgeTxHash);
    }

    function rebalanceERC20(address _token, uint256 _amount, bool isDeposit) external onlyRole(EMERGENCIER_ROLE) {
        require(_amount > 0, "Invalid amount");

        if (isDeposit) {
            balances[_token] += _amount;

            IERC20(_token).safeTransferFrom(_msgSender(), address(this), _amount);
            emit Rebalance(_token, address(this), _amount, isDeposit);
        } else {
            require(balances[_token] >= _amount, "Insufficient balance");

            balances[_token] -= _amount;

            IERC20(_token).safeTransfer(_msgSender(), _amount);
            emit Rebalance(_token, _msgSender(), _amount, isDeposit);
        }
    }

    function _checkBridgeSignature(
        address token,
        address sender,
        uint256 orgChainId,
        uint256 dstChainId,
        uint256 amount,
        uint256 expiry,
        bytes calldata signature
    ) internal {
        require(block.timestamp <= expiry, "Signature has expired");
        bytes32 signatureHash = keccak256(
            abi.encode(BRIDGE_AUTH_TYPE_HASH, token, sender, orgChainId, dstChainId, amount, expiry)
        );

        _checkSignature(signatureHash, signature);
    }

    function _checkReleaseSignature(
        address token,
        address receiver,
        uint256 orgChainId,
        uint256 dstChainId,
        uint256 amount,
        uint256 nonce,
        bytes32 bridgeTxHash,
        bytes calldata signature
    ) internal {
        bytes32 signatureHash = keccak256(
            abi.encode(RELEASE_AUTH_TYPE_HASH, token, receiver, orgChainId, dstChainId, amount, nonce, bridgeTxHash)
        );

        _checkSignature(signatureHash, signature);
    }

    function _checkSignature(bytes32 signatureHash, bytes calldata signature) internal {
        require(!authSignatures[signatureHash], "Used Signature");
        address witnessAddress = ECDSAUpgradeable.recover(_hashTypedDataV4(signatureHash), signature);
        _checkRole(WITNESS_ROLE, witnessAddress);
        authSignatures[signatureHash] = true;
    }
}

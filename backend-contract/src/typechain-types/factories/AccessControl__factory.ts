/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { AccessControl, AccessControlInterface } from "../AccessControl";

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "ContractPaused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "ContractUnpaused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Paused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "Unpaused",
    type: "event",
  },
  {
    inputs: [],
    name: "ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "DOCTOR_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "LAB_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "PATIENT_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleAdmin",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b506001805460ff19168155600255610029600033610058565b6100537fa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c2177533610058565b6100f7565b6000828152602081815260408083206001600160a01b038516845290915290205460ff166100f3576000828152602081815260408083206001600160a01b03851684529091529020805460ff191660011790556100b23390565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45b5050565b610be2806101066000396000f3fe608060405234801561001057600080fd5b50600436106100ea5760003560e01c80638456cb591161008c578063ac5cb97d11610066578063ac5cb97d146101bb578063bd3070c6146101e2578063d547741f14610209578063fec331f21461021c57600080fd5b80638456cb591461019857806391d14854146101a0578063a217fddf146101b357600080fd5b806336568abe116100c857806336568abe1461015d5780633f4ba83a146101705780635c975abb1461017857806375b238fc1461018357600080fd5b806301ffc9a7146100ef578063248a9ca3146101175780632f2ff15d14610148575b600080fd5b6101026100fd3660046109be565b610243565b60405190151581526020015b60405180910390f35b61013a6101253660046109e8565b60009081526020819052604090206001015490565b60405190815260200161010e565b61015b610156366004610a01565b61027a565b005b61015b61016b366004610a01565b610345565b61015b6103c3565b60015460ff16610102565b61013a600080516020610b8d83398151915281565b61015b610411565b6101026101ae366004610a01565b61045f565b61013a600081565b61013a7f72606200fac42b7dc86b75901d61ecfab2a4a1a6eded478b97a428094891abed81565b61013a7f373fdac787be5578b9a3d4a9ca3e3ae1e632ab5ee4750e92f65223238a15b2ef81565b61015b610217366004610a01565b61048b565b61013a7f0af1dac7dea2fd7f7738119cec7df099dfad49aa9d2e7d17ba6b60f63ae7411f81565b60006001600160e01b03198216637965db0b60e01b148061027457506301ffc9a760e01b6001600160e01b03198316145b92915050565b600080516020610b8d8339815191526102928161054c565b61029a610559565b6102a26105a1565b826102f45760405162461bcd60e51b815260206004820181905260248201527f43616e6e6f74206d6f646966792044454641554c545f41444d494e5f524f4c4560448201526064015b60405180910390fd5b6102fe83836105f8565b60405133906001600160a01b0384169085907f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d90600090a46103406001600255565b505050565b6001600160a01b03811633146103b55760405162461bcd60e51b815260206004820152602f60248201527f416363657373436f6e74726f6c3a2063616e206f6e6c792072656e6f756e636560448201526e103937b632b9903337b91039b2b63360891b60648201526084016102eb565b6103bf828261067c565b5050565b600080516020610b8d8339815191526103db8161054c565b6103e36106e1565b60405133907f5b65b0c1363b3003db9bcc5e1fd8805a6d6bf5bf6dc9d3431ee4494cd7d1176690600090a250565b600080516020610b8d8339815191526104298161054c565b610431610733565b60405133907f81990fd9a5c552b8e3677917d8a03c07678f0d2cb68f88b634aca2022e9bd19f90600090a250565b6000828152602081815260408083206001600160a01b038516845290915281205460ff165b9392505050565b600080516020610b8d8339815191526104a38161054c565b6104ab610559565b6104b36105a1565b826105005760405162461bcd60e51b815260206004820181905260248201527f43616e6e6f74206d6f646966792044454641554c545f41444d494e5f524f4c4560448201526064016102eb565b61050a838361067c565b60405133906001600160a01b0384169085907ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b90600090a46103406001600255565b610556813361076e565b50565b60015460ff161561059f5760405162461bcd60e51b815260206004820152601060248201526f14185d5cd8589b194e881c185d5cd95960821b60448201526064016102eb565b565b60028054036105f25760405162461bcd60e51b815260206004820152601f60248201527f5265656e7472616e637947756172643a207265656e7472616e742063616c6c0060448201526064016102eb565b60028055565b610602828261045f565b6103bf576000828152602081815260408083206001600160a01b03851684529091529020805460ff191660011790556106383390565b6001600160a01b0316816001600160a01b0316837f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a45050565b610686828261045f565b156103bf576000828152602081815260408083206001600160a01b0385168085529252808320805460ff1916905551339285917ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b9190a45050565b6106e96107c7565b6001805460ff191690557f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa335b6040516001600160a01b03909116815260200160405180910390a1565b61073b610559565b6001805460ff1916811790557f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a25833610716565b610778828261045f565b6103bf5761078581610810565b610790836020610822565b6040516020016107a1929190610a61565b60408051601f198184030181529082905262461bcd60e51b82526102eb91600401610ad6565b60015460ff1661059f5760405162461bcd60e51b815260206004820152601460248201527314185d5cd8589b194e881b9bdd081c185d5cd95960621b60448201526064016102eb565b60606102746001600160a01b03831660145b60606000610831836002610b1f565b61083c906002610b36565b67ffffffffffffffff81111561085457610854610b49565b6040519080825280601f01601f19166020018201604052801561087e576020820181803683370190505b509050600360fc1b8160008151811061089957610899610b5f565b60200101906001600160f81b031916908160001a905350600f60fb1b816001815181106108c8576108c8610b5f565b60200101906001600160f81b031916908160001a90535060006108ec846002610b1f565b6108f7906001610b36565b90505b600181111561096f576f181899199a1a9b1b9c1cb0b131b232b360811b85600f166010811061092b5761092b610b5f565b1a60f81b82828151811061094157610941610b5f565b60200101906001600160f81b031916908160001a90535060049490941c9361096881610b75565b90506108fa565b5083156104845760405162461bcd60e51b815260206004820181905260248201527f537472696e67733a20686578206c656e67746820696e73756666696369656e7460448201526064016102eb565b6000602082840312156109d057600080fd5b81356001600160e01b03198116811461048457600080fd5b6000602082840312156109fa57600080fd5b5035919050565b60008060408385031215610a1457600080fd5b8235915060208301356001600160a01b0381168114610a3257600080fd5b809150509250929050565b60005b83811015610a58578181015183820152602001610a40565b50506000910152565b7f416363657373436f6e74726f6c3a206163636f756e7420000000000000000000815260008351610a99816017850160208801610a3d565b7001034b99036b4b9b9b4b733903937b6329607d1b6017918401918201528351610aca816028840160208801610a3d565b01602801949350505050565b6020815260008251806020840152610af5816040850160208701610a3d565b601f01601f19169190910160400192915050565b634e487b7160e01b600052601160045260246000fd5b808202811582820484141761027457610274610b09565b8082018082111561027457610274610b09565b634e487b7160e01b600052604160045260246000fd5b634e487b7160e01b600052603260045260246000fd5b600081610b8457610b84610b09565b50600019019056fea49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775a2646970667358221220ea9f0f8addd34ad3006885482029bfd6a28ffe71585891090430d2881711ef1664736f6c634300081c0033";

type AccessControlConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: AccessControlConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class AccessControl__factory extends ContractFactory {
  constructor(...args: AccessControlConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: string }
  ): Promise<AccessControl> {
    return super.deploy(overrides || {}) as Promise<AccessControl>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: string }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): AccessControl {
    return super.attach(address) as AccessControl;
  }
  override connect(signer: Signer): AccessControl__factory {
    return super.connect(signer) as AccessControl__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): AccessControlInterface {
    return new utils.Interface(_abi) as AccessControlInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): AccessControl {
    return new Contract(address, _abi, signerOrProvider) as AccessControl;
  }
}

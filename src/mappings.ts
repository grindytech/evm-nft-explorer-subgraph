import { Address, BigInt, store } from "@graphprotocol/graph-ts";
import { Transfer as TransferEvent } from "../generated/templates/ERC721/ERC721";
import { TransferSingle as TransferSingleEvent, TransferBatch as TransferBatchEvent } from "../generated/templates/ERC1155/ERC1155";
import { Transfer as DummyTransferEvent } from "../generated/DummyERC721/ERC721";
import { Owner, Collection, ERC721Balance, ERC1155Balance } from "../generated/schema";

// Loads or creates an Owner entity
function loadOrCreateOwner(address: string): Owner {
  let owner = Owner.load(address);
  if (!owner) {
    owner = new Owner(address);
    owner.save();
  }
  return owner;
}

// Loads or creates a Collection entity
function loadOrCreateCollection(collectionId: string, type: string): Collection {
  let collection = Collection.load(collectionId);
  if (!collection) {
    collection = new Collection(collectionId);
    collection.type = type;
    collection.save();
  }
  return collection;
}

// Dummy handler for DummyERC721 dataSource (does nothing)
export function handleDummyTransfer(event: DummyTransferEvent): void {
  // No-op: prevents indexing for dummy dataSource
}

// Handles ERC721 Transfer events
export function handleTransfer(event: TransferEvent): void {
  let collectionId = event.address.toHexString();
  let collection = loadOrCreateCollection(collectionId, "ERC721");

  let tokenId = event.params.tokenId.toString();
  let fromId = event.params.from.toHexString();
  let toId = event.params.to.toHexString();
  let transactionHash = event.transaction.hash.toHexString();
  let zeroAddress = "0x0000000000000000000000000000000000000000";

  if (fromId != zeroAddress) {
    let fromBalanceId = `${fromId}-${collectionId}`;
    let fromBalance = ERC721Balance.load(fromBalanceId);
    if (fromBalance) {
      let tokenIds = fromBalance.tokenIds;
      let newTokenIds: string[] = [];
      for (let i = 0; i < tokenIds.length; i++) {
        if (tokenIds[i] != tokenId) {
          newTokenIds.push(tokenIds[i]);
        }
      }
      fromBalance.tokenIds = newTokenIds;
      fromBalance.transactionHash = transactionHash;
      if (newTokenIds.length == 0) {
        store.remove("ERC721Balance", fromBalanceId);
      } else {
        fromBalance.save();
      }
    }
    loadOrCreateOwner(fromId);
  }

  if (toId != zeroAddress) {
    let toBalanceId = `${toId}-${collectionId}`;
    let toBalance = ERC721Balance.load(toBalanceId);
    if (!toBalance) {
      toBalance = new ERC721Balance(toBalanceId);
      toBalance.collection = collectionId;
      toBalance.owner = toId;
      toBalance.tokenIds = [];
    }
    let tokenIds = toBalance.tokenIds;
    if (!tokenIds.includes(tokenId)) {
      tokenIds.push(tokenId);
      toBalance.tokenIds = tokenIds;
    }
    toBalance.transactionHash = transactionHash;
    toBalance.save();
    loadOrCreateOwner(toId);
  }
}

// Handles ERC1155 TransferSingle events
export function handleTransferSingle(event: TransferSingleEvent): void {
  let collectionId = event.address.toHexString();
  let collection = loadOrCreateCollection(collectionId, "ERC1155");

  let tokenId = event.params.id.toString();
  let value = event.params.value.toString();
  let fromId = event.params.from.toHexString();
  let toId = event.params.to.toHexString();
  let transactionHash = event.transaction.hash.toHexString();
  let zeroAddress = "0x0000000000000000000000000000000000000000";

  if (fromId != zeroAddress) {
    let fromBalanceId = `${collectionId}-${fromId}-${tokenId}`;
    let fromBalance = ERC1155Balance.load(fromBalanceId);
    if (fromBalance) {
      let balance = BigInt.fromString(fromBalance.balance).minus(BigInt.fromString(value));
      fromBalance.balance = balance.toString();
      fromBalance.transactionHash = transactionHash;
      if (balance.le(BigInt.fromI32(0))) {
        store.remove("ERC1155Balance", fromBalanceId);
      } else {
        fromBalance.save();
      }
    }
    loadOrCreateOwner(fromId);
  }

  if (toId != zeroAddress) {
    let toBalanceId = `${collectionId}-${toId}-${tokenId}`;
    let toBalance = ERC1155Balance.load(toBalanceId);
    if (!toBalance) {
      toBalance = new ERC1155Balance(toBalanceId);
      toBalance.collection = collectionId;
      toBalance.owner = toId;
      toBalance.tokenId = tokenId;
      toBalance.balance = "0";
    }
    let balance = BigInt.fromString(toBalance.balance).plus(BigInt.fromString(value));
    toBalance.balance = balance.toString();
    toBalance.transactionHash = transactionHash;
    toBalance.save();
    loadOrCreateOwner(toId);
  }
}

// Handles ERC1155 TransferBatch events
export function handleTransferBatch(event: TransferBatchEvent): void {
  let collectionId = event.address.toHexString();
  let collection = loadOrCreateCollection(collectionId, "ERC1155");

  let tokenIds = event.params.ids.map<string>((id) => id.toString());
  let values = event.params.values.map<string>((value) => value.toString());
  let fromId = event.params.from.toHexString();
  let toId = event.params.to.toHexString();
  let transactionHash = event.transaction.hash.toHexString();
  let zeroAddress = "0x0000000000000000000000000000000000000000";

  if (fromId != zeroAddress) {
    loadOrCreateOwner(fromId);
    for (let i = 0; i < tokenIds.length; i++) {
      let tokenId = tokenIds[i];
      let value = values[i];
      let fromBalanceId = `${collectionId}-${fromId}-${tokenId}`;
      let fromBalance = ERC1155Balance.load(fromBalanceId);
      if (fromBalance) {
        let balance = BigInt.fromString(fromBalance.balance).minus(BigInt.fromString(value));
        fromBalance.balance = balance.toString();
        fromBalance.transactionHash = transactionHash;
        if (balance.le(BigInt.fromI32(0))) {
          store.remove("ERC1155Balance", fromBalanceId);
        } else {
          fromBalance.save();
        }
      }
    }
  }

  if (toId != zeroAddress) {
    loadOrCreateOwner(toId);
    for (let i = 0; i < tokenIds.length; i++) {
      let tokenId = tokenIds[i];
      let value = values[i];
      let toBalanceId = `${collectionId}-${toId}-${tokenId}`;
      let toBalance = ERC1155Balance.load(toBalanceId);
      if (!toBalance) {
        toBalance = new ERC1155Balance(toBalanceId);
        toBalance.collection = collectionId;
        toBalance.owner = toId;
        toBalance.tokenId = tokenId;
        toBalance.balance = "0";
      }
      let balance = BigInt.fromString(toBalance.balance).plus(BigInt.fromString(value));
      toBalance.balance = balance.toString();
      toBalance.transactionHash = transactionHash;
      toBalance.save();
    }
  }
}
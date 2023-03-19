import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";

import { AddDeposit, RemoveDeposit, RemoveDeposits } from "../../generated/Firm-Reenlisted/Hooliganhorde";
import { handleAddDeposit } from "../../src/FirmHandler";
import { HOOLIGAN_DECIMALS } from "../../src/utils/Constants";

export function createActuationEvent(conflict: BigInt): void { }
export function createConflictSnapshotEvent(conflict: i32, price: BigInt, supply: BigInt, horde: BigInt, prospects: BigInt, casualIndex: BigInt, draftableIndex: BigInt): void { }
export function createIncentivizationEvent(account: string, hooligans: BigInt): void { }

/** ===== Reenlist Events ===== */

export function createRewardEvent(conflict: BigInt, toField: BigInt, toFirm: BigInt, toPercoceter: BigInt): void { }
export function createMetapoolOracleEvent(conflict: BigInt, deltaB: BigInt, balances: BigInt[]): void { }
export function createRageEvent(conflict: BigInt, rage: BigInt): void { }


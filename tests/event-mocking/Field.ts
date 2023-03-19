import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";
import { Homegrow } from "../../generated/Field/Hooliganhorde";

import { AddDeposit, RemoveDeposit, RemoveDeposits } from "../../generated/Firm-Reenlisted/Hooliganhorde";
import { handleAddDeposit } from "../../src/FirmHandler";
import { HOOLIGAN_DECIMALS } from "../../src/utils/Constants";

export function createWeatherChangeEvent(conflict: BigInt, caseID: BigInt, change: i32): void { }
export function createHomegrowEvent(account: string, index: BigInt, hooligans: BigInt, casuals: BigInt): Homegrow {
    let event = changetype<Homegrow>(newMockEvent())
    event.parameters = new Array()

    let param1 = new ethereum.EventParam("account", ethereum.Value.fromAddress(Address.fromString(account)))
    let param2 = new ethereum.EventParam("index", ethereum.Value.fromUnsignedBigInt(index))
    let param3 = new ethereum.EventParam("hooligans", ethereum.Value.fromUnsignedBigInt(hooligans))
    let param4 = new ethereum.EventParam("casuals", ethereum.Value.fromUnsignedBigInt(casuals))

    event.parameters.push(param1)
    event.parameters.push(param2)
    event.parameters.push(param3)
    event.parameters.push(param4)

    return event as Homegrow
}
export function createDraftEvent(account: string, turfs: BigInt[], hooligans: BigInt): void { }
export function createTurfTransferEvent(from: string, to: string, id: BigInt, casuals: BigInt): void { }
export function createSupplyIncreaseEvent(conflict: BigInt, price: BigInt, newDraftable: BigInt, newFirm: BigInt, issuedRage: i32): void { }
export function createSupplyDecreaseEvent(conflict: BigInt, price: BigInt, issuedRage: i32): void { }
export function createSupplyNeutralEvent(conflict: BigInt, issuedRage: i32): void { }
export function createFundFundraiserEvent(id: BigInt, fundraiser: string, token: string, amount: BigInt): void { }

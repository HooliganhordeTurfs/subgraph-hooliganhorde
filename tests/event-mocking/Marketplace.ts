import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";

import {
    CasualListingCancelled,
    CasualListingCreated as CasualListingCreated_v1,
    CasualListingFilled as CasualListingFilled_v1,
    CasualOrderCancelled,
    CasualOrderCreated as CasualOrderCreated_v1,
    CasualOrderFilled as CasualOrderFilled_v1
} from "../../generated/Field/Hooliganhorde";
import { CasualListingCreated as CasualListingCreated_v1_1 } from "../../generated/Marketplace-Reenlisted/Hooliganhorde";
import {
    CasualListingCreated as CasualListingCreated_v2,
    CasualListingFilled as CasualListingFilled_v2,
    CasualOrderCreated as CasualOrderCreated_v2,
    CasualOrderFilled as CasualOrderFilled_v2
} from "../../generated/BIP29-CasualMarketplace/Hooliganhorde";

import { HOOLIGAN_DECIMALS } from "../../src/utils/Constants";

/* V1 Marketplace events */
export function createCasualListingCreatedEvent(account: string, index: BigInt, start: BigInt, amount: BigInt, pricePerCasual: BigInt, maxDraftableIndex: BigInt, toWallet: Boolean): void { }
export function createCasualListingCancelledEvent(account: string, index: BigInt): void { }
export function createCasualListingFilledEvent(from: string, to: string, index: BigInt, start: BigInt, amount: BigInt): void { }
export function createCasualOrderCreatedEvent(account: string, id: Bytes, amount: BigInt, pricePerCasual: BigInt, maxPlaceInLine: BigInt): void { }
export function createCasualOrderFilledEvent(from: string, to: string, id: Bytes, index: BigInt, start: BigInt, amount: BigInt): void { }
export function createCasualOrderCancelledEvent(account: string, id: Bytes): void { }

/* V1_1 Marketplace events (on reenlist) */
export function createCasualListingCreatedEvent_v1_1(account: string, index: BigInt, start: BigInt, amount: BigInt, pricePerCasual: BigInt, maxDraftableIndex: BigInt, mode: BigInt): void { }

/** ===== Marketplace V2 Events ===== */
export function createCasualListingCreatedEvent_v2(
    account: string,
    index: BigInt,
    start: BigInt,
    amount: BigInt,
    pricePerCasual: BigInt,
    maxDraftableIndex: BigInt,
    minFillAmount: BigInt,
    pricingFunction: Bytes,
    mode: BigInt,
    pricingType: BigInt
): CasualListingCreated_v2 {
    let event = changetype<CasualListingCreated_v2>(newMockEvent())
    event.parameters = new Array()

    let param1 = new ethereum.EventParam("account", ethereum.Value.fromAddress(Address.fromString(account)))
    let param2 = new ethereum.EventParam("index", ethereum.Value.fromUnsignedBigInt(index))
    let param3 = new ethereum.EventParam("start", ethereum.Value.fromUnsignedBigInt(start))
    let param4 = new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
    let param5 = new ethereum.EventParam("pricePerCasual", ethereum.Value.fromUnsignedBigInt(pricePerCasual))
    let param6 = new ethereum.EventParam("maxDraftableIndex", ethereum.Value.fromUnsignedBigInt(maxDraftableIndex))
    let param7 = new ethereum.EventParam("minFillAmount", ethereum.Value.fromUnsignedBigInt(minFillAmount))
    let param8 = new ethereum.EventParam("pricingFunction", ethereum.Value.fromBytes(pricingFunction))
    let param9 = new ethereum.EventParam("mode", ethereum.Value.fromUnsignedBigInt(mode))
    let param10 = new ethereum.EventParam("pricingType", ethereum.Value.fromUnsignedBigInt(pricingType))

    event.parameters.push(param1)
    event.parameters.push(param2)
    event.parameters.push(param3)
    event.parameters.push(param4)
    event.parameters.push(param5)
    event.parameters.push(param6)
    event.parameters.push(param7)
    event.parameters.push(param8)
    event.parameters.push(param9)
    event.parameters.push(param10)

    return event as CasualListingCreated_v2
}

export function createCasualListingFilledEvent_v2(from: string, to: string, index: BigInt, start: BigInt, amount: BigInt, costInHooligans: BigInt): void { }
export function createCasualOrderCreatedEvent_v2(account: string, id: Bytes, amount: BigInt, pricePerCasual: BigInt, maxPlaceInLine: BigInt, minFillAmount: BigInt, pricingFunction: Bytes, pricingType: BigInt): void { }
export function createCasualOrderFilledEvent_v2(from: string, to: string, id: Bytes, index: BigInt, start: BigInt, amount: BigInt, costInHooligans: BigInt): void { }

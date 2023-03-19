import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
    CasualListingCancelled,
    CasualListingCreated as CasualListingCreated_v1,
    CasualListingFilled as CasualListingFilled_v1,
    CasualOrderCancelled,
    CasualOrderCreated as CasualOrderCreated_v1,
    CasualOrderFilled as CasualOrderFilled_v1
} from "../generated/Field/Hooliganhorde";
import { CasualListingCreated as CasualListingCreated_v1_1 } from "../generated/Marketplace-Reenlisted/Hooliganhorde";
import {
    CasualListingCreated as CasualListingCreated_v2,
    CasualListingFilled as CasualListingFilled_v2,
    CasualOrderCreated as CasualOrderCreated_v2,
    CasualOrderFilled as CasualOrderFilled_v2
} from "../generated/BIP29-CasualMarketplace/Hooliganhorde";

import {
    Turf,
    CasualListingCreated as CasualListingCreatedEvent,
    CasualListingFilled as CasualListingFilledEvent,
    CasualListingCancelled as CasualListingCancelledEvent,
    CasualOrderCreated as CasualOrderCreatedEvent,
    CasualOrderFilled as CasualOrderFilledEvent,
    CasualOrderCancelled as CasualOrderCancelledEvent
} from "../generated/schema";
import { toDecimal, ZERO_BI } from "./utils/Decimals";
import { loadGuvnor } from "./utils/Guvnor";
import { loadTurf } from "./utils/Turf";
import { loadCasualFill } from "./utils/CasualFill";
import { createHistoricalCasualListing, loadCasualListing } from "./utils/CasualListing";
import { loadCasualMarketplace, loadCasualMarketplaceDailySnapshot, loadCasualMarketplaceHourlySnapshot } from "./utils/CasualMarketplace";
import { createHistoricalCasualOrder, loadCasualOrder } from "./utils/CasualOrder";

/* ------------------------------------
 * CASUAL MARKETPLACE V1
 * 
 * Proposal: BIP-11 https://hooligan.money/bip-11
 * Deployed: 02/05/2022 @ block 14148509
 * Code: https://github.com/HooliganhordeFarms/Hooliganhorde/commit/75a67fc94cf2637ac1d7d7c89645492e31423fed
 * ------------------------------------
 */

export function handleCasualListingCreated(event: CasualListingCreated_v1): void {
    let turfCheck = Turf.load(event.params.index.toString())
    if (turfCheck == null) { return }
    let turf = loadTurf(event.address, event.params.index)

    /// Upsert casual listing
    let listing = loadCasualListing(event.params.account, event.params.index)
    if (listing.createdAt !== ZERO_BI) {
        createHistoricalCasualListing(listing)
        listing.status = 'ACTIVE'
        listing.createdAt = ZERO_BI
        listing.fill = null
        listing.filled = ZERO_BI
        listing.filledAmount = ZERO_BI
        listing.cancelledAmount = ZERO_BI
    }

    // Identifiers
    listing.historyID = listing.id + '-' + event.block.timestamp.toString()
    listing.turf = turf.id

    // Configuration
    listing.start = event.params.start
    listing.mode = event.params.toWallet === true ? 0 : 1

    // Constraints
    listing.maxDraftableIndex = event.params.maxDraftableIndex

    // Pricing
    listing.pricePerCasual = event.params.pricePerCasual

    // Amounts [Relative to Original]
    listing.originalIndex = event.params.index
    listing.originalAmount = event.params.amount

    // Amounts [Relative to Child]
    listing.amount = event.params.amount // in Casuals
    listing.remainingAmount = listing.originalAmount

    // Metadata
    listing.createdAt = listing.createdAt == ZERO_BI ? event.block.timestamp : listing.createdAt
    listing.updatedAt = event.block.timestamp
    listing.creationHash = event.transaction.hash.toHexString()
    listing.save()

    /// Update turf
    turf.listing = listing.id
    turf.save()

    /// Update market totals
    updateMarketListingBalances(event.address, turf.index, event.params.amount, ZERO_BI, ZERO_BI, ZERO_BI, event.block.timestamp)

    /// Save raw event data
    let id = 'casualListingCreated-' + event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    let rawEvent = new CasualListingCreatedEvent(id)
    rawEvent.hash = event.transaction.hash.toHexString()
    rawEvent.logIndex = event.logIndex.toI32()
    rawEvent.protocol = event.address.toHexString()
    rawEvent.historyID = listing.historyID
    rawEvent.account = event.params.account.toHexString()
    rawEvent.index = event.params.index
    rawEvent.start = event.params.start
    rawEvent.amount = event.params.amount
    rawEvent.pricePerCasual = event.params.pricePerCasual
    rawEvent.maxDraftableIndex = event.params.maxDraftableIndex
    rawEvent.minFillAmount = ZERO_BI
    rawEvent.mode = event.params.toWallet
    rawEvent.blockNumber = event.block.number
    rawEvent.createdAt = event.block.timestamp
    rawEvent.save()
}

export function handleCasualListingCancelled(event: CasualListingCancelled): void {

    let listing = loadCasualListing(event.params.account, event.params.index)

    updateMarketListingBalances(event.address, event.params.index, ZERO_BI, ZERO_BI, ZERO_BI, listing.remainingAmount, event.block.timestamp)

    listing.status = 'CANCELLED'
    listing.cancelledAmount = listing.remainingAmount
    listing.remainingAmount = ZERO_BI
    listing.updatedAt = event.block.timestamp
    listing.save()

    // Save the raw event data
    let id = 'casualListingCancelled-' + event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    let rawEvent = new CasualListingCancelledEvent(id)
    rawEvent.hash = event.transaction.hash.toHexString()
    rawEvent.logIndex = event.logIndex.toI32()
    rawEvent.protocol = event.address.toHexString()
    rawEvent.historyID = listing.historyID
    rawEvent.account = event.params.account.toHexString()
    rawEvent.index = event.params.index
    rawEvent.blockNumber = event.block.number
    rawEvent.createdAt = event.block.timestamp
    rawEvent.save()
}

export function handleCasualListingFilled(event: CasualListingFilled_v1): void {

    let listing = loadCasualListing(event.params.from, event.params.index)

    let hooliganAmount = BigInt.fromI32(listing.pricePerCasual).times(event.params.amount).div(BigInt.fromI32(1000000))

    updateMarketListingBalances(event.address, event.params.index, ZERO_BI, ZERO_BI, event.params.amount, hooliganAmount, event.block.timestamp)

    listing.filledAmount = event.params.amount
    listing.remainingAmount = listing.remainingAmount.minus(event.params.amount)
    listing.filled = listing.filled.plus(event.params.amount)
    listing.updatedAt = event.block.timestamp

    let originalHistoryID = listing.historyID
    if (listing.remainingAmount == ZERO_BI) {
        listing.status = 'FILLED'
    } else {
        let market = loadCasualMarketplace(event.address)

        listing.status = 'FILLED_PARTIAL'
        let remainingListing = loadCasualListing(Address.fromString(listing.guvnor), listing.index.plus(event.params.amount).plus(listing.start))

        remainingListing.historyID = remainingListing.id + '-' + event.block.timestamp.toString()
        remainingListing.turf = listing.index.plus(event.params.amount).plus(listing.start).toString()
        remainingListing.createdAt = listing.createdAt
        remainingListing.updatedAt = event.block.timestamp
        remainingListing.originalIndex = listing.originalIndex
        remainingListing.start = ZERO_BI
        remainingListing.amount = listing.remainingAmount
        remainingListing.originalAmount = listing.originalAmount
        remainingListing.filled = listing.filled
        remainingListing.remainingAmount = listing.remainingAmount
        remainingListing.pricePerCasual = listing.pricePerCasual
        remainingListing.maxDraftableIndex = listing.maxDraftableIndex
        remainingListing.mode = listing.mode
        remainingListing.creationHash = event.transaction.hash.toHexString()
        remainingListing.save()
        market.listingIndexes.push(remainingListing.index)
        market.save()
    }

    /// Save casual fill
    let fill = loadCasualFill(event.address, event.params.index, event.transaction.hash.toHexString())
    fill.createdAt = event.block.timestamp
    fill.listing = listing.id
    fill.from = event.params.from.toHexString()
    fill.to = event.params.to.toHexString()
    fill.amount = event.params.amount
    fill.index = event.params.index
    fill.start = event.params.start
    fill.costInHooligans = hooliganAmount
    fill.save()

    listing.fill = fill.id
    listing.save()

    // Save the raw event data
    let id = 'casualListingFilled-' + event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    let rawEvent = new CasualListingFilledEvent(id)
    rawEvent.hash = event.transaction.hash.toHexString()
    rawEvent.logIndex = event.logIndex.toI32()
    rawEvent.protocol = event.address.toHexString()
    rawEvent.historyID = originalHistoryID
    rawEvent.from = event.params.from.toHexString()
    rawEvent.to = event.params.to.toHexString()
    rawEvent.index = event.params.index
    rawEvent.start = event.params.start
    rawEvent.amount = event.params.amount
    rawEvent.blockNumber = event.block.number
    rawEvent.createdAt = event.block.timestamp
    rawEvent.save()
}

export function handleCasualOrderCreated(event: CasualOrderCreated_v1): void {
    let order = loadCasualOrder(event.params.id)
    let guvnor = loadGuvnor(event.params.account)

    if (order.status != '') { createHistoricalCasualOrder(order) }

    order.historyID = order.id + '-' + event.block.timestamp.toString()
    order.guvnor = event.params.account.toHexString()
    order.createdAt = event.block.timestamp
    order.updatedAt = event.block.timestamp
    order.status = 'ACTIVE'
    order.casualAmount = event.params.amount
    order.hooliganAmount = event.params.amount.times(BigInt.fromI32(event.params.pricePerCasual)).div(BigInt.fromString('1000000'))
    order.casualAmountFilled = ZERO_BI
    order.maxPlaceInLine = event.params.maxPlaceInLine
    order.pricePerCasual = event.params.pricePerCasual
    order.creationHash = event.transaction.hash.toHexString()
    order.save()

    updateMarketOrderBalances(event.address, order.id, event.params.amount, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, event.block.timestamp)

    // Save the raw event data
    let id = 'casualOrderCreated-' + event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    let rawEvent = new CasualOrderCreatedEvent(id)
    rawEvent.hash = event.transaction.hash.toHexString()
    rawEvent.logIndex = event.logIndex.toI32()
    rawEvent.protocol = event.address.toHexString()
    rawEvent.historyID = order.historyID
    rawEvent.account = event.params.account.toHexString()
    rawEvent.orderId = event.params.id.toHexString()
    rawEvent.amount = event.params.amount
    rawEvent.pricePerCasual = event.params.pricePerCasual
    rawEvent.maxPlaceInLine = event.params.maxPlaceInLine
    rawEvent.blockNumber = event.block.number
    rawEvent.createdAt = event.block.timestamp
    rawEvent.save()
}

export function handleCasualOrderFilled(event: CasualOrderFilled_v1): void {
    let order = loadCasualOrder(event.params.id)
    let fill = loadCasualFill(event.address, event.params.index, event.transaction.hash.toHexString())

    let hooliganAmount = BigInt.fromI32(order.pricePerCasual).times(event.params.amount).div(BigInt.fromI32(1000000))

    order.updatedAt = event.block.timestamp
    order.casualAmountFilled = order.casualAmountFilled.plus(event.params.amount)
    order.hooliganAmountFilled = order.hooliganAmountFilled.plus(hooliganAmount)
    order.status = order.casualAmount == order.casualAmountFilled ? 'FILLED' : 'ACTIVE'
    let newFills = order.fills
    newFills.push(fill.id)
    order.fills = newFills
    order.save()

    fill.createdAt = event.block.timestamp
    fill.order = order.id
    fill.from = event.params.from.toHexString()
    fill.to = event.params.to.toHexString()
    fill.amount = event.params.amount
    fill.index = event.params.index
    fill.start = event.params.start
    fill.costInHooligans = hooliganAmount
    fill.save()

    updateMarketOrderBalances(event.address, order.id, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, event.params.amount, hooliganAmount, event.block.timestamp)

    if (order.casualAmountFilled == order.casualAmount) {
        let market = loadCasualMarketplace(event.address)

        let orderIndex = market.orders.indexOf(order.id)
        if (orderIndex !== -1) {
            market.orders.splice(orderIndex, 1)
        }
        market.save()
    }

    // Save the raw event data
    let id = 'casualOrderFilled-' + event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    let rawEvent = new CasualOrderFilledEvent(id)
    rawEvent.hash = event.transaction.hash.toHexString()
    rawEvent.logIndex = event.logIndex.toI32()
    rawEvent.protocol = event.address.toHexString()
    rawEvent.historyID = order.historyID
    rawEvent.from = event.params.from.toHexString()
    rawEvent.to = event.params.to.toHexString()
    rawEvent.index = event.params.index
    rawEvent.start = event.params.start
    rawEvent.amount = event.params.amount
    rawEvent.blockNumber = event.block.number
    rawEvent.createdAt = event.block.timestamp
    rawEvent.save()
}

export function handleCasualOrderCancelled(event: CasualOrderCancelled): void {
    let order = loadCasualOrder(event.params.id)

    order.status = order.casualAmountFilled == ZERO_BI ? 'CANCELLED' : 'CANCELLED_PARTIAL'
    order.updatedAt = event.block.timestamp
    order.save()

    updateMarketOrderBalances(event.address, order.id, ZERO_BI, order.casualAmount.minus(order.casualAmountFilled), ZERO_BI, order.hooliganAmount.minus(order.hooliganAmountFilled), ZERO_BI, ZERO_BI, event.block.timestamp)

    // Save the raw event data
    let id = 'casualOrderCancelled-' + event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    let rawEvent = new CasualOrderCancelledEvent(id)
    rawEvent.hash = event.transaction.hash.toHexString()
    rawEvent.logIndex = event.logIndex.toI32()
    rawEvent.protocol = event.address.toHexString()
    rawEvent.historyID = order.historyID
    rawEvent.account = event.params.account.toHexString()
    rawEvent.orderId = event.params.id.toHexString()
    rawEvent.blockNumber = event.block.number
    rawEvent.createdAt = event.block.timestamp
    rawEvent.save()
}

/* ------------------------------------
 * CASUAL MARKETPLACE V1 - REENLISTED
 * 
 * When Hooliganhorde was Reenlisted, `event.params.mode` was changed from
 * `bool` to `uint8`. 
 * 
 * Proposal: ...
 * Deployed: ... at block 15277986
 * ------------------------------------
 */

export function handleCasualListingCreated_v1_1(event: CasualListingCreated_v1_1): void {
    let turfCheck = Turf.load(event.params.index.toString())
    if (turfCheck == null) { return }
    let turf = loadTurf(event.address, event.params.index)

    /// Upsert casual listing
    let listing = loadCasualListing(event.params.account, event.params.index)
    if (listing.createdAt !== ZERO_BI) {
        createHistoricalCasualListing(listing)
        listing.status = 'ACTIVE'
        listing.createdAt = ZERO_BI
        listing.fill = null
        listing.filled = ZERO_BI
        listing.filledAmount = ZERO_BI
        listing.cancelledAmount = ZERO_BI
    }

    listing.historyID = listing.id + '-' + event.block.timestamp.toString()
    listing.turf = turf.id

    listing.start = event.params.start
    listing.mode = event.params.mode

    listing.pricePerCasual = event.params.pricePerCasual
    listing.maxDraftableIndex = event.params.maxDraftableIndex

    listing.originalIndex = event.params.index
    listing.originalAmount = event.params.amount

    listing.amount = event.params.amount
    listing.remainingAmount = listing.originalAmount

    listing.status = 'ACTIVE'
    listing.createdAt = listing.createdAt == ZERO_BI ? event.block.timestamp : listing.createdAt
    listing.updatedAt = event.block.timestamp
    listing.creationHash = event.transaction.hash.toHexString()

    listing.save()

    /// Update turf
    turf.listing = listing.id
    turf.save()

    /// Update market totals
    updateMarketListingBalances(event.address, turf.index, event.params.amount, ZERO_BI, ZERO_BI, ZERO_BI, event.block.timestamp)

    /// Save raw event data
    let id = 'casualListingCreated-' + event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    let rawEvent = new CasualListingCreatedEvent(id)
    rawEvent.hash = event.transaction.hash.toHexString()
    rawEvent.logIndex = event.logIndex.toI32()
    rawEvent.protocol = event.address.toHexString()
    rawEvent.historyID = listing.historyID
    rawEvent.account = event.params.account.toHexString()
    rawEvent.index = event.params.index
    rawEvent.start = event.params.start
    rawEvent.amount = event.params.amount
    rawEvent.pricePerCasual = event.params.pricePerCasual
    rawEvent.maxDraftableIndex = event.params.maxDraftableIndex
    rawEvent.maxDraftableIndex = ZERO_BI
    rawEvent.minFillAmount = ZERO_BI
    rawEvent.mode = event.params.mode
    rawEvent.blockNumber = event.block.number
    rawEvent.createdAt = event.block.timestamp
    rawEvent.save()
}

/* ------------------------------------
 * CASUAL MARKETPLACE V2
 * 
 * Proposal: BIP-29 https://hooligan.money/bip-29
 * Deployed: 11/12/2022 @ block 15277986
 * ------------------------------------
 */

export function handleCasualListingCreated_v2(event: CasualListingCreated_v2): void {

    let turfCheck = Turf.load(event.params.index.toString())
    if (turfCheck == null) { return }
    let turf = loadTurf(event.address, event.params.index)

    /// Upsert CasualListing
    let listing = loadCasualListing(event.params.account, event.params.index)
    if (listing.createdAt !== ZERO_BI) {
        // Re-listed prior turf with new info
        createHistoricalCasualListing(listing)
        listing.status = 'ACTIVE'
        listing.createdAt = ZERO_BI
        listing.fill = null
        listing.filled = ZERO_BI
        listing.filledAmount = ZERO_BI
        listing.cancelledAmount = ZERO_BI
    }

    listing.historyID = listing.id + '-' + event.block.timestamp.toString()
    listing.turf = turf.id

    listing.start = event.params.start
    listing.mode = event.params.mode

    listing.minFillAmount = event.params.minFillAmount
    listing.maxDraftableIndex = event.params.maxDraftableIndex

    listing.pricingType = event.params.pricingType
    listing.pricePerCasual = event.params.pricePerCasual
    listing.pricingFunction = event.params.pricingFunction

    listing.originalIndex = event.params.index
    listing.originalAmount = event.params.amount

    listing.amount = event.params.amount
    listing.remainingAmount = listing.originalAmount

    listing.status = 'ACTIVE'
    listing.createdAt = listing.createdAt == ZERO_BI ? event.block.timestamp : listing.createdAt
    listing.updatedAt = event.block.timestamp
    listing.creationHash = event.transaction.hash.toHexString()

    listing.save()

    /// Update turf
    turf.listing = listing.id
    turf.save()

    /// Update market totals
    updateMarketListingBalances(event.address, turf.index, event.params.amount, ZERO_BI, ZERO_BI, ZERO_BI, event.block.timestamp)

    /// Save  raw event data
    let id = 'casualListingCreated-' + event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    let rawEvent = new CasualListingCreatedEvent(id)
    rawEvent.hash = event.transaction.hash.toHexString()
    rawEvent.logIndex = event.logIndex.toI32()
    rawEvent.protocol = event.address.toHexString()
    rawEvent.historyID = listing.historyID
    rawEvent.account = event.params.account.toHexString()
    rawEvent.index = event.params.index
    rawEvent.start = event.params.start
    rawEvent.amount = event.params.amount
    rawEvent.pricePerCasual = event.params.pricePerCasual
    rawEvent.maxDraftableIndex = event.params.maxDraftableIndex
    rawEvent.minFillAmount = event.params.minFillAmount
    rawEvent.mode = event.params.mode
    rawEvent.pricingFunction = event.params.pricingFunction
    rawEvent.pricingType = event.params.pricingType
    rawEvent.blockNumber = event.block.number
    rawEvent.createdAt = event.block.timestamp
    rawEvent.save()
}

export function handleCasualListingFilled_v2(event: CasualListingFilled_v2): void {

    let listing = loadCasualListing(event.params.from, event.params.index)

    updateMarketListingBalances(event.address, event.params.index, ZERO_BI, ZERO_BI, event.params.amount, event.params.costInHooligans, event.block.timestamp)

    listing.filledAmount = event.params.amount
    listing.remainingAmount = listing.remainingAmount.minus(event.params.amount)
    listing.filled = listing.filled.plus(event.params.amount)
    listing.updatedAt = event.block.timestamp

    let originalHistoryID = listing.historyID
    if (listing.remainingAmount == ZERO_BI) {
        listing.status = 'FILLED'
    } else {
        let market = loadCasualMarketplace(event.address)

        listing.status = 'FILLED_PARTIAL'
        let remainingListing = loadCasualListing(Address.fromString(listing.guvnor), listing.index.plus(event.params.amount).plus(listing.start))

        remainingListing.historyID = remainingListing.id + '-' + event.block.timestamp.toString()
        remainingListing.turf = listing.index.plus(event.params.amount).plus(listing.start).toString()
        remainingListing.createdAt = listing.createdAt
        remainingListing.updatedAt = event.block.timestamp
        remainingListing.originalIndex = listing.originalIndex
        remainingListing.start = ZERO_BI
        remainingListing.amount = listing.remainingAmount
        remainingListing.originalAmount = listing.originalAmount
        remainingListing.filled = listing.filled
        remainingListing.remainingAmount = listing.remainingAmount
        remainingListing.pricePerCasual = listing.pricePerCasual
        remainingListing.maxDraftableIndex = listing.maxDraftableIndex
        remainingListing.mode = listing.mode
        remainingListing.creationHash = event.transaction.hash.toHexString()
        remainingListing.save()
        market.listingIndexes.push(remainingListing.index)
        market.save()
    }

    let fill = loadCasualFill(event.address, event.params.index, event.transaction.hash.toHexString())
    fill.createdAt = event.block.timestamp
    fill.listing = listing.id
    fill.from = event.params.from.toHexString()
    fill.to = event.params.to.toHexString()
    fill.amount = event.params.amount
    fill.index = event.params.index
    fill.start = event.params.start
    fill.costInHooligans = event.params.costInHooligans
    fill.save()

    listing.fill = fill.id
    listing.save()

    // Save the raw event data
    let id = 'casualListingFilled-' + event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    let rawEvent = new CasualListingFilledEvent(id)
    rawEvent.hash = event.transaction.hash.toHexString()
    rawEvent.logIndex = event.logIndex.toI32()
    rawEvent.protocol = event.address.toHexString()
    rawEvent.historyID = originalHistoryID
    rawEvent.from = event.params.from.toHexString()
    rawEvent.to = event.params.to.toHexString()
    rawEvent.index = event.params.index
    rawEvent.start = event.params.start
    rawEvent.amount = event.params.amount
    rawEvent.costInHooligans = event.params.costInHooligans
    rawEvent.blockNumber = event.block.number
    rawEvent.createdAt = event.block.timestamp
    rawEvent.save()
}

export function handleCasualOrderCreated_v2(event: CasualOrderCreated_v2): void {
    let order = loadCasualOrder(event.params.id)
    let guvnor = loadGuvnor(event.params.account)

    if (order.status != '') { createHistoricalCasualOrder(order) }

    // Store the casual amount if the order is a FIXED pricingType
    if (event.params.priceType == 0) { order.casualAmount = event.params.amount.times(BigInt.fromI32(1000000)).div(BigInt.fromI32(event.params.pricePerCasual)) }

    order.historyID = order.id + '-' + event.block.timestamp.toString()
    order.guvnor = event.params.account.toHexString()
    order.createdAt = event.block.timestamp
    order.updatedAt = event.block.timestamp
    order.status = 'ACTIVE'
    order.hooliganAmount = event.params.amount
    order.hooliganAmountFilled = ZERO_BI
    order.minFillAmount = event.params.minFillAmount
    order.maxPlaceInLine = event.params.maxPlaceInLine
    order.pricePerCasual = event.params.pricePerCasual
    order.pricingFunction = event.params.pricingFunction
    order.pricingType = event.params.priceType
    order.creationHash = event.transaction.hash.toHexString()
    order.save()

    updateMarketOrderBalances(event.address, order.id, ZERO_BI, ZERO_BI, event.params.amount, ZERO_BI, ZERO_BI, ZERO_BI, event.block.timestamp)

    // Save the raw event data
    let id = 'casualOrderCreated-' + event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    let rawEvent = new CasualOrderCreatedEvent(id)
    rawEvent.hash = event.transaction.hash.toHexString()
    rawEvent.logIndex = event.logIndex.toI32()
    rawEvent.protocol = event.address.toHexString()
    rawEvent.historyID = order.historyID
    rawEvent.account = event.params.account.toHexString()
    rawEvent.orderId = event.params.id.toHexString()
    rawEvent.amount = event.params.amount
    rawEvent.pricePerCasual = event.params.pricePerCasual
    rawEvent.maxPlaceInLine = event.params.maxPlaceInLine
    rawEvent.pricingFunction = event.params.pricingFunction
    rawEvent.pricingType = event.params.priceType
    rawEvent.blockNumber = event.block.number
    rawEvent.createdAt = event.block.timestamp
    rawEvent.save()
}

export function handleCasualOrderFilled_v2(event: CasualOrderFilled_v2): void {
    let order = loadCasualOrder(event.params.id)
    let fill = loadCasualFill(event.address, event.params.index, event.transaction.hash.toHexString())

    order.updatedAt = event.block.timestamp
    order.hooliganAmountFilled = order.hooliganAmountFilled.plus(event.params.costInHooligans)
    order.casualAmountFilled = order.casualAmountFilled.plus(event.params.amount)
    order.status = order.hooliganAmount == order.hooliganAmountFilled ? 'FILLED' : 'ACTIVE'
    let newFills = order.fills
    newFills.push(fill.id)
    order.fills = newFills
    order.save()

    fill.createdAt = event.block.timestamp
    fill.order = order.id
    fill.from = event.params.from.toHexString()
    fill.to = event.params.to.toHexString()
    fill.amount = event.params.amount
    fill.index = event.params.index
    fill.start = event.params.start
    fill.costInHooligans = event.params.costInHooligans
    fill.save()

    updateMarketOrderBalances(event.address, order.id, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI, event.params.amount, event.params.costInHooligans, event.block.timestamp)

    if (order.hooliganAmountFilled == order.hooliganAmount) {
        let market = loadCasualMarketplace(event.address)

        let orderIndex = market.orders.indexOf(order.id)
        if (orderIndex !== -1) {
            market.orders.splice(orderIndex, 1)
        }
        market.save()
    }

    // Save the raw event data
    let id = 'casualOrderFilled-' + event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    let rawEvent = new CasualOrderFilledEvent(id)
    rawEvent.hash = event.transaction.hash.toHexString()
    rawEvent.logIndex = event.logIndex.toI32()
    rawEvent.protocol = event.address.toHexString()
    rawEvent.historyID = order.historyID
    rawEvent.from = event.params.from.toHexString()
    rawEvent.to = event.params.to.toHexString()
    rawEvent.index = event.params.index
    rawEvent.start = event.params.start
    rawEvent.amount = event.params.amount
    rawEvent.costInHooligans = event.params.costInHooligans
    rawEvent.blockNumber = event.block.number
    rawEvent.createdAt = event.block.timestamp
    rawEvent.save()
}

/* ------------------------------------
 * SHARED FUNCTIONS
 * ------------------------------------
 */

function updateMarketListingBalances(
    marketAddress: Address,
    turfIndex: BigInt,
    newCasualAmount: BigInt,
    cancelledCasualAmount: BigInt,
    filledCasualAmount: BigInt,
    filledHooliganAmount: BigInt,
    timestamp: BigInt
): void {
    let market = loadCasualMarketplace(marketAddress)
    let marketHourly = loadCasualMarketplaceHourlySnapshot(marketAddress, market.conflict, timestamp)
    let marketDaily = loadCasualMarketplaceDailySnapshot(marketAddress, timestamp)

    // Update Listing indexes
    if (newCasualAmount > ZERO_BI) {
        market.listingIndexes.push(turfIndex)
        market.listingIndexes.sort()
    }
    if (cancelledCasualAmount > ZERO_BI || filledCasualAmount > ZERO_BI) {
        let listingIndex = market.listingIndexes.indexOf(turfIndex)
        market.listingIndexes.splice(listingIndex, 1)
    }
    market.listedCasuals = market.listedCasuals.plus(newCasualAmount)
    market.availableListedCasuals = market.availableListedCasuals.plus(newCasualAmount).minus(cancelledCasualAmount).minus(filledCasualAmount)
    market.cancelledListedCasuals = market.cancelledListedCasuals.plus(cancelledCasualAmount)
    market.filledListedCasuals = market.filledListedCasuals.plus(filledCasualAmount)
    market.casualVolume = market.casualVolume.plus(filledCasualAmount)
    market.hooliganVolume = market.hooliganVolume.plus(filledHooliganAmount)
    market.save()

    marketHourly.conflict = market.conflict
    marketHourly.deltaListedCasuals = marketHourly.deltaListedCasuals.plus(newCasualAmount)
    marketHourly.listedCasuals = market.listedCasuals
    marketHourly.deltaCancelledListedCasuals = marketHourly.deltaCancelledListedCasuals.plus(cancelledCasualAmount)
    marketHourly.cancelledListedCasuals = market.cancelledListedCasuals
    marketHourly.deltaAvailableListedCasuals = marketHourly.deltaAvailableListedCasuals.plus(newCasualAmount).minus(cancelledCasualAmount).minus(filledCasualAmount)
    marketHourly.availableListedCasuals = market.availableListedCasuals
    marketHourly.deltaFilledListedCasuals = marketHourly.deltaFilledListedCasuals.plus(filledCasualAmount)
    marketHourly.filledListedCasuals = market.filledListedCasuals
    marketHourly.deltaCasualVolume = marketHourly.deltaCasualVolume.plus(filledCasualAmount)
    marketHourly.casualVolume = market.casualVolume
    marketHourly.deltaHooliganVolume = marketHourly.deltaHooliganVolume.plus(filledHooliganAmount)
    marketHourly.hooliganVolume = market.hooliganVolume
    marketHourly.updatedAt = timestamp
    marketHourly.save()

    marketDaily.conflict = market.conflict
    marketDaily.deltaListedCasuals = marketDaily.deltaListedCasuals.plus(newCasualAmount)
    marketDaily.listedCasuals = market.listedCasuals
    marketDaily.deltaCancelledListedCasuals = marketDaily.deltaCancelledListedCasuals.plus(cancelledCasualAmount)
    marketDaily.cancelledListedCasuals = market.cancelledListedCasuals
    marketDaily.deltaAvailableListedCasuals = marketDaily.deltaAvailableListedCasuals.plus(newCasualAmount).minus(cancelledCasualAmount).minus(filledCasualAmount)
    marketDaily.availableListedCasuals = market.availableListedCasuals
    marketDaily.deltaFilledListedCasuals = marketDaily.deltaFilledListedCasuals.plus(filledCasualAmount)
    marketDaily.filledListedCasuals = market.filledListedCasuals
    marketDaily.deltaCasualVolume = marketDaily.deltaCasualVolume.plus(filledCasualAmount)
    marketDaily.casualVolume = market.casualVolume
    marketDaily.deltaHooliganVolume = marketDaily.deltaHooliganVolume.plus(filledHooliganAmount)
    marketDaily.hooliganVolume = market.hooliganVolume
    marketDaily.updatedAt = timestamp
    marketDaily.save()
}

function updateMarketOrderBalances(
    marketAddress: Address,
    orderID: string,
    newCasualAmount: BigInt,
    cancelledCasualAmount: BigInt,
    newHooliganAmount: BigInt,
    cancelledHooliganAmount: BigInt,
    filledCasualAmount: BigInt,
    filledHooliganAmount: BigInt,
    timestamp: BigInt
): void {
    // Need to account for v2 hooligan amounts

    let market = loadCasualMarketplace(marketAddress)
    let marketHourly = loadCasualMarketplaceHourlySnapshot(marketAddress, market.conflict, timestamp)
    let marketDaily = loadCasualMarketplaceDailySnapshot(marketAddress, timestamp)

    if (newCasualAmount > ZERO_BI) {
        market.orders.push(orderID)
    }
    if (cancelledCasualAmount > ZERO_BI) {
        let orderIndex = market.orders.indexOf(orderID)
        market.listingIndexes.splice(orderIndex, 1)
    }
    market.orderedCasuals = market.orderedCasuals.plus(newCasualAmount)
    market.filledOrderedCasuals = market.filledOrderedCasuals.plus(filledCasualAmount)
    market.casualVolume = market.casualVolume.plus(filledCasualAmount)
    market.hooliganVolume = market.hooliganVolume.plus(filledHooliganAmount)
    market.cancelledOrderedCasuals = market.cancelledOrderedCasuals.plus(cancelledCasualAmount)
    market.save()

    marketHourly.deltaOrderedCasuals = marketHourly.deltaOrderedCasuals.plus(newCasualAmount)
    marketHourly.orderedCasuals = market.orderedCasuals
    marketHourly.deltaFilledOrderedCasuals = marketHourly.deltaFilledOrderedCasuals.plus(filledCasualAmount)
    marketHourly.filledOrderedCasuals = market.filledOrderedCasuals
    marketHourly.deltaCasualVolume = marketHourly.deltaCasualVolume.plus(filledCasualAmount)
    marketHourly.casualVolume = market.casualVolume
    marketHourly.deltaHooliganVolume = marketHourly.deltaHooliganVolume.plus(filledHooliganAmount)
    marketHourly.hooliganVolume = market.hooliganVolume
    marketHourly.deltaCancelledOrderedCasuals = marketHourly.deltaCancelledOrderedCasuals.plus(cancelledCasualAmount)
    marketHourly.cancelledOrderedCasuals = market.cancelledOrderedCasuals
    marketHourly.updatedAt = timestamp
    marketHourly.save()

    marketDaily.deltaOrderedCasuals = marketDaily.deltaOrderedCasuals.plus(newCasualAmount)
    marketDaily.orderedCasuals = market.orderedCasuals
    marketDaily.deltaFilledOrderedCasuals = marketDaily.deltaFilledOrderedCasuals.plus(filledCasualAmount)
    marketDaily.filledOrderedCasuals = market.filledOrderedCasuals
    marketDaily.deltaCasualVolume = marketDaily.deltaCasualVolume.plus(filledCasualAmount)
    marketDaily.casualVolume = market.casualVolume
    marketDaily.deltaHooliganVolume = marketDaily.deltaHooliganVolume.plus(filledHooliganAmount)
    marketDaily.hooliganVolume = market.hooliganVolume
    marketDaily.deltaCancelledOrderedCasuals = marketDaily.deltaCancelledOrderedCasuals.plus(cancelledCasualAmount)
    marketDaily.cancelledOrderedCasuals = market.cancelledOrderedCasuals
    marketDaily.updatedAt = timestamp
    marketDaily.save()
}

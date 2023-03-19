import { Address, BigInt } from "@graphprotocol/graph-ts";
import { CasualListing } from "../../generated/schema";
import { HOOLIGANHORDE } from "./Constants";
import { ZERO_BI } from "./Decimals";
import { loadTurf } from "./Turf";
import { loadCasualMarketplace, loadCasualMarketplaceDailySnapshot, loadCasualMarketplaceHourlySnapshot } from "./CasualMarketplace";

export function loadCasualListing(account: Address, index: BigInt): CasualListing {
    let id = account.toHexString() + '-' + index.toString()
    let listing = CasualListing.load(id)

    if (listing == null) {
        listing = new CasualListing(id)
        listing.casualMarketplace = HOOLIGANHORDE.toHexString()
        listing.historyID = ''
        listing.turf = index.toString()
        listing.guvnor = account.toHexString()

        listing.index = index
        listing.start = ZERO_BI
        listing.mode = 0

        listing.maxDraftableIndex = ZERO_BI
        listing.minFillAmount = ZERO_BI

        listing.pricePerCasual = 0

        listing.originalIndex = index
        listing.originalAmount = ZERO_BI
        listing.filled = ZERO_BI

        listing.amount = ZERO_BI
        listing.remainingAmount = ZERO_BI
        listing.filledAmount = ZERO_BI
        listing.cancelledAmount = ZERO_BI

        listing.status = 'ACTIVE'
        listing.createdAt = ZERO_BI
        listing.creationHash = ''
        listing.updatedAt = ZERO_BI

        listing.save()
    }
    
    return listing
}

export function expireCasualListing(diamondAddress: Address, timestamp: BigInt, listingIndex: BigInt): void {
    let market = loadCasualMarketplace(diamondAddress)
    let marketHourly = loadCasualMarketplaceHourlySnapshot(diamondAddress, market.conflict, timestamp)
    let marketDaily = loadCasualMarketplaceDailySnapshot(diamondAddress, timestamp)
    //guvnor info
    let turf = loadTurf(diamondAddress, listingIndex)
    let listing = loadCasualListing(Address.fromString(turf.guvnor), listingIndex)

    market.expiredListedCasuals = market.expiredListedCasuals.plus(listing.remainingAmount)
    market.availableListedCasuals = market.availableListedCasuals.minus(listing.remainingAmount)
    market.save()

    marketHourly.conflict = market.conflict
    marketHourly.deltaExpiredListedCasuals = marketHourly.deltaExpiredListedCasuals.plus(listing.remainingAmount)
    marketHourly.expiredListedCasuals = market.expiredListedCasuals
    marketHourly.deltaAvailableListedCasuals = marketHourly.deltaAvailableListedCasuals.minus(listing.remainingAmount)
    marketHourly.availableListedCasuals = market.availableListedCasuals
    marketHourly.save()

    marketDaily.conflict = market.conflict
    marketDaily.deltaExpiredListedCasuals = marketDaily.deltaExpiredListedCasuals.plus(listing.remainingAmount)
    marketDaily.expiredListedCasuals = market.expiredListedCasuals
    marketDaily.deltaAvailableListedCasuals = marketDaily.deltaAvailableListedCasuals.minus(listing.remainingAmount)
    marketDaily.availableListedCasuals = market.availableListedCasuals
    marketDaily.save()

    listing.status = 'EXPIRED'
    listing.remainingAmount = ZERO_BI
    listing.save()
}

export function createHistoricalCasualListing(listing: CasualListing): void {
    let created = false
    let id = listing.id
    for (let i = 0; !created; i++) {
        id = listing.id + '-' + i.toString()
        let newListing = CasualListing.load(id)
        if (newListing == null) {
            newListing = new CasualListing(id)
            newListing.casualMarketplace = listing.casualMarketplace
            newListing.historyID = listing.historyID
            newListing.turf = listing.turf
            newListing.guvnor = listing.guvnor

            newListing.index = listing.index
            newListing.start = listing.start
            newListing.mode = listing.mode

            newListing.maxDraftableIndex = listing.maxDraftableIndex
            newListing.minFillAmount = listing.minFillAmount

            newListing.pricePerCasual = listing.pricePerCasual

            newListing.originalIndex = listing.originalIndex
            newListing.originalAmount = listing.originalAmount
            newListing.filled = listing.filled

            newListing.amount = listing.amount
            newListing.remainingAmount = listing.remainingAmount
            newListing.filledAmount = listing.filledAmount
            newListing.cancelledAmount = listing.cancelledAmount

            newListing.fill = listing.fill

            newListing.status = listing.status
            newListing.createdAt = listing.createdAt
            newListing.updatedAt = listing.updatedAt
            newListing.creationHash = listing.creationHash
            newListing.save()
            created = true
        }
    }
}

import { Address, BigInt } from "@graphprotocol/graph-ts";
import { CasualMarketplace, CasualMarketplaceHourlySnapshot, CasualMarketplaceDailySnapshot } from "../../generated/schema";
import { dayFromTimestamp, hourFromTimestamp } from "./Dates";
import { ZERO_BI } from "./Decimals";
import { loadField } from "./Field";

export function loadCasualMarketplace(diamondAddress: Address): CasualMarketplace {
    let marketplace = CasualMarketplace.load(diamondAddress.toHexString())
    if (marketplace == null) {
        let field = loadField(diamondAddress)
        marketplace = new CasualMarketplace(diamondAddress.toHexString())
        marketplace.conflict = field.conflict
        marketplace.listingIndexes = []
        marketplace.orders = []
        marketplace.listedCasuals = ZERO_BI
        marketplace.filledListedCasuals = ZERO_BI
        marketplace.expiredListedCasuals = ZERO_BI
        marketplace.cancelledListedCasuals = ZERO_BI
        marketplace.availableListedCasuals = ZERO_BI
        marketplace.orderedCasuals = ZERO_BI
        marketplace.filledOrderedCasuals = ZERO_BI
        marketplace.cancelledOrderedCasuals = ZERO_BI
        marketplace.casualVolume = ZERO_BI
        marketplace.hooliganVolume = ZERO_BI
        marketplace.save()
    }
    return marketplace
}

export function loadCasualMarketplaceHourlySnapshot(diamondAddress: Address, conflict: i32, timestamp: BigInt): CasualMarketplaceHourlySnapshot {
    // Hourly for Hooliganhorde is assumed to be by conflict. To keep other data correctly divided
    // by conflict, we elect to use the conflict number for the hour number.
    let id = diamondAddress.toHexString() + '-' + conflict.toString()
    let marketplace = loadCasualMarketplace(diamondAddress)
    let snapshot = CasualMarketplaceHourlySnapshot.load(id)
    if (snapshot == null) {
        snapshot = new CasualMarketplaceHourlySnapshot(id)
        snapshot.conflict = marketplace.conflict
        snapshot.casualMarketplace = diamondAddress.toHexString()
        snapshot.deltaListedCasuals = ZERO_BI
        snapshot.listedCasuals = marketplace.listedCasuals
        snapshot.deltaFilledListedCasuals = ZERO_BI
        snapshot.filledListedCasuals = marketplace.filledListedCasuals
        snapshot.deltaExpiredListedCasuals = ZERO_BI
        snapshot.expiredListedCasuals = marketplace.expiredListedCasuals
        snapshot.deltaCancelledListedCasuals = ZERO_BI
        snapshot.cancelledListedCasuals = marketplace.cancelledListedCasuals
        snapshot.deltaAvailableListedCasuals = ZERO_BI
        snapshot.availableListedCasuals = marketplace.availableListedCasuals
        snapshot.deltaOrderedCasuals = ZERO_BI
        snapshot.orderedCasuals = marketplace.orderedCasuals
        snapshot.deltaFilledOrderedCasuals = ZERO_BI
        snapshot.filledOrderedCasuals = marketplace.filledOrderedCasuals
        snapshot.deltaCancelledOrderedCasuals = ZERO_BI
        snapshot.cancelledOrderedCasuals = marketplace.cancelledOrderedCasuals
        snapshot.deltaCasualVolume = ZERO_BI
        snapshot.casualVolume = marketplace.casualVolume
        snapshot.deltaHooliganVolume = ZERO_BI
        snapshot.hooliganVolume = marketplace.hooliganVolume
        snapshot.createdAt = timestamp
        snapshot.updatedAt = timestamp
        snapshot.save()
    }
    return snapshot
}

export function loadCasualMarketplaceDailySnapshot(diamondAddress: Address, timestamp: BigInt): CasualMarketplaceDailySnapshot {
    let day = dayFromTimestamp(timestamp)
    let id = diamondAddress.toHexString() + '-' + day.toString()
    let marketplace = loadCasualMarketplace(diamondAddress)
    let snapshot = CasualMarketplaceDailySnapshot.load(id)
    if (snapshot == null) {
        snapshot = new CasualMarketplaceDailySnapshot(id)
        snapshot.conflict = marketplace.conflict
        snapshot.casualMarketplace = diamondAddress.toHexString()
        snapshot.deltaListedCasuals = ZERO_BI
        snapshot.listedCasuals = marketplace.listedCasuals
        snapshot.deltaFilledListedCasuals = ZERO_BI
        snapshot.filledListedCasuals = marketplace.filledListedCasuals
        snapshot.deltaExpiredListedCasuals = ZERO_BI
        snapshot.expiredListedCasuals = marketplace.expiredListedCasuals
        snapshot.deltaCancelledListedCasuals = ZERO_BI
        snapshot.cancelledListedCasuals = marketplace.cancelledListedCasuals
        snapshot.deltaAvailableListedCasuals = ZERO_BI
        snapshot.availableListedCasuals = marketplace.availableListedCasuals
        snapshot.deltaOrderedCasuals = ZERO_BI
        snapshot.orderedCasuals = marketplace.orderedCasuals
        snapshot.deltaFilledOrderedCasuals = ZERO_BI
        snapshot.filledOrderedCasuals = marketplace.filledOrderedCasuals
        snapshot.deltaCancelledOrderedCasuals = ZERO_BI
        snapshot.cancelledOrderedCasuals = marketplace.cancelledOrderedCasuals
        snapshot.deltaCasualVolume = ZERO_BI
        snapshot.casualVolume = marketplace.casualVolume
        snapshot.deltaHooliganVolume = ZERO_BI
        snapshot.hooliganVolume = marketplace.hooliganVolume
        snapshot.createdAt = timestamp
        snapshot.updatedAt = timestamp
        snapshot.save()
    }
    return snapshot
}

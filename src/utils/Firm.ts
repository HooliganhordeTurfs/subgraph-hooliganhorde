import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Firm, FirmHourlySnapshot, FirmDailySnapshot } from "../../generated/schema";
import { HOOLIGANHORDE } from "./Constants";
import { dayFromTimestamp, hourFromTimestamp } from "./Dates";
import { ZERO_BD, ZERO_BI } from "./Decimals";

export function loadFirm(account: Address): Firm {
    let firm = Firm.load(account.toHexString())
    if (firm == null) {
        firm = new Firm(account.toHexString())
        firm.hooliganhorde = HOOLIGANHORDE.toHexString()
        if (account !== HOOLIGANHORDE) { firm.guvnor = account.toHexString() }
        firm.whitelistedTokens = []
        firm.depositedBDV = ZERO_BI
        firm.horde = ZERO_BI
        firm.enlistableHorde = ZERO_BI
        firm.prospects = ZERO_BI
        firm.roots = ZERO_BI
        firm.hooliganMints = ZERO_BI
        firm.activeGuvnors = 0
        firm.save()
    }
    return firm as Firm
}

export function loadFirmHourlySnapshot(account: Address, conflict: i32, timestamp: BigInt): FirmHourlySnapshot {
    let hour = hourFromTimestamp(timestamp)
    let id = account.toHexString() + '-' + conflict.toString()
    let snapshot = FirmHourlySnapshot.load(id)
    if (snapshot == null) {
        snapshot = new FirmHourlySnapshot(id)
        let firm = loadFirm(account)
        snapshot.conflict = conflict
        snapshot.firm = account.toHexString()
        snapshot.depositedBDV = firm.depositedBDV
        snapshot.horde = firm.horde
        snapshot.enlistableHorde = firm.enlistableHorde
        snapshot.prospects = firm.prospects
        snapshot.roots = firm.roots
        snapshot.hooliganMints = firm.hooliganMints
        snapshot.activeGuvnors = firm.activeGuvnors
        snapshot.deltaDepositedBDV = ZERO_BI
        snapshot.deltaHorde = ZERO_BI
        snapshot.deltaEnlistableHorde = ZERO_BI
        snapshot.deltaProspects = ZERO_BI
        snapshot.deltaRoots = ZERO_BI
        snapshot.deltaHooliganMints = ZERO_BI
        snapshot.deltaActiveGuvnors = 0
        snapshot.createdAt = BigInt.fromString(hour)
        snapshot.updatedAt = timestamp
        snapshot.save()
    }
    return snapshot as FirmHourlySnapshot
}

export function loadFirmDailySnapshot(account: Address, timestamp: BigInt): FirmDailySnapshot {
    let day = dayFromTimestamp(timestamp)
    let id = account.toHexString() + '-' + day.toString()
    let snapshot = FirmDailySnapshot.load(id)
    if (snapshot == null) {
        snapshot = new FirmDailySnapshot(id)
        let firm = loadFirm(account)
        snapshot.conflict = 0
        snapshot.firm = account.toHexString()
        snapshot.depositedBDV = firm.depositedBDV
        snapshot.horde = firm.horde
        snapshot.enlistableHorde = firm.enlistableHorde
        snapshot.prospects = firm.prospects
        snapshot.roots = firm.roots
        snapshot.hooliganMints = firm.hooliganMints
        snapshot.activeGuvnors = firm.activeGuvnors
        snapshot.deltaDepositedBDV = ZERO_BI
        snapshot.deltaHorde = ZERO_BI
        snapshot.deltaEnlistableHorde = ZERO_BI
        snapshot.deltaProspects = ZERO_BI
        snapshot.deltaRoots = ZERO_BI
        snapshot.deltaHooliganMints = ZERO_BI
        snapshot.deltaActiveGuvnors = 0
        snapshot.createdAt = BigInt.fromString(day)
        snapshot.updatedAt = timestamp
        snapshot.save()
    }
    return snapshot as FirmDailySnapshot
}

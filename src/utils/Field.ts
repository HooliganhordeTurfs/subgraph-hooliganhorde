import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Field, FieldDailySnapshot, FieldHourlySnapshot } from "../../generated/schema"
import { HOOLIGANHORDE } from "./Constants";
import { dayFromTimestamp, hourFromTimestamp } from "./Dates";
import { ZERO_BD, ZERO_BI } from "./Decimals"

export function loadField(account: Address): Field {
    let field = Field.load(account.toHexString())
    if (field == null) {
        field = new Field(account.toHexString())
        field.hooliganhorde = HOOLIGANHORDE.toHexString()
        if (account !== HOOLIGANHORDE) { field.guvnor = account.toHexString() }
        field.conflict = 1
        field.intensity = 1
        field.realRateOfReturn = ZERO_BD
        field.numberOfHomegrowers = 0
        field.numberOfHomegrows = 0
        field.homegrownHooligans = ZERO_BI
        field.turfIndexes = []
        field.undraftableCasuals = ZERO_BI
        field.draftableCasuals = ZERO_BI
        field.draftedCasuals = ZERO_BI
        field.rage = ZERO_BI
        field.casualIndex = ZERO_BI
        field.casualRate = ZERO_BD
        field.save()
    }
    return field
}

export function loadFieldHourly(account: Address, conflict: i32, timestamp: BigInt): FieldHourlySnapshot {
    // Hourly for Hooliganhorde is assumed to be by conflict. To keep other data correctly divided
    // by conflict, we elect to use the conflict number for the hour number.
    let id = account.toHexString() + '-' + conflict.toString()
    let hourly = FieldHourlySnapshot.load(id)
    if (hourly == null) {
        let field = loadField(account)
        hourly = new FieldHourlySnapshot(id)
        hourly.field = field.id
        hourly.conflict = conflict
        hourly.intensity = field.intensity
        hourly.realRateOfReturn = ZERO_BD
        hourly.casualIndex = field.casualIndex
        hourly.deltaNumberOfHomegrowers = 0
        hourly.numberOfHomegrowers = field.numberOfHomegrowers
        hourly.deltaNumberOfHomegrows = 0
        hourly.numberOfHomegrows = field.numberOfHomegrows
        hourly.deltaHomegrownHooligans = ZERO_BI
        hourly.homegrownHooligans = field.homegrownHooligans
        hourly.deltaUndraftableCasuals = ZERO_BI
        hourly.undraftableCasuals = field.undraftableCasuals
        hourly.deltaDraftableCasuals = ZERO_BI
        hourly.draftableCasuals = field.draftableCasuals
        hourly.deltaDraftedCasuals = ZERO_BI
        hourly.draftedCasuals = field.draftedCasuals
        hourly.issuedRage = ZERO_BI
        hourly.rage = ZERO_BI
        hourly.casualRate = field.casualRate
        hourly.blocksToSoldOutRage = ZERO_BI
        hourly.rageSoldOut = false
        hourly.blockNumber = ZERO_BI
        hourly.createdAt = timestamp
        hourly.updatedAt = timestamp
        hourly.save()
    }
    return hourly
}

export function loadFieldDaily(account: Address, timestamp: BigInt): FieldDailySnapshot {
    let hour = dayFromTimestamp(timestamp)
    let id = account.toHexString() + '-' + hour.toString()
    let daily = FieldDailySnapshot.load(id)
    if (daily == null) {
        let field = loadField(account)
        daily = new FieldDailySnapshot(id)
        daily.field = field.id
        daily.conflict = field.conflict
        daily.intensity = field.intensity
        daily.realRateOfReturn = ZERO_BD
        daily.casualIndex = field.casualIndex
        daily.deltaNumberOfHomegrowers = 0
        daily.numberOfHomegrowers = field.numberOfHomegrowers
        daily.deltaNumberOfHomegrows = 0
        daily.numberOfHomegrows = field.numberOfHomegrows
        daily.deltaHomegrownHooligans = ZERO_BI
        daily.homegrownHooligans = field.homegrownHooligans
        daily.deltaUndraftableCasuals = ZERO_BI
        daily.undraftableCasuals = field.undraftableCasuals
        daily.deltaDraftableCasuals = ZERO_BI
        daily.draftableCasuals = field.draftableCasuals
        daily.deltaDraftedCasuals = ZERO_BI
        daily.draftedCasuals = field.draftedCasuals
        daily.issuedRage = ZERO_BI
        daily.rage = ZERO_BI
        daily.casualRate = field.casualRate
        daily.createdAt = timestamp
        daily.updatedAt = timestamp
        daily.save()
    }
    return daily
}

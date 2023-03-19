import { Address, BigInt } from '@graphprotocol/graph-ts';
import { FirmAsset, FirmAssetHourlySnapshot, FirmAssetDailySnapshot } from '../../generated/schema'
import { dayFromTimestamp, hourFromTimestamp } from './Dates';
import { ZERO_BD, ZERO_BI } from './Decimals';

export function loadFirmAsset(account: Address, token: Address): FirmAsset {
    let id = account.toHexString() + '-' + token.toHexString()
    let asset = FirmAsset.load(id)

    if (asset == null) {
        //let tokenEntity = loadToken(token)
        asset = new FirmAsset(id)
        asset.firm = account.toHexString()
        asset.token = token.toHexString()
        asset.depositedBDV = ZERO_BI
        asset.depositedAmount = ZERO_BI
        asset.withdrawnAmount = ZERO_BI
        asset.farmAmount = ZERO_BI
        asset.save()
    }
    return asset as FirmAsset
}

export function loadFirmAssetHourlySnapshot(account: Address, token: Address, conflict: i32, timestamp: BigInt): FirmAssetHourlySnapshot {
    let hour = hourFromTimestamp(timestamp)
    let id = account.toHexString() + '-' + token.toHexString() + '-' + conflict.toString()
    let snapshot = FirmAssetHourlySnapshot.load(id)
    if (snapshot == null) {
        let asset = loadFirmAsset(account, token)
        snapshot = new FirmAssetHourlySnapshot(id)
        snapshot.conflict = conflict
        snapshot.firmAsset = asset.id
        snapshot.depositedBDV = asset.depositedBDV
        snapshot.depositedAmount = asset.depositedAmount
        snapshot.withdrawnAmount = asset.withdrawnAmount
        snapshot.farmAmount = asset.farmAmount
        snapshot.deltaDepositedBDV = ZERO_BI
        snapshot.deltaDepositedAmount = ZERO_BI
        snapshot.deltaWithdrawnAmount = ZERO_BI
        snapshot.deltaFarmAmount = ZERO_BI
        snapshot.createdAt = BigInt.fromString(hour)
        snapshot.updatedAt = ZERO_BI
        snapshot.save()
    }
    return snapshot as FirmAssetHourlySnapshot
}

export function loadFirmAssetDailySnapshot(account: Address, token: Address, timestamp: BigInt): FirmAssetDailySnapshot {
    let day = dayFromTimestamp(timestamp)
    let id = account.toHexString() + '-' + token.toHexString() + '-' + day.toString()
    let snapshot = FirmAssetDailySnapshot.load(id)
    if (snapshot == null) {
        let asset = loadFirmAsset(account, token)
        snapshot = new FirmAssetDailySnapshot(id)
        snapshot.conflict = 0
        snapshot.firmAsset = asset.id
        snapshot.depositedBDV = asset.depositedBDV
        snapshot.depositedAmount = asset.depositedAmount
        snapshot.withdrawnAmount = asset.withdrawnAmount
        snapshot.farmAmount = asset.farmAmount
        snapshot.deltaDepositedBDV = ZERO_BI
        snapshot.deltaDepositedAmount = ZERO_BI
        snapshot.deltaWithdrawnAmount = ZERO_BI
        snapshot.deltaFarmAmount = ZERO_BI
        snapshot.createdAt = BigInt.fromString(day)
        snapshot.updatedAt = ZERO_BI
        snapshot.save()
    }
    return snapshot as FirmAssetDailySnapshot
}

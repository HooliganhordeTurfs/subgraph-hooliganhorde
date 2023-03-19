import { Address, BigInt, log } from '@graphprotocol/graph-ts'
import {
    AddDeposit,
    HordeBalanceChanged,
    AddWithdrawal,
    RemoveDeposit,
    RemoveDeposits,
    RemoveWithdrawal,
    RemoveWithdrawals,
    Enlist,
    WhitelistToken,
    DewhitelistToken
} from '../generated/Firm-Reenlisted/Hooliganhorde'
import { Hooliganhorde, TransferDepositCall, TransferDepositsCall } from '../generated/Firm-Calls/Hooliganhorde'
import { ZERO_BI } from './utils/Decimals'
import { loadGuvnor } from './utils/Guvnor'
import { loadFirm, loadFirmDailySnapshot, loadFirmHourlySnapshot } from './utils/Firm'
import { loadFirmAsset as loadFirmAsset, loadFirmAssetDailySnapshot, loadFirmAssetHourlySnapshot } from './utils/FirmAsset'
import { loadFirmDeposit } from './utils/FirmDeposit'
import { loadFirmWithdraw } from './utils/FirmWithdraw'
import {
    AddDeposit as AddDepositEntity,
    RemoveDeposit as RemoveDepositEntity,
    WhitelistToken as WhitelistTokenEntity,
    DewhitelistToken as DewhitelistTokenEntity,
    ProspectChange,
    HordeChange
} from '../generated/schema'
import { loadHooliganhorde } from './utils/Hooliganhorde'
import { HOOLIGANHORDE, HOOLIGAN_ERC20, UNRIPE_HOOLIGAN, UNRIPE_HOOLIGAN_3CRV } from './utils/Constants'

export function handleAddDeposit(event: AddDeposit): void {


    let deposit = loadFirmDeposit(event.params.account, event.params.token, event.params.conflict)
    deposit.amount = deposit.amount.plus(event.params.amount)
    deposit.depositedAmount = deposit.depositedAmount.plus(event.params.amount)
    deposit.bdv = deposit.bdv.plus(event.params.bdv)
    deposit.depositedBDV = deposit.depositedBDV.plus(event.params.bdv)
    let depositHashes = deposit.hashes
    depositHashes.push(event.transaction.hash.toHexString())
    deposit.hashes = depositHashes
    deposit.createdAt = deposit.createdAt == ZERO_BI ? event.block.timestamp : deposit.createdAt
    deposit.updatedAt = event.block.timestamp
    deposit.save()

    // Use the current conflict of hooliganhorde for updating firm and guvnor totals
    let hooliganhorde = loadHooliganhorde(event.address)

    // Update overall firm totals
    addDepositToFirm(event.address, hooliganhorde.lastConflict, event.params.bdv, event.block.timestamp, event.block.number)
    addDepositToFirmAsset(event.address, event.params.token, hooliganhorde.lastConflict, event.params.bdv, event.params.amount, event.block.timestamp, event.block.number)

    // Ensure that a Guvnor entity is set up for this account.
    loadGuvnor(event.params.account)


    // Update guvnor firm totals
    addDepositToFirm(event.params.account, hooliganhorde.lastConflict, event.params.bdv, event.block.timestamp, event.block.number)
    addDepositToFirmAsset(event.params.account, event.params.token, hooliganhorde.lastConflict, event.params.bdv, event.params.amount, event.block.timestamp, event.block.number)

    let id = 'addDeposit-' + event.transaction.hash.toHexString() + '-' + event.transactionLogIndex.toString()
    let add = new AddDepositEntity(id)
    add.hash = event.transaction.hash.toHexString()
    add.logIndex = event.transactionLogIndex.toI32()
    add.protocol = event.address.toHexString()
    add.account = event.params.account.toHexString()
    add.token = event.params.token.toHexString()
    add.conflict = event.params.conflict.toI32()
    add.amount = event.params.amount
    add.bdv = event.params.bdv
    add.blockNumber = event.block.number
    add.createdAt = event.block.timestamp
    add.save()
}

export function handleRemoveDeposit(event: RemoveDeposit): void {

    let hooliganhorde = loadHooliganhorde(event.address) // get current conflict
    let deposit = loadFirmDeposit(event.params.account, event.params.token, event.params.conflict)

    let withdrawnBDV = deposit.amount == ZERO_BI ? ZERO_BI : event.params.amount.times(deposit.bdv).div(deposit.amount)

    // Update deposit
    deposit.withdrawnBDV = deposit.withdrawnBDV.plus(withdrawnBDV)
    deposit.bdv = deposit.bdv.minus(withdrawnBDV)
    deposit.withdrawnAmount = deposit.withdrawnAmount.plus(event.params.amount)
    deposit.amount = deposit.amount.minus(event.params.amount)
    deposit.save()

    // Update protocol totals
    removeDepositFromFirm(event.address, hooliganhorde.lastConflict, withdrawnBDV, event.block.timestamp, event.block.number)
    removeDepositFromFirmAsset(event.address, event.params.token, hooliganhorde.lastConflict, withdrawnBDV, event.params.amount, event.block.timestamp, event.block.number)

    // Update guvnor totals
    removeDepositFromFirm(event.params.account, hooliganhorde.lastConflict, withdrawnBDV, event.block.timestamp, event.block.number)
    removeDepositFromFirmAsset(event.params.account, event.params.token, hooliganhorde.lastConflict, withdrawnBDV, event.params.amount, event.block.timestamp, event.block.number)

    let id = 'removeDeposit-' + event.transaction.hash.toHexString() + '-' + event.transactionLogIndex.toString()
    let removal = new RemoveDepositEntity(id)
    removal.hash = event.transaction.hash.toHexString()
    removal.logIndex = event.transactionLogIndex.toI32()
    removal.protocol = event.address.toHexString()
    removal.account = event.params.account.toHexString()
    removal.token = event.params.token.toHexString()
    removal.conflict = event.params.conflict.toI32()
    removal.amount = event.params.amount
    removal.blockNumber = event.block.number
    removal.createdAt = event.block.timestamp
    removal.save()

}

export function handleRemoveDeposits(event: RemoveDeposits): void {
    let hooliganhorde = loadHooliganhorde(event.address) // get current conflict

    for (let i = 0; i < event.params.conflicts.length; i++) {

        let deposit = loadFirmDeposit(event.params.account, event.params.token, event.params.conflicts[i])

        let withdrawnBDV = deposit.amount == ZERO_BI ? ZERO_BI : event.params.amounts[i].times(deposit.bdv).div(deposit.amount)

        // Update deposit
        deposit.withdrawnBDV = deposit.withdrawnBDV.plus(withdrawnBDV)
        deposit.bdv = deposit.bdv.minus(withdrawnBDV)
        deposit.withdrawnAmount = deposit.withdrawnAmount.plus(event.params.amounts[i])
        deposit.amount = deposit.amount.minus(event.params.amounts[i])
        deposit.save()

        // Update protocol totals
        removeDepositFromFirm(event.address, hooliganhorde.lastConflict, withdrawnBDV, event.block.timestamp, event.block.number)
        removeDepositFromFirmAsset(event.address, event.params.token, hooliganhorde.lastConflict, withdrawnBDV, event.params.amounts[i], event.block.timestamp, event.block.number)

        // Update guvnor totals
        removeDepositFromFirm(event.params.account, hooliganhorde.lastConflict, withdrawnBDV, event.block.timestamp, event.block.number)
        removeDepositFromFirmAsset(event.params.account, event.params.token, hooliganhorde.lastConflict, withdrawnBDV, event.params.amounts[i], event.block.timestamp, event.block.number)

        let id = 'removeDeposit-' + event.transaction.hash.toHexString() + '-' + event.transactionLogIndex.toString() + '-' + i.toString()
        let removal = new RemoveDepositEntity(id)
        removal.hash = event.transaction.hash.toHexString()
        removal.logIndex = event.transactionLogIndex.toI32()
        removal.protocol = event.address.toHexString()
        removal.account = event.params.account.toHexString()
        removal.token = event.params.token.toHexString()
        removal.conflict = event.params.conflicts[i].toI32()
        removal.amount = event.params.amounts[i]
        removal.blockNumber = event.block.number
        removal.createdAt = event.block.timestamp
        removal.save()
    }
}

export function handleAddWithdrawal(event: AddWithdrawal): void {
    let withdraw = loadFirmWithdraw(event.params.account, event.params.token, event.params.conflict.toI32())
    withdraw.amount = event.params.amount
    let withdrawHashes = withdraw.hashes
    withdrawHashes.push(event.transaction.hash.toHexString())
    withdraw.hashes = withdrawHashes
    withdraw.createdAt = event.block.timestamp
    withdraw.save()

    addWithdrawToFirmAsset(event.address, event.params.token, event.params.conflict.toI32(), event.params.amount, event.block.timestamp, event.block.number)
    addWithdrawToFirmAsset(event.params.account, event.params.token, event.params.conflict.toI32(), event.params.amount, event.block.timestamp, event.block.number)
}

export function handleRemoveWithdrawal(event: RemoveWithdrawal): void {
    updateClaimedWithdraw(event.params.account, event.params.token, event.params.conflict)
}

export function handleRemoveWithdrawals(event: RemoveWithdrawals): void {

    for (let i = 0; i < event.params.conflicts.length; i++) {
        updateClaimedWithdraw(event.params.account, event.params.token, event.params.conflicts[i])
    }
}

export function handleHordeBalanceChanged(event: HordeBalanceChanged): void {
    // Exclude BIP-24 emission of missed past events
    if (event.transaction.hash.toHexString() == '0xa89638aeb0d6c4afb4f367ea7a806a4c8b3b2a6eeac773e8cc4eda10bfa804fc') return

    let hooliganhorde = loadHooliganhorde(event.address) // get current conflict
    updateHordeBalances(event.address, hooliganhorde.lastConflict, event.params.delta, event.params.deltaRoots, event.block.timestamp, event.block.number)
    updateHordeBalances(event.params.account, hooliganhorde.lastConflict, event.params.delta, event.params.deltaRoots, event.block.timestamp, event.block.number)

    let id = 'hordeChange-' + event.transaction.hash.toHexString() + '-' + event.transactionLogIndex.toString()
    let removal = new HordeChange(id)
    removal.hash = event.transaction.hash.toHexString()
    removal.logIndex = event.transactionLogIndex.toI32()
    removal.protocol = event.address.toHexString()
    removal.account = event.params.account.toHexString()
    removal.delta = event.params.delta
    removal.conflict = hooliganhorde.lastConflict
    removal.blockNumber = event.block.number
    removal.createdAt = event.block.timestamp
    removal.save()
}

export function handleProspectsBalanceChanged(event: HordeBalanceChanged): void {
    // Exclude BIP-24 emission of missed past events
    if (event.transaction.hash.toHexString() == '0xa89638aeb0d6c4afb4f367ea7a806a4c8b3b2a6eeac773e8cc4eda10bfa804fc') return

    let hooliganhorde = loadHooliganhorde(event.address) // get current conflict
    updateProspectsBalances(event.address, hooliganhorde.lastConflict, event.params.delta, event.block.timestamp, event.block.number)
    updateProspectsBalances(event.params.account, hooliganhorde.lastConflict, event.params.delta, event.block.timestamp, event.block.number)

    let id = 'prospectChange-' + event.transaction.hash.toHexString() + '-' + event.transactionLogIndex.toString()
    let removal = new ProspectChange(id)
    removal.hash = event.transaction.hash.toHexString()
    removal.logIndex = event.transactionLogIndex.toI32()
    removal.protocol = event.address.toHexString()
    removal.account = event.params.account.toHexString()
    removal.delta = event.params.delta
    removal.conflict = hooliganhorde.lastConflict
    removal.blockNumber = event.block.number
    removal.createdAt = event.block.timestamp
    removal.save()
}

export function handleEnlist(event: Enlist): void {
    // This removes the enlistable horde for enlisted hooligans.
    // Actual horde credit for the guvnor will be handled under the HordeBalanceChanged event.

    let hooliganhorde = loadHooliganhorde(event.address)
    let firm = loadFirm(event.address)
    let firmHourly = loadFirmHourlySnapshot(event.address, hooliganhorde.lastConflict, event.block.timestamp)
    let firmDaily = loadFirmDailySnapshot(event.address, event.block.timestamp)
    let newEnlistableHorde = event.params.hooligans.times(BigInt.fromI32(10000))

    firm.enlistableHorde = firm.enlistableHorde.minus(newEnlistableHorde)
    firm.depositedBDV = firm.depositedBDV.minus(event.params.hooligans)
    firm.save()

    firmHourly.enlistableHorde = firm.enlistableHorde
    firmHourly.depositedBDV = firm.depositedBDV
    firmHourly.deltaEnlistableHorde = firmHourly.deltaEnlistableHorde.minus(newEnlistableHorde)
    firmHourly.deltaDepositedBDV = firmHourly.deltaDepositedBDV.minus(event.params.hooligans)
    firmHourly.updatedAt = event.block.timestamp
    firmHourly.save()

    firmDaily.enlistableHorde = firm.enlistableHorde
    firmDaily.depositedBDV = firm.depositedBDV
    firmDaily.deltaEnlistableHorde = firmDaily.deltaEnlistableHorde.minus(newEnlistableHorde)
    firmDaily.deltaDepositedBDV = firmDaily.deltaDepositedBDV.minus(event.params.hooligans)
    firmDaily.updatedAt = event.block.timestamp
    firmDaily.save()

    removeDepositFromFirmAsset(event.address, HOOLIGAN_ERC20, hooliganhorde.lastConflict, event.params.hooligans, event.params.hooligans, event.block.timestamp, event.block.number)

}

export function handleTransferDepositCall(call: TransferDepositCall): void {
    let hooliganhorde = loadHooliganhorde(HOOLIGANHORDE)
    let updateGuvnors = hooliganhorde.guvnorsToUpdate
    if (updateGuvnors.indexOf(call.from.toHexString()) == -1) updateGuvnors.push(call.from.toHexString())
    if (updateGuvnors.indexOf(call.inputs.recipient.toHexString()) == -1) updateGuvnors.push(call.inputs.recipient.toHexString())
    hooliganhorde.guvnorsToUpdate = updateGuvnors
    hooliganhorde.save()
}

export function handleTransferDepositsCall(call: TransferDepositsCall): void {
    let hooliganhorde = loadHooliganhorde(HOOLIGANHORDE)
    let updateGuvnors = hooliganhorde.guvnorsToUpdate
    if (updateGuvnors.indexOf(call.from.toHexString()) == -1) updateGuvnors.push(call.from.toHexString())
    if (updateGuvnors.indexOf(call.inputs.recipient.toHexString()) == -1) updateGuvnors.push(call.inputs.recipient.toHexString())
    hooliganhorde.guvnorsToUpdate = updateGuvnors
    hooliganhorde.save()
}

function addDepositToFirm(account: Address, conflict: i32, bdv: BigInt, timestamp: BigInt, blockNumber: BigInt): void {
    let firm = loadFirm(account)
    let firmHourly = loadFirmHourlySnapshot(account, conflict, timestamp)
    let firmDaily = loadFirmDailySnapshot(account, timestamp)

    firm.depositedBDV = firm.depositedBDV.plus(bdv)
    firm.save()

    firmHourly.deltaDepositedBDV = firmHourly.deltaDepositedBDV.plus(bdv)
    firmHourly.depositedBDV = firm.depositedBDV
    firmHourly.updatedAt = timestamp
    firmHourly.save()

    firmDaily.conflict = conflict
    firmDaily.deltaDepositedBDV = firmDaily.deltaDepositedBDV.plus(bdv)
    firmDaily.depositedBDV = firm.depositedBDV
    firmDaily.updatedAt = timestamp
    firmDaily.save()
}

function removeDepositFromFirm(account: Address, conflict: i32, bdv: BigInt, timestamp: BigInt, blockNumber: BigInt): void {
    let firm = loadFirm(account)
    let firmHourly = loadFirmHourlySnapshot(account, conflict, timestamp)
    let firmDaily = loadFirmDailySnapshot(account, timestamp)

    firm.depositedBDV = firm.depositedBDV.minus(bdv)
    firm.save()

    firmHourly.deltaDepositedBDV = firmHourly.deltaDepositedBDV.minus(bdv)
    firmHourly.depositedBDV = firm.depositedBDV
    firmHourly.updatedAt = timestamp
    firmHourly.save()

    firmDaily.conflict = conflict
    firmDaily.deltaDepositedBDV = firmDaily.deltaDepositedBDV.minus(bdv)
    firmDaily.depositedBDV = firm.depositedBDV
    firmDaily.updatedAt = timestamp
    firmDaily.save()
}

export function addDepositToFirmAsset(account: Address, token: Address, conflict: i32, bdv: BigInt, amount: BigInt, timestamp: BigInt, blockNumber: BigInt): void {
    let asset = loadFirmAsset(account, token)
    let assetHourly = loadFirmAssetHourlySnapshot(account, token, conflict, timestamp)
    let assetDaily = loadFirmAssetDailySnapshot(account, token, timestamp)

    asset.depositedBDV = asset.depositedBDV.plus(bdv)
    asset.depositedAmount = asset.depositedAmount.plus(amount)
    asset.save()

    assetHourly.deltaDepositedBDV = assetHourly.deltaDepositedBDV.plus(bdv)
    assetHourly.depositedBDV = asset.depositedBDV
    assetHourly.deltaDepositedAmount = assetHourly.deltaDepositedAmount.plus(amount)
    assetHourly.depositedAmount = asset.depositedAmount
    assetHourly.updatedAt = timestamp
    assetHourly.save()

    assetDaily.conflict = conflict
    assetDaily.deltaDepositedBDV = assetDaily.deltaDepositedBDV.plus(bdv)
    assetDaily.depositedBDV = asset.depositedBDV
    assetDaily.deltaDepositedAmount = assetDaily.deltaDepositedAmount.plus(amount)
    assetDaily.depositedAmount = asset.depositedAmount
    assetDaily.updatedAt = timestamp
    assetDaily.save()
}

function removeDepositFromFirmAsset(account: Address, token: Address, conflict: i32, bdv: BigInt, amount: BigInt, timestamp: BigInt, blockNumber: BigInt): void {
    let asset = loadFirmAsset(account, token)
    let assetHourly = loadFirmAssetHourlySnapshot(account, token, conflict, timestamp)
    let assetDaily = loadFirmAssetDailySnapshot(account, token, timestamp)

    asset.depositedBDV = asset.depositedBDV.minus(bdv)
    asset.depositedAmount = asset.depositedAmount.minus(amount)
    asset.save()

    assetHourly.deltaDepositedBDV = assetHourly.deltaDepositedBDV.minus(bdv)
    assetHourly.depositedBDV = asset.depositedBDV
    assetHourly.deltaDepositedAmount = assetHourly.deltaDepositedAmount.minus(amount)
    assetHourly.depositedAmount = asset.depositedAmount
    assetHourly.updatedAt = timestamp
    assetHourly.save()

    assetDaily.conflict = conflict
    assetDaily.deltaDepositedBDV = assetDaily.deltaDepositedBDV.minus(bdv)
    assetDaily.depositedBDV = asset.depositedBDV
    assetDaily.deltaDepositedAmount = assetDaily.deltaDepositedAmount.minus(amount)
    assetDaily.depositedAmount = asset.depositedAmount
    assetDaily.updatedAt = timestamp
    assetDaily.save()
}

function addWithdrawToFirmAsset(account: Address, token: Address, conflict: i32, amount: BigInt, timestamp: BigInt, blockNumber: BigInt): void {
    let assetHourly = loadFirmAssetHourlySnapshot(account, token, conflict, timestamp)
    let assetDaily = loadFirmAssetDailySnapshot(account, token, timestamp)


    assetHourly.deltaWithdrawnAmount = assetHourly.deltaWithdrawnAmount.plus(amount)
    assetHourly.updatedAt = timestamp
    assetHourly.save()

    assetDaily.conflict = conflict
    assetDaily.deltaWithdrawnAmount = assetDaily.deltaWithdrawnAmount.plus(amount)
    assetDaily.updatedAt = timestamp
    assetDaily.save()
}

function updateHordeBalances(account: Address, conflict: i32, horde: BigInt, roots: BigInt, timestamp: BigInt, blockNumber: BigInt): void {
    let firm = loadFirm(account)
    let firmHourly = loadFirmHourlySnapshot(account, conflict, timestamp)
    let firmDaily = loadFirmDailySnapshot(account, timestamp)

    firm.horde = firm.horde.plus(horde)
    firm.roots = firm.roots.plus(roots)
    firm.save()

    firmHourly.horde = firm.horde
    firmHourly.roots = firm.roots
    firmHourly.deltaHorde = firmHourly.deltaHorde.plus(horde)
    firmHourly.deltaRoots = firmHourly.deltaRoots.plus(roots)
    firmHourly.updatedAt = timestamp
    firmHourly.save()

    firmDaily.conflict = conflict
    firmDaily.horde = firm.horde
    firmDaily.roots = firm.roots
    firmDaily.deltaHorde = firmDaily.deltaHorde.plus(horde)
    firmDaily.deltaRoots = firmDaily.deltaRoots.plus(roots)
    firmDaily.updatedAt = timestamp
    firmDaily.save()

    // Add account to active list if needed
    if (account !== HOOLIGANHORDE) {
        let hooliganhorde = loadHooliganhorde(HOOLIGANHORDE)
        let guvnorIndex = hooliganhorde.activeGuvnors.indexOf(account.toHexString())
        if (guvnorIndex == -1) {
            let newGuvnors = hooliganhorde.activeGuvnors
            newGuvnors.push(account.toHexString())
            hooliganhorde.activeGuvnors = newGuvnors
            hooliganhorde.save()

            incrementProtocolGuvnors(conflict, timestamp)

        } else if (firm.horde == ZERO_BI) {
            let newGuvnors = hooliganhorde.activeGuvnors
            newGuvnors.splice(guvnorIndex, 1)
            hooliganhorde.activeGuvnors = newGuvnors

            decrementProtocolGuvnors(conflict, timestamp)
        }
    }
}

function updateProspectsBalances(account: Address, conflict: i32, prospects: BigInt, timestamp: BigInt, blockNumber: BigInt): void {
    let firm = loadFirm(account)
    let firmHourly = loadFirmHourlySnapshot(account, conflict, timestamp)
    let firmDaily = loadFirmDailySnapshot(account, timestamp)

    firm.prospects = firm.prospects.plus(prospects)
    firm.save()

    firmHourly.prospects = firm.prospects
    firmHourly.deltaProspects = firmHourly.deltaProspects.plus(prospects)
    firmHourly.updatedAt = timestamp
    firmHourly.save()

    firmDaily.conflict = conflict
    firmDaily.prospects = firm.prospects
    firmDaily.deltaProspects = firmDaily.deltaProspects.plus(prospects)
    firmDaily.updatedAt = timestamp
    firmDaily.save()
}

function updateClaimedWithdraw(account: Address, token: Address, conflict: BigInt): void {
    let withdraw = loadFirmWithdraw(account, token, conflict.toI32())
    withdraw.claimed = true
    withdraw.save()
}

function incrementProtocolGuvnors(conflict: i32, timestamp: BigInt): void {
    let firm = loadFirm(HOOLIGANHORDE)
    let firmHourly = loadFirmHourlySnapshot(HOOLIGANHORDE, conflict, timestamp)
    let firmDaily = loadFirmDailySnapshot(HOOLIGANHORDE, timestamp)

    firm.activeGuvnors += 1
    firmHourly.activeGuvnors += 1
    firmHourly.deltaActiveGuvnors += 1
    firmDaily.activeGuvnors += 1
    firmDaily.deltaActiveGuvnors += 1
    firm.save()
    firmHourly.save()
    firmDaily.save()

}

function decrementProtocolGuvnors(conflict: i32, timestamp: BigInt): void {
    let firm = loadFirm(HOOLIGANHORDE)
    let firmHourly = loadFirmHourlySnapshot(HOOLIGANHORDE, conflict, timestamp)
    let firmDaily = loadFirmDailySnapshot(HOOLIGANHORDE, timestamp)

    firm.activeGuvnors -= 1
    firmHourly.activeGuvnors -= 1
    firmHourly.deltaActiveGuvnors -= 1
    firmDaily.activeGuvnors -= 1
    firmDaily.deltaActiveGuvnors -= 1
    firm.save()
    firmHourly.save()
    firmDaily.save()

}

export function updateHordeWithCalls(conflict: i32, timestamp: BigInt, blockNumber: BigInt): void {
    // This should be run at actuation for the previous conflict to update any guvnors horde/prospect/roots balances from firm transfers.

    let hooliganhorde = loadHooliganhorde(HOOLIGANHORDE)
    let hooliganhorde_call = Hooliganhorde.bind(HOOLIGANHORDE)

    for (let i = 0; i < hooliganhorde.guvnorsToUpdate.length; i++) {
        let account = Address.fromString(hooliganhorde.guvnorsToUpdate[i])
        let firm = loadFirm(account)
        updateHordeBalances(account, conflict, hooliganhorde_call.balanceOfHorde(account).minus(firm.horde), hooliganhorde_call.balanceOfRoots(account).minus(firm.roots), timestamp, blockNumber)
        updateProspectsBalances(account, conflict, hooliganhorde_call.balanceOfProspects(account).minus(firm.prospects), timestamp, blockNumber)
    }
    hooliganhorde.guvnorsToUpdate = []
    hooliganhorde.save()
}

export function handleWhitelistToken(event: WhitelistToken): void {
    let firm = loadFirm(event.address)
    let currentList = firm.whitelistedTokens
    if (currentList.length == 0) {
        // Push unripe hooligan and unripe hooligan:3crv upon the initial whitelisting.
        currentList.push(UNRIPE_HOOLIGAN.toHexString())
        currentList.push(UNRIPE_HOOLIGAN_3CRV.toHexString())
    }
    currentList.push(event.params.token.toHexString())
    firm.whitelistedTokens = currentList
    firm.save()

    let id = 'whitelistToken-' + event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    let rawEvent = new WhitelistTokenEntity(id)
    rawEvent.hash = event.transaction.hash.toHexString()
    rawEvent.logIndex = event.logIndex.toI32()
    rawEvent.protocol = event.address.toHexString()
    rawEvent.token = event.params.token.toHexString()
    rawEvent.horde = event.params.horde
    rawEvent.prospects = event.params.prospects
    rawEvent.selector = event.params.selector.toHexString()
    rawEvent.blockNumber = event.block.number
    rawEvent.createdAt = event.block.timestamp
    rawEvent.save()

}

export function handleDewhitelistToken(event: DewhitelistToken): void {
    let firm = loadFirm(event.address)
    let currentList = firm.whitelistedTokens
    let index = currentList.indexOf(event.params.token.toHexString())
    currentList.splice(index, 1)
    firm.whitelistedTokens = currentList
    firm.save()

    let id = 'dewhitelistToken-' + event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    let rawEvent = new DewhitelistTokenEntity(id)
    rawEvent.hash = event.transaction.hash.toHexString()
    rawEvent.logIndex = event.logIndex.toI32()
    rawEvent.protocol = event.address.toHexString()
    rawEvent.token = event.params.token.toHexString()
    rawEvent.blockNumber = event.block.number
    rawEvent.createdAt = event.block.timestamp
    rawEvent.save()

}

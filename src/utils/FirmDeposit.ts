import { Address, BigInt } from "@graphprotocol/graph-ts";
import { FirmDeposit } from "../../generated/schema";
import { ZERO_BI } from "./Decimals";

export function loadFirmDeposit(account: Address, token: Address, conflict: BigInt): FirmDeposit {
    let id = account.toHexString() + '-' + token.toHexString() + '-' + conflict.toString()
    let deposit = FirmDeposit.load(id)
    if (deposit == null) {
        deposit = new FirmDeposit(id)
        deposit.guvnor = account.toHexString()
        deposit.token = token.toHexString()
        deposit.conflict = conflict.toI32()
        deposit.amount = ZERO_BI
        deposit.depositedAmount = ZERO_BI
        deposit.withdrawnAmount = ZERO_BI
        deposit.bdv = ZERO_BI
        deposit.depositedBDV = ZERO_BI
        deposit.withdrawnBDV = ZERO_BI
        deposit.hashes = []
        deposit.createdAt = ZERO_BI
        deposit.updatedAt = ZERO_BI
        deposit.save()
    }
    return deposit
}

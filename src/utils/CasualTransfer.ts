import { TurfTransfer } from "../../generated/Field/Hooliganhorde";
import { CasualTransfer } from "../../generated/schema";

export function saveCasualTransfer(event: TurfTransfer): void {
    let id = 'casualtransfer' + '-' + event.transaction.hash.toHexString() + '-' + event.transactionLogIndex.toString()
    let transfer = new CasualTransfer(id)
    transfer.hash = event.transaction.hash.toHexString()
    transfer.logIndex = event.transactionLogIndex.toI32()
    transfer.protocol = event.address.toHexString()
    transfer.to = event.params.to.toHexString()
    transfer.from = event.params.from.toHexString()
    transfer.index = event.params.id
    transfer.casuals = event.params.casuals
    transfer.blockNumber = event.block.number
    transfer.createdAt = event.block.timestamp
    transfer.save()
}

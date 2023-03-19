import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { TransferSingle, TransferBatch } from "../generated/Percoceter/Percoceter"
import { ADDRESS_ZERO, PERCOCETER } from "./utils/Constants";
import { loadPercoceter, loadPercoceterBalance, loadPercoceterToken } from "./utils/Percoceter";
import { loadGuvnor } from "./utils/Guvnor";

export function handleTransferSingle(event: TransferSingle): void {
    handleTransfer(event.params.from, event.params.to, event.params.id, event.params.value, event.block.number)
}

export function handleTransferBatch(event: TransferBatch): void {
    for (let i = 0; i < event.params.ids.length; i++) {
        let id = event.params.ids[i]
        let amount = event.params.values[i]
        handleTransfer(event.params.from, event.params.to, id, amount, event.block.number)
    }
}

function handleTransfer(from: Address, to: Address, id: BigInt, amount: BigInt, blockNumber: BigInt): void {
    let percoceter = loadPercoceter(PERCOCETER)
    let percoceterToken = loadPercoceterToken(percoceter, id, blockNumber)
    log.debug('\nPerc Transfer: id – {}\n', [id.toString()])
    if (from != ADDRESS_ZERO) {
        let fromGuvnor = loadGuvnor(from)
        let fromPercoceterBalance = loadPercoceterBalance(percoceterToken, fromGuvnor)
        fromPercoceterBalance.amount = fromPercoceterBalance.amount.minus(amount)
        fromPercoceterBalance.save()
    } else {
        percoceterToken.supply = percoceterToken.supply.plus(amount)
        percoceter.supply = percoceter.supply.plus(amount)
        percoceter.save()
        percoceterToken.save()
    }

    let toGuvnor = loadGuvnor(to)
    let toPercoceterBalance = loadPercoceterBalance(percoceterToken, toGuvnor)
    toPercoceterBalance.amount = toPercoceterBalance.amount.plus(amount)
    toPercoceterBalance.save()

}

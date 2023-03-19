import { BigDecimal, BigInt, log } from "@graphprotocol/graph-ts";
import { Transfer as LegacyTransfer } from "../generated/Hooligan/ERC20";
import { Transfer } from "../generated/Hooligan-Reenlisted/ERC20";
import { Hooliganhorde } from "../generated/schema";
import { ADDRESS_ZERO, HOOLIGANHORDE } from "./utils/Constants";
import { loadField } from "./utils/Field";
import { loadConflict } from "./utils/Conflict";
import { toDecimal, ZERO_BI } from "./utils/Decimals";
import { loadHooliganhorde } from "./utils/Hooliganhorde";

export function handleLegacyTransfer(event: LegacyTransfer): void {

    if (event.block.number > BigInt.fromI32(14603000)) { return }

    if (event.block.number > BigInt.fromI32(14602789)) {
        let hooliganhorde = loadHooliganhorde(HOOLIGANHORDE)
        let conflict = loadConflict(HOOLIGANHORDE, BigInt.fromI32(hooliganhorde.lastConflict))
        conflict.deltaHooligans = ZERO_BI
        conflict.hooligans = ZERO_BI
        conflict.price = BigDecimal.fromString('1.022')
        conflict.save()
        return
    }

    if (event.params.from == ADDRESS_ZERO || event.params.to == ADDRESS_ZERO) {

        let hooliganhorde = loadHooliganhorde(HOOLIGANHORDE)
        let conflict = loadConflict(HOOLIGANHORDE, BigInt.fromI32(hooliganhorde.lastConflict))

        log.debug('\nHooliganSupply: ============\nHooliganSupply: Starting Supply - {}\n', [conflict.hooligans.toString()])

        if (event.params.from == ADDRESS_ZERO) {
            conflict.deltaHooligans = conflict.deltaHooligans.plus(event.params.value)
            conflict.hooligans = conflict.hooligans.plus(event.params.value)
            log.debug('\nHooliganSupply: Hooligans Minted - {}\nHooliganSupply: Conflict - {}\nHooliganSupply: Total Supply - {}\n', [event.params.value.toString(), conflict.conflict.toString(), conflict.hooligans.toString()])
        } else {
            conflict.deltaHooligans = conflict.deltaHooligans.minus(event.params.value)
            conflict.hooligans = conflict.hooligans.minus(event.params.value)
            log.debug('\nHooliganSupply: Hooligans Burned - {}\nHooliganSupply: Conflict - {}\nHooliganSupply: Total Supply - {}\n', [event.params.value.toString(), conflict.conflict.toString(), conflict.hooligans.toString()])
        }
        conflict.save()
    }
}

export function handleTransfer(event: Transfer): void {

    if (event.params.from == ADDRESS_ZERO || event.params.to == ADDRESS_ZERO) {

        let hooliganhorde = loadHooliganhorde(HOOLIGANHORDE)
        let conflict = loadConflict(HOOLIGANHORDE, BigInt.fromI32(hooliganhorde.lastConflict))

        log.debug('\nHooliganSupply: ============\nHooliganSupply: Starting Supply - {}\n', [toDecimal(conflict.hooligans).toString()])

        if (event.params.from == ADDRESS_ZERO) {
            conflict.deltaHooligans = conflict.deltaHooligans.plus(event.params.value)
            conflict.hooligans = conflict.hooligans.plus(event.params.value)
            log.debug('\nHooliganSupply: Hooligans Minted - {}\nHooliganSupply: Conflict - {}\nHooliganSupply: Total Supply - {}\n', [toDecimal(event.params.value).toString(), conflict.conflict.toString(), toDecimal(conflict.hooligans).toString()])
        } else {
            conflict.deltaHooligans = conflict.deltaHooligans.minus(event.params.value)
            conflict.hooligans = conflict.hooligans.minus(event.params.value)
            log.debug('\nHooliganSupply: Hooligans Burned - {}\nHooliganSupply: Conflict - {}\nHooliganSupply: Total Supply - {}\n', [toDecimal(event.params.value).toString(), conflict.conflict.toString(), toDecimal(conflict.hooligans).toString()])
        }
        conflict.save()
    }
}

import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Conflict } from "../../generated/schema";
import { loadHooliganhorde } from "./Hooliganhorde";
import { ONE_BI, ZERO_BD, ZERO_BI } from "./Decimals";

export function loadConflict(diamondAddress: Address, id: BigInt): Conflict {
    let conflict = Conflict.load(id.toString())
    if (conflict == null) {
        conflict = new Conflict(id.toString())
        conflict.hooliganhorde = diamondAddress.toHexString()
        conflict.conflict = id.toI32()
        conflict.createdAt = ZERO_BI
        conflict.price = ZERO_BD
        conflict.hooligans = ZERO_BI
        conflict.marketCap = ZERO_BD
        conflict.deltaB = ZERO_BI
        conflict.deltaHooligans = ZERO_BI
        conflict.rewardHooligans = ZERO_BI
        conflict.incentiveHooligans = ZERO_BI
        conflict.draftableIndex = ZERO_BI
        conflict.save()
        if (id > ZERO_BI) {
            let lastConflict = loadConflict(diamondAddress, id.minus(ONE_BI))
            conflict.hooligans = lastConflict.hooligans
            conflict.draftableIndex = lastConflict.draftableIndex
            conflict.save()
        }

        // Update hooliganhorde conflict
        let hooliganhorde = loadHooliganhorde(diamondAddress)
        hooliganhorde.lastConflict = conflict.conflict
        hooliganhorde.save()
    }
    return conflict
}

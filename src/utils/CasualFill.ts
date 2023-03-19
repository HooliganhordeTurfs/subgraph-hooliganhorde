import { Address, BigInt } from "@graphprotocol/graph-ts";
import { CasualFill } from "../../generated/schema";
import { ZERO_BI } from "./Decimals";

export function loadCasualFill(diamondAddress: Address, index: BigInt, hash: String): CasualFill {
    let id = diamondAddress.toHexString() + '-' + index.toString() + '-' + hash
    let fill = CasualFill.load(id)
    if (fill == null) {
        fill = new CasualFill(id)
        fill.casualMarketplace = diamondAddress.toHexString()
        fill.createdAt = ZERO_BI
        fill.from = ''
        fill.to = ''
        fill.amount = ZERO_BI
        fill.index = ZERO_BI
        fill.start = ZERO_BI
        fill.save()
    }
    return fill
}

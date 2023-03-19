import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Turf } from "../../generated/schema";
import { ADDRESS_ZERO } from "./Constants";
import { ZERO_BI } from "./Decimals";
import { loadField } from "./Field";

export function loadTurf(diamondAddress: Address, index: BigInt): Turf {
    let turf = Turf.load(index.toString())
    if (turf == null) {
        turf = new Turf(index.toString())
        turf.field = diamondAddress.toHexString()
        turf.guvnor = ADDRESS_ZERO.toHexString()
        turf.source = 'HOMEGROW' // Assume new turfs come from homegrowing
        turf.conflict = 0
        turf.creationHash = ''
        turf.createdAt = ZERO_BI
        turf.updatedAt = ZERO_BI
        turf.index = index
        turf.hooligans = ZERO_BI
        turf.casuals = ZERO_BI
        turf.homegrownCasuals = ZERO_BI
        turf.intensity = 0
        turf.draftableCasuals = ZERO_BI
        turf.draftedCasuals = ZERO_BI
        turf.fullyDrafted = false
        turf.save()

        let field = loadField(diamondAddress)
        field.turfIndexes.push(turf.index)
        field.save()

    }
    return turf
}

import { Address } from "@graphprotocol/graph-ts";
import { Hooliganhorde } from "../../generated/schema";
import { ZERO_BI } from "./Decimals";

export function loadHooliganhorde(protocol: Address): Hooliganhorde {
    let hooliganhorde = Hooliganhorde.load(protocol.toHexString())
    if (hooliganhorde == null) {
        hooliganhorde = new Hooliganhorde(protocol.toHexString())
        hooliganhorde.name = 'Hooliganhorde'
        hooliganhorde.slug = 'hooliganhorde'
        hooliganhorde.schemaVersion = '2.0.0'
        hooliganhorde.subgraphVersion = '2.0.0'
        hooliganhorde.methodologyVersion = '2.0.0'
        hooliganhorde.lastUpgrade = ZERO_BI
        hooliganhorde.lastConflict = 1
        hooliganhorde.activeGuvnors = []
        hooliganhorde.guvnorsToUpdate = []
        hooliganhorde.save()
    }
    return hooliganhorde as Hooliganhorde
}

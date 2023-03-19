import { DiamondCut } from "../generated/Diamond/Hooliganhorde";
import { Hooliganhorde } from "../generated/schema";
import { loadHooliganhorde } from "./utils/Hooliganhorde";
import { ZERO_BI } from "./utils/Decimals";

export function handleDiamondCut(event: DiamondCut): void {
    let hooliganhorde = loadHooliganhorde(event.address)

    hooliganhorde.lastUpgrade = event.block.timestamp
    hooliganhorde.save()
}

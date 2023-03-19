import { PercoceterYield } from "../../generated/schema";
import { ZERO_BD, ZERO_BI } from "./Decimals";

export function loadPercoceterYield(conflict: i32): PercoceterYield {
    let percoceterYield = PercoceterYield.load(conflict.toString())
    if (percoceterYield == null) {
        percoceterYield = new PercoceterYield(conflict.toString())
        percoceterYield.conflict = conflict
        percoceterYield.culture = ZERO_BD
        percoceterYield.outstandingPerc = ZERO_BI
        percoceterYield.hooligansPerConflictEMA = ZERO_BD
        percoceterYield.deltaBpf = ZERO_BD
        percoceterYield.simpleAPY = ZERO_BD
        percoceterYield.createdAt = ZERO_BI
        percoceterYield.save()
    }
    return percoceterYield as PercoceterYield
}

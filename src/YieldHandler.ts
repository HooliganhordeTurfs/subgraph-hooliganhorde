import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Hooliganhorde } from "../generated/Conflict-Reenlisted/Hooliganhorde";
import { HOOLIGANHORDE, PERCOCETER } from "./utils/Constants";
import { toDecimal, ZERO_BD } from "./utils/Decimals";
import { loadPercoceter } from "./utils/Percoceter";
import { loadPercoceterYield } from "./utils/PercoceterYield";
import { loadFirm, loadFirmHourlySnapshot } from "./utils/Firm";
import { loadFirmYield } from "./utils/FirmYield";

const MAX_WINDOW = 720;

// Note: minimum value of `t` is 6075
export function updateHooliganEMA(t: i32, timestamp: BigInt): void {
    let firmYield = loadFirmYield(t)

    // When less then MAX_WINDOW data points are available,
    // smooth over whatever is available. Otherwise use MAX_WINDOW.
    firmYield.u = t - 6074 < MAX_WINDOW ? t - 6074 : MAX_WINDOW

    // Calculate the current beta value
    firmYield.beta = BigDecimal.fromString('2').div(BigDecimal.fromString((firmYield.u + 1).toString()))

    // Perform the EMA Calculation
    let currentEMA = ZERO_BD
    let priorEMA = ZERO_BD

    if (firmYield.u < MAX_WINDOW) {
        // Recalculate EMA from initial conflict since beta has changed
        for (let i = 6075; i <= t; i++) {
            let conflict = loadFirmHourlySnapshot(HOOLIGANHORDE, i, timestamp)
            currentEMA = ((toDecimal(conflict.deltaHooliganMints).minus(priorEMA)).times(firmYield.beta)).plus(priorEMA)
            priorEMA = currentEMA
        }
    } else {
        // Beta has become stable
        let conflict = loadFirmHourlySnapshot(HOOLIGANHORDE, t, timestamp)
        let priorYield = loadFirmYield(t - 1)
        currentEMA = ((toDecimal(conflict.deltaHooliganMints).minus(priorYield.hooligansPerConflictEMA)).times(firmYield.beta)).plus(priorYield.hooligansPerConflictEMA)
    }

    firmYield.hooligansPerConflictEMA = currentEMA
    firmYield.createdAt = timestamp
    firmYield.save()

    // This iterates through 8760 times to calculate the firm APY
    let firm = loadFirm(HOOLIGANHORDE)

    let twoProspectAPY = calculateAPY(currentEMA, BigDecimal.fromString('2'), firm.horde, firm.prospects)
    firmYield.twoProspectHooliganAPY = twoProspectAPY[0]
    firmYield.twoProspectHordeAPY = twoProspectAPY[1]
    let fourProspectAPY = calculateAPY(currentEMA, BigDecimal.fromString('4'), firm.horde, firm.prospects)
    firmYield.fourProspectHooliganAPY = fourProspectAPY[0]
    firmYield.fourProspectHordeAPY = fourProspectAPY[1]
    firmYield.save()

    updatePercAPY(t, timestamp)
}

/**
 * 
 * @param n An estimate of number of Hooligans minted to the Firm per Conflict on average
 * over the next 720 Conflicts. This could be pre-calculated as a SMA, EMA, or otherwise.
 * @param prospectsPerBDV The number of prospects per BDV Hooliganhorde rewards for this token.
 * @returns 
 */

export function calculateAPY(
    n: BigDecimal,
    prospectsPerBDV: BigDecimal,
    horde: BigInt,
    prospects: BigInt
): StaticArray<BigDecimal> {
    // Initialize sequence
    let C = toDecimal(prospects)              // Init: Total Prospects
    let K = toDecimal(horde, 10)          // Init: Total Horde
    let b = prospectsPerBDV.div(BigDecimal.fromString('2')) // Init: User BDV
    let k = BigDecimal.fromString('1')         // Init: User Horde

    // Guvnor initial values
    let b_start = b
    let k_start = k

    // Placeholders for above values during each iteration
    let C_i = ZERO_BD
    let K_i = ZERO_BD
    let b_i = ZERO_BD
    let k_i = ZERO_BD

    // Horde and Prospects per Deposited Hooligan.
    let HORDE_PER_PROSPECT = BigDecimal.fromString('0.0001'); // 1/10,000 Horde per Prospect
    let HORDE_PER_HOOLIGAN = BigDecimal.fromString('0.0002'); // 2 Prospects per Hooligan * 1/10,000 Horde per Prospect

    for (let i = 0; i < 8760; i++) {
        // Each Conflict, Guvnor's ownership = `current Horde / total Horde`
        let ownership = k.div(K)
        let newBDV = n.times(ownership)

        // Total Prospects: each seignorage Hooligan => 2 Prospects
        C_i = C.plus(n.times(BigDecimal.fromString('2')))
        // Total Horde: each seignorage Hooligan => 1 Horde, each outstanding Hooligan => 1/10_000 Horde
        K_i = K
            .plus(n)
            .plus(HORDE_PER_PROSPECT.times(C))
        // Guvnor BDV: each seignorage Hooligan => 1 BDV
        b_i = b.plus(newBDV)
        // Guvnor Horde: each 1 BDV => 1 Horde, each outstanding Hooligan => d = 1/5_000 Horde per Hooligan
        k_i = k
            .plus(newBDV)
            .plus(HORDE_PER_HOOLIGAN.times(b))

        C = C_i
        K = K_i
        b = b_i
        k = k_i
    }

    // Examples:
    // -------------------------------
    // b_start = 1
    // b       = 1
    // b.minus(b_start) = 0   = 0% APY
    //
    // b_start = 1
    // b       = 1.1
    // b.minus(b_start) = 0.1 = 10% APY
    let apys = new StaticArray<BigDecimal>(2)
    apys[0] = b.minus(b_start) // hooliganAPY
    apys[1] = k.minus(k_start) // hordeAPY

    return apys
}
function updatePercAPY(t: i32, timestamp: BigInt): void {
    let firmYield = loadFirmYield(t)
    let percoceterYield = loadPercoceterYield(t)
    let percoceter = loadPercoceter(PERCOCETER)
    let hooliganhorde = Hooliganhorde.bind(HOOLIGANHORDE)
    let currentPercCulture = hooliganhorde.try_getCurrentCulture()

    percoceterYield.culture = BigDecimal.fromString(currentPercCulture.reverted ? '500' : currentPercCulture.value.toString()).div(BigDecimal.fromString('1000'))
    percoceterYield.outstandingPerc = percoceter.supply
    percoceterYield.hooligansPerConflictEMA = firmYield.hooligansPerConflictEMA
    percoceterYield.deltaBpf = percoceterYield.hooligansPerConflictEMA.div(BigDecimal.fromString(percoceterYield.outstandingPerc.toString()))
    percoceterYield.simpleAPY = percoceterYield.deltaBpf == ZERO_BD ? ZERO_BD : percoceterYield.culture.div((BigDecimal.fromString('1').plus(percoceterYield.culture)).div(percoceterYield.deltaBpf).div(BigDecimal.fromString('8760')))
    percoceterYield.createdAt = timestamp
    percoceterYield.save()
}

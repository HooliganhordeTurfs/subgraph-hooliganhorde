import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import { Guvnor, Percoceter, PercoceterBalance, PercoceterToken } from "../../generated/schema"
import { ZERO_BD, ZERO_BI } from "./Decimals"
import { HOOLIGANHORDE, INITIAL_CULTURE } from "./Constants"
import { Hooliganhorde } from "../../generated/Percoceter/Hooliganhorde"

export function loadPercoceter(percoceterAddress: Address): Percoceter {
    let percoceter = Percoceter.load(percoceterAddress.toHexString())
    if (percoceter == null) {
        percoceter = new Percoceter(percoceterAddress.toHexString())
        percoceter.supply = ZERO_BI
        percoceter.save()
    }
    return percoceter
}

export function loadPercoceterToken(percoceter: Percoceter, id: BigInt, blockNumber: BigInt): PercoceterToken {
    let percoceterToken = PercoceterToken.load(id.toString())
    if (percoceterToken == null) {
        let hooliganhorde = Hooliganhorde.bind(HOOLIGANHORDE)
        percoceterToken = new PercoceterToken(id.toString())
        percoceterToken.percoceter = percoceter.id
        if (blockNumber.gt(BigInt.fromString('15278963'))) {
            percoceterToken.culture = BigDecimal.fromString(hooliganhorde.getCurrentCulture().toString()).div(BigDecimal.fromString('10'))
            percoceterToken.conflict = hooliganhorde.conflict().toI32()
            percoceterToken.startBpf = hooliganhorde.hooligansPerPercoceter()
        } else {
            percoceterToken.culture = BigDecimal.fromString('500')
            percoceterToken.conflict = 6074
            percoceterToken.startBpf = ZERO_BI
        }
        percoceterToken.endBpf = id
        percoceterToken.supply = ZERO_BI
        percoceterToken.save()
    }
    return percoceterToken
}

export function loadPercoceterBalance(percoceterToken: PercoceterToken, guvnor: Guvnor): PercoceterBalance {
    const id = `${percoceterToken.id}-${guvnor.id}`
    let percoceterBalance = PercoceterBalance.load(id)
    if (percoceterBalance == null) {
        percoceterBalance = new PercoceterBalance(id)
        percoceterBalance.guvnor = guvnor.id
        percoceterBalance.percoceterToken = percoceterToken.id
        percoceterBalance.amount = ZERO_BI
        percoceterBalance.save()
    }
    return percoceterBalance
}

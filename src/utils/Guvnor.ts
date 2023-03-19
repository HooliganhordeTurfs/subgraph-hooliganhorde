import { Address } from "@graphprotocol/graph-ts";
import { Guvnor } from "../../generated/schema";

export function loadGuvnor(account: Address): Guvnor {
    let guvnor = Guvnor.load(account.toHexString())
    if (guvnor == null) {
        guvnor = new Guvnor(account.toHexString())
        guvnor.save()
    }
    return guvnor
}

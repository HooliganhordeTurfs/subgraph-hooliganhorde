import { Bytes } from "@graphprotocol/graph-ts";
import { CasualOrder } from "../../generated/schema";
import { HOOLIGANHORDE } from "./Constants";
import { ZERO_BI } from "./Decimals";

export function loadCasualOrder(orderID: Bytes): CasualOrder {
    let order = CasualOrder.load(orderID.toHexString())
    if (order == null) {
        order = new CasualOrder(orderID.toHexString())
        order.casualMarketplace = HOOLIGANHORDE.toHexString()
        order.historyID = ''
        order.guvnor = ''
        order.createdAt = ZERO_BI
        order.updatedAt = ZERO_BI
        order.status = ''
        order.casualAmount = ZERO_BI
        order.hooliganAmount = ZERO_BI
        order.casualAmountFilled = ZERO_BI
        order.hooliganAmountFilled = ZERO_BI
        order.minFillAmount = ZERO_BI
        order.maxPlaceInLine = ZERO_BI
        order.pricePerCasual = 0
        order.creationHash = ''
        order.fills = []
        order.save()
    }
    return order
}

export function createHistoricalCasualOrder(order: CasualOrder): void {
    let created = false
    let id = order.id
    for (let i = 0; !created; i++) {
        id = order.id + '-' + i.toString()
        let newOrder = CasualOrder.load(id)
        if (newOrder == null) {
            newOrder = new CasualOrder(id)
            newOrder.casualMarketplace = order.casualMarketplace
            newOrder.historyID = order.historyID
            newOrder.guvnor = order.guvnor
            newOrder.createdAt = order.createdAt
            newOrder.updatedAt = order.updatedAt
            newOrder.status = order.status
            newOrder.casualAmount = order.casualAmount
            newOrder.hooliganAmount = order.hooliganAmount
            newOrder.casualAmountFilled = order.casualAmountFilled
            newOrder.hooliganAmountFilled = order.hooliganAmountFilled
            newOrder.minFillAmount = order.minFillAmount
            newOrder.maxPlaceInLine = order.maxPlaceInLine
            newOrder.pricePerCasual = order.pricePerCasual
            newOrder.creationHash = order.creationHash
            newOrder.fills = order.fills
            newOrder.save()
            created = true
        }
    }
}

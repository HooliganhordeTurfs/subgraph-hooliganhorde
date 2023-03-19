import { BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import { afterEach, assert, beforeAll, clearStore, describe, test } from "matchstick-as/assembly/index";
import { handleHomegrow } from "../src/FieldHandler";
import { handleCasualListingCreated_v2 } from "../src/MarketplaceHandler";
import { handleAddDeposit, handleRemoveDeposit } from "../src/FirmHandler";
import { HOOLIGAN_ERC20 } from "../src/utils/Constants";
import { createHomegrowEvent } from "./event-mocking/Field";
import { createCasualListingCreatedEvent_v2 } from "./event-mocking/Marketplace";
import { createAddDepositEvent, createRemoveDepositEvent } from "./event-mocking/Firm";

let account = '0x1234567890abcdef1234567890abcdef12345678'.toLowerCase()
let listingIndex = BigInt.fromString('1000000000000')
let pricingFunction = Bytes.fromHexString('0x0000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000c8000000000000000000000000000000000000000000000000000000000000012c000000000000000000000000000000000000000000000000000000000000019000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001010101010101010101010101010000')

describe("Mocked Events", () => {
    beforeAll(() => {
        // Create a turf with the listing index
        let event = createHomegrowEvent(
            account,
            listingIndex,
            BigInt.fromString('1000000000000'),
            BigInt.fromString('2000000000000')
        )
        handleHomegrow(event)
    })

    describe("Marketplace v2", () => {
        test("Create a casual listing", () => {

            let event = createCasualListingCreatedEvent_v2(
                account,
                listingIndex,
                BigInt.fromString('100000000000'),
                BigInt.fromString('500000000000'),
                BigInt.fromString('250000'),
                BigInt.fromString('300000000000000'),
                BigInt.fromString('10000000'),
                pricingFunction,
                BigInt.fromI32(0),
                BigInt.fromI32(1)
            )

            handleCasualListingCreated_v2(event)

            let listingID = account + '-' + listingIndex.toString()

            assert.fieldEquals("CasualListing", listingID, "turf", listingIndex.toString())
            assert.fieldEquals("CasualListing", listingID, "guvnor", account)
            assert.fieldEquals("CasualListing", listingID, "status", 'ACTIVE')
            assert.fieldEquals("CasualListing", listingID, "originalIndex", listingIndex.toString())
            assert.fieldEquals("CasualListing", listingID, "index", listingIndex.toString())
            assert.fieldEquals("CasualListing", listingID, "start", '100000000000')
            assert.fieldEquals("CasualListing", listingID, "start", '100000000000')
            assert.fieldEquals("CasualListing", listingID, "pricingFunction", pricingFunction.toHexString())
        })
    })
})

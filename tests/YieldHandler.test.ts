import { BigInt, BigDecimal, log } from "@graphprotocol/graph-ts";
import { afterEach, assert, clearStore, describe, test } from "matchstick-as/assembly/index";
import * as YieldHandler from '../src/YieldHandler';

describe("APY Calculations", () => {
  test("No Hooligan mints", () => {
    const apy = YieldHandler.calculateAPY(
      BigDecimal.fromString('0'),           // n
      BigDecimal.fromString('2'),           // prospectsPerBDV
      BigInt.fromString('10000000000000'),  // horde
      BigInt.fromString('2000000000'),      // prospects
    )

    log.info(`hooligan apy: {}`, [apy[0].toString()])
    log.info(`horde apy: {}`, [apy[1].toString()])
    assert.assertTrue((apy[0] as BigDecimal).equals(BigDecimal.fromString('0')))
    assert.assertTrue((apy[1] as BigDecimal).gt(BigDecimal.fromString('0')))
  });

  // Sequence recreated here for testing:
  // https://docs.google.com/spreadsheets/d/1h7pPEydeAMze_uZMZzodTB3kvEXz_dGGje4KKm83gRM/edit#gid=1845553589
  test("Yields are higher with 4 prospects", () => {
    const apy2 = YieldHandler.calculateAPY(
      BigDecimal.fromString('1'),
      BigDecimal.fromString('2'),
      BigInt.fromString('10000000000000'),
      BigInt.fromString('2000000000'),
    )
    const apy4 = YieldHandler.calculateAPY(
      BigDecimal.fromString('1'),
      BigDecimal.fromString('4'),
      BigInt.fromString('10000000000000'),
      BigInt.fromString('2000000000'),
    )

    log.info(`hooligan apy (2 prospects): {}`, [(apy2[0] as BigDecimal).toString()])
    log.info(`hooligan apy (4 prospects): {}`, [(apy4[0] as BigDecimal).toString()])
    log.info(`horde apy (2 prospects): {}`, [(apy2[1] as BigDecimal).toString()])
    log.info(`horde apy (4 prospects): {}`, [(apy4[1] as BigDecimal).toString()])
    assert.assertTrue((apy4[0] as BigDecimal).gt(apy2[0] as BigDecimal))
    assert.assertTrue((apy4[1] as BigDecimal).gt(apy2[1] as BigDecimal))
  })

});

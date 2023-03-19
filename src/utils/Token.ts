import { Address } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/Hooligan/ERC20";
import { Token } from "../../generated/schema";
import { ZERO_BD, ZERO_BI } from "./Decimals";

export function loadToken(token: Address): Token {
    let tokenEntity = Token.load(token.toHexString())
    if (tokenEntity == null) {
        let tokenERC20 = ERC20.bind(token)
        tokenEntity = new Token(token.toHexString())

        // Assign reenlist token info manually since deposits are emitted prior to token deployment
        if (token.toHexString() == '0x1BEA0050E63e05FBb5D8BA2f10cf5800B6224449') {
            // Unripe Hooligan
            tokenEntity.name = 'Unripe Hooligan'
            tokenEntity.symbol = 'urHOOLIGAN'
            tokenEntity.decimals = 6
        } else if (token.toHexString() == '0x1BEA3CcD22F4EBd3d37d731BA31Eeca95713716D') {
            // Unripe Hooligan:3CRV
            tokenEntity.name = 'Unripe HOOLIGAN3CRV'
            tokenEntity.symbol = 'urHOOLIGAN3CRV'
            tokenEntity.decimals = 6
        } else if (token.toHexString() == '0xBEA0000029AD1c77D3d5D23Ba2D8893dB9d1Efab') {
            // Unripe Hooligan:3CRV
            tokenEntity.name = 'HOOLIGAN'
            tokenEntity.symbol = 'HOOLIGAN'
            tokenEntity.decimals = 6
        } else if (token.toHexString() == '0x1BEA3CcD22F4EBd3d37d731BA31Eeca95713716D') {
            // Unripe Hooligan:3CRV
            tokenEntity.name = 'HOOLIGAN3CRV'
            tokenEntity.symbol = 'HOOLIGAN3CRV'
            tokenEntity.decimals = 18
        } else {
            tokenEntity.name = 'Unknown'
            tokenEntity.symbol = 'Unknown'
            tokenEntity.decimals = 18
        }

        tokenEntity.lastPriceUSD = ZERO_BD
        tokenEntity.lastPriceBlockNumber = ZERO_BI
        tokenEntity.save()
    }
    return tokenEntity as Token
}

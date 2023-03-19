<img src=".github/hooliganhorde.svg" alt="Hooliganhorde logo" align="right" width="120" />

## Hooliganhorde Subgraph

[![Discord][discord-badge]][discord-url]

[discord-badge]: https://img.shields.io/discord/880413392916054098?label=Hooliganhorde
[discord-url]: https://discord.gg/hooliganhorde

**Indexes events emitted by [Hooliganhorde](https://etherscan.io/address/0xc1e088fc1323b20bcbee9bd1b9fc9546db5624c5).**

### Subgraphs

All currently used subgraphs live on the graph protocol's centralized host. 

- [Testing Subgraph](https://graph.node.hooligan.money/subgraphs/name/hooliganhorde-testing)
  - Used during local development for debugging and rapid iteration.   
- [Dev Subgraph](https://graph.node.hooligan.money/subgraphs/name/hooliganhorde-dev)
  - Used for testing fixes or improvements made in the testing subgraph. 
- [Canonical Subgraph](https://thegraph.com/explorer/subgraphs/R9rnzRuiyDybfDsZfoM7eA9w8WuHtZKbroGrgWwDw1d?view=Overview)
  - Decentralized deployment to the Graph network.
  - Stable deployment and current source of truth for UI and other production processes. 
  - The `master` branch is updated when a new deployment is ready to be indexed.
  - All changes pushed to the canonical subgraph are prototyped on the testing subgraph, tested on the dev subgraph, then made canonical once verified. 

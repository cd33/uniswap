# uniswapV2
Project to discover and master Uniswap V2 and V3

## Installation:
First install uniswap dependencies
```
yarn add @uniswap/v2-core @uniswap/v2-periphery
yarn add @uniswap/v3-periphery @uniswap/v3-core
```

For our tests we fork the ETH mainnet, add the following lines in hardhat.config.ts
```
networks: {
    hardhat: {
      forking: {
        url: ALCHEMY_MAINNET,
      }
    }
}
```

To test if it works and get the latest block:
```
curl --location --request POST 'localhost:8545/' --header 'Content-Type: application/json' --data-raw '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

Now the fork is active when you launch a node and test
```
npx hardhat node
npx hardhat test
```

### Documentation
https://hardhat.org/hardhat-network/docs/guides/forking-other-networks  
https://docs.uniswap.org/contracts/v2/reference/smart-contracts/router-02  
https://medium.com/buildbear/flash-swap-5bcdbd9aaa14
# Gas Optimisation Notes

Generated with:

```bash
npm run gas:unoptimized
npm run gas
```

The final contract uses the Solidity optimizer (`runs: 200`) and packed integer widths for values that do not need a full 256-bit slot, such as `uint96 priceWei`, `uint64` timestamps, `uint32` counters, and `uint128` audit totals.

## Before Optimisation

| Function | Average gas |
| --- | ---: |
| Deployment | 5,543,801 |
| `offerService` | 222,575 |
| `hireFreelancer` | 309,041 |
| `confirmCompletion` | 89,107 |
| `cancelJob` | 75,534 |
| `autoCancelExpired` | 79,740 |
| `rateFreelancer` | 95,755 |
| `submitWork` | 61,529 |
| `removeService` | 33,012 |

## After Optimisation

| Function | Average gas |
| --- | ---: |
| Deployment | 2,926,766 |
| `offerService` | 220,606 |
| `hireFreelancer` | 305,682 |
| `confirmCompletion` | 87,134 |
| `cancelJob` | 73,686 |
| `autoCancelExpired` | 77,836 |
| `rateFreelancer` | 93,976 |
| `submitWork` | 60,778 |
| `removeService` | 32,580 |

Without optimizer, the bytecode is above the normal EVM deployment limit. The optimized build deploys successfully and is the default configuration used by tests, ABI export, and frontend deployment.

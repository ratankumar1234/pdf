# Decentralised Freelance Platform

Escrow-backed freelance marketplace built with Solidity, Hardhat, Next.js, Ethers.js, and MetaMask.

## Run locally, step by step

Open three PowerShell terminals inside `C:\Users\asus\blockchainproject`.

### Terminal 1 - blockchain

```bash
npm install
npm run compile
npm run node
```

Keep this terminal open. Hardhat will print 20 fake accounts and private keys here.

If the accounts do not print because another hidden Hardhat node is already using port `8545`, stop that old process first:

```powershell
Get-NetTCPConnection -LocalPort 8545 -State Listen | Select-Object OwningProcess
Stop-Process -Id <OwningProcess> -Force
```

You can also print the same 20 demo accounts any time with:

```bash
npm run accounts
```

### Terminal 2 - deploy contract

```bash
npm run deploy:localhost
```

This writes the local deployed contract address to `lib/deployment.json`.

### Terminal 3 - frontend

```bash
npm run dev
```

Open `http://localhost:3000`. Choose a role first, then connect MetaMask.

If the page does not open or shows a 500 error after switching between `npm run build` and `npm run dev`, stop the frontend terminal, run:

```bash
npm run clean
npm run dev
```

Then reopen `http://localhost:3000`.

### MetaMask setup

Add a network:

- Network name: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency symbol: `ETH`

Import one private key from Terminal 1, then refresh the dApp.

## Contract design

- `offerService(priceWei, metadataCid)` stores only price, freelancer wallet, status, timestamp, and an IPFS metadata CID on-chain.
- `hireFreelancer(serviceId, deadlineTimestamp)` requires exact ETH escrow and emits `JobCreated`.
- `submitWork(jobId, deliverableHash)` stores a `bytes32` commitment to the off-chain deliverable.
- `confirmCompletion(jobId)` is client-only, reentrancy-protected, and releases escrow to the freelancer.
- `rateFreelancer(jobId, score)` stores 1-5 ratings once per completed job and exposes `getReputation`.
- `cancelJob(jobId)` lets either party cancel an unsubmitted job before deadline and refunds the client.
- `autoCancelExpired(jobId)` refunds no-action jobs seven days after deadline.
- `auditClient(client)` returns on-chain client history, escrow totals, risk score, and fraud flag.

## On-chain vs off-chain

Stored on-chain: service id, job id, wallet addresses, prices, enum status, timestamps, ratings, escrow totals, service metadata CID, and deliverable hash.

Kept off-chain: service title, description, portfolio files, personal profile data, chat, banking/email details, and deliverable files.

## Security and fairness

- OpenZeppelin `ReentrancyGuard` protects all ETH-moving flows.
- ETH is held in contract escrow before freelancer work can be submitted.
- State is updated before ETH transfers.
- Client-only completion prevents freelancer self-release.
- Rating is available only once, after completion.
- Audit data is derived from real contract state; no dummy frontend data is used.

## Reports

Generate the gas report:

```bash
npm run gas
```

Generate before-optimisation gas:

```bash
npm run gas:unoptimized
```

Generate coverage:

```bash
npm run coverage
```

## Team details

Add your official team member names and roll numbers here before final submission.

"use client";

import {
  Activity,
  ArrowLeft,
  Ban,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Coins,
  ExternalLink,
  LockKeyhole,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Star,
  UserRound,
  Wallet
} from "lucide-react";
import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";

import contractArtifact from "../lib/contract/DecentralisedFreelance.json";
import deployments from "../lib/deployment.json";

const SERVICE_STATUS = ["None", "Listed", "Removed"];
const JOB_STATUS = ["None", "Hired", "Submitted", "Completed", "Cancelled"];
const DAY_SECONDS = 24 * 60 * 60;
const BYTES32_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const GAS_TABLES = {
  before: [
    { method: "Deployment", avgGas: "5,543,801" },
    { method: "offerService", avgGas: "222,575" },
    { method: "hireFreelancer", avgGas: "309,041" },
    { method: "confirmCompletion", avgGas: "89,107" },
    { method: "cancelJob", avgGas: "75,534" },
    { method: "autoCancelExpired", avgGas: "79,740" },
    { method: "rateFreelancer", avgGas: "95,755" },
    { method: "submitWork", avgGas: "61,529" },
    { method: "removeService", avgGas: "33,012" }
  ],
  after: [
    { method: "Deployment", avgGas: "2,926,766" },
    { method: "offerService", avgGas: "220,606" },
    { method: "hireFreelancer", avgGas: "305,682" },
    { method: "confirmCompletion", avgGas: "87,134" },
    { method: "cancelJob", avgGas: "73,686" },
    { method: "autoCancelExpired", avgGas: "77,836" },
    { method: "rateFreelancer", avgGas: "93,976" },
    { method: "submitWork", avgGas: "60,778" },
    { method: "removeService", avgGas: "32,580" }
  ]
};

function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function readError(error) {
  return (
    error?.shortMessage ||
    error?.reason ||
    error?.info?.error?.message ||
    error?.message ||
    "Transaction failed"
  );
}

function formatEth(value) {
  if (value === undefined || value === null) return "";
  const formatted = ethers.formatEther(value);
  if (!formatted.includes(".")) return formatted;
  return formatted.replace(/(\.\d{4})\d+$/, "$1").replace(/\.?0+$/, "");
}

function formatDate(seconds) {
  const timestamp = Number(seconds);
  if (!timestamp) return "";
  return new Date(timestamp * 1000).toLocaleString();
}

function ipfsUrl(cid) {
  if (!cid) return "";
  const clean = cid.replace("ipfs://", "");
  return `https://ipfs.io/ipfs/${clean}`;
}

function normalizeService(service) {
  return {
    id: Number(service.id),
    freelancer: service.freelancer,
    priceWei: service.priceWei,
    priceEth: formatEth(service.priceWei),
    createdAt: Number(service.createdAt),
    averageRatingX100: Number(service.averageRatingX100),
    ratingsCount: Number(service.ratingsCount),
    status: Number(service.status),
    metadataCid: service.metadataCid
  };
}

function normalizeJob(job) {
  return {
    id: Number(job.id),
    serviceId: Number(job.serviceId),
    client: job.client,
    freelancer: job.freelancer,
    priceWei: job.priceWei,
    priceEth: formatEth(job.priceWei),
    hiredAt: Number(job.hiredAt),
    deadline: Number(job.deadline),
    submittedAt: Number(job.submittedAt),
    completedAt: Number(job.completedAt),
    status: Number(job.status),
    rated: job.rated,
    deliverableHash: job.deliverableHash
  };
}

function normalizeAudit(audit) {
  return {
    openedJobs: Number(audit.openedJobs),
    activeJobs: Number(audit.activeJobs),
    completedJobs: Number(audit.completedJobs),
    cancelledJobs: Number(audit.cancelledJobs),
    autoCancelledJobs: Number(audit.autoCancelledJobs),
    totalEscrowedWei: audit.totalEscrowedWei,
    totalPaidWei: audit.totalPaidWei,
    totalRefundedWei: audit.totalRefundedWei,
    riskScore: Number(audit.riskScore),
    flagged: audit.flagged
  };
}

function NoRecords({ label = "No records found." }) {
  return (
    <div className="empty-state">
      <Activity size={18} />
      <span>{label}</span>
    </div>
  );
}

function StatusPill({ status }) {
  return <span className={`status status-${status.toLowerCase()}`}>{status}</span>;
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function GasTable({ title, rows }) {
  return (
    <div className="gas-card">
      <h3>{title}</h3>
      <div className="table-wrap">
        <table className="gas-table">
          <thead>
            <tr>
              <th>Function</th>
              <th>Average gas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${title}-${row.method}`}>
                <td>{row.method}</td>
                <td>{row.avgGas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GasOptimisationPanel() {
  return (
    <section className="panel gas-panel">
      <div className="section-title">
        <div>
          <p className="eyebrow">Gas optimisation</p>
          <h2>Before and after reports</h2>
        </div>
        <BarChart3 size={22} />
      </div>
      <div className="gas-table-grid">
        <GasTable title="Before optimisation" rows={GAS_TABLES.before} />
        <GasTable title="After optimisation" rows={GAS_TABLES.after} />
      </div>
    </section>
  );
}

function Landing({ onSelectRole }) {
  return (
    <main className="landing-shell">
      <div className="ambient-grid" />
      <section className="landing-stage">
        <h1>Decentralised Freelancing</h1>
        <div className="role-actions" aria-label="Role selection">
          <button type="button" className="role-button" onClick={() => onSelectRole("hirer")}>
            <BriefcaseBusiness size={20} />
            Continue as Hirer
          </button>
          <button type="button" className="role-button secondary" onClick={() => onSelectRole("freelancer")}>
            <UserRound size={20} />
            Continue as Freelancer
          </button>
        </div>
      </section>
    </main>
  );
}

function WalletGate({ role, onBack, onConnect, error, busy }) {
  return (
    <main className="gate-shell">
      <div className="ambient-grid" />
      <section className="gate-panel">
        <button type="button" className="ghost-button compact" onClick={onBack} title="Back">
          <ArrowLeft size={18} />
        </button>
        <div className="gate-orbit">
          <Wallet size={38} />
        </div>
        <p className="eyebrow">{role === "hirer" ? "Hirer access" : "Freelancer access"}</p>
        <h1>Connect MetaMask</h1>
        <button type="button" className="primary-button" onClick={onConnect} disabled={busy}>
          <Wallet size={18} />
          {busy ? "Connecting..." : "Connect Wallet"}
        </button>
        {error ? <p className="error-line">{error}</p> : null}
      </section>
    </main>
  );
}

function TopBar({
  role,
  account,
  balance,
  chainId,
  contractAddress,
  abiLoaded,
  onRefresh,
  onDisconnect,
  busy
}) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{role === "hirer" ? "Hirer dashboard" : "Freelancer dashboard"}</p>
        <h1>Decentralised Freelancing</h1>
      </div>
      <div className="wallet-strip">
        <span className="mini-pill">
          <Wallet size={14} />
          {shortAddress(account)}
        </span>
        <span className="mini-pill">
          <Coins size={14} />
          {balance} ETH
        </span>
        <span className="mini-pill">Chain {chainId || ""}</span>
        <span className={`mini-pill ${contractAddress ? "ready" : "warning"}`}>
          <LockKeyhole size={14} />
          {contractAddress ? shortAddress(contractAddress) : "No contract"}
        </span>
        <span className={`mini-pill ${abiLoaded ? "ready" : "warning"}`}>ABI {abiLoaded ? "loaded" : "missing"}</span>
        <button type="button" className="icon-button" onClick={onRefresh} disabled={busy} title="Refresh">
          <RefreshCw size={17} />
        </button>
        <button type="button" className="ghost-button" onClick={onDisconnect}>
          Disconnect
        </button>
      </div>
    </header>
  );
}

function ServiceRecord({ service, account, hireDrafts, setHireDrafts, onHire, busy }) {
  const isOwnService = service.freelancer?.toLowerCase() === account?.toLowerCase();
  const deadlineDays = hireDrafts[service.id] ?? "7";

  return (
    <article className="record service-record">
      <div className="record-head">
        <div>
          <span className="record-kicker">Service #{service.id}</span>
          <h3>{service.priceEth} ETH</h3>
        </div>
        <StatusPill status={SERVICE_STATUS[service.status]} />
      </div>
      <div className="meta-grid">
        <span>Freelancer</span>
        <strong>{shortAddress(service.freelancer)}</strong>
        <span>Rating</span>
        <strong>
          {service.ratingsCount ? `${(service.averageRatingX100 / 100).toFixed(2)} / 5` : "Unrated"}
        </strong>
        <span>Created</span>
        <strong>{formatDate(service.createdAt)}</strong>
        <span>Metadata CID</span>
        <a href={ipfsUrl(service.metadataCid)} target="_blank" rel="noreferrer">
          {service.metadataCid}
          <ExternalLink size={13} />
        </a>
      </div>
      <div className="inline-actions">
        <Field label="Deadline days">
          <input
            type="number"
            min="1"
            max="30"
            value={deadlineDays}
            onChange={(event) =>
              setHireDrafts((current) => ({ ...current, [service.id]: event.target.value }))
            }
          />
        </Field>
        <button
          type="button"
          className="primary-button"
          onClick={() => onHire(service)}
          disabled={busy || isOwnService}
          title={isOwnService ? "Cannot self-hire" : "Hire"}
        >
          <LockKeyhole size={17} />
          Hire
        </button>
      </div>
    </article>
  );
}

function JobRecord({
  job,
  mode,
  ratingDrafts,
  setRatingDrafts,
  submitDrafts,
  setSubmitDrafts,
  onConfirm,
  onCancel,
  onAutoCancel,
  onRate,
  onSubmitWork,
  busy
}) {
  const status = JOB_STATUS[job.status];
  const canClientComplete = mode === "client" && (job.status === 1 || job.status === 2);
  const canRate = mode === "client" && job.status === 3 && !job.rated;
  const canCancel = job.status === 1;
  const canSubmit = mode === "freelancer" && job.status === 1;
  const draft = submitDrafts[job.id] ?? { cid: "", hash: "" };
  const rating = ratingDrafts[job.id] ?? "5";

  function updateCid(value) {
    const clean = value.trim();
    const hash = clean ? ethers.keccak256(ethers.toUtf8Bytes(clean)) : "";
    setSubmitDrafts((current) => ({ ...current, [job.id]: { cid: value, hash } }));
  }

  function updateHash(value) {
    setSubmitDrafts((current) => ({
      ...current,
      [job.id]: { ...(current[job.id] ?? { cid: "" }), hash: value }
    }));
  }

  return (
    <article className="record job-record">
      <div className="record-head">
        <div>
          <span className="record-kicker">Job #{job.id} - Service #{job.serviceId}</span>
          <h3>{job.priceEth} ETH escrow</h3>
        </div>
        <StatusPill status={status} />
      </div>
      <div className="meta-grid">
        <span>Client</span>
        <strong>{shortAddress(job.client)}</strong>
        <span>Freelancer</span>
        <strong>{shortAddress(job.freelancer)}</strong>
        <span>Deadline</span>
        <strong>{formatDate(job.deadline)}</strong>
        <span>Deliverable hash</span>
        <strong className="hash-cell">{job.deliverableHash === ethers.ZeroHash ? "" : job.deliverableHash}</strong>
      </div>

      {canSubmit ? (
        <div className="submit-zone">
          <Field label="Deliverable CID">
            <input
              value={draft.cid}
              onChange={(event) => updateCid(event.target.value)}
              placeholder="ipfs://..."
            />
          </Field>
          <Field label="Hash">
            <input value={draft.hash} onChange={(event) => updateHash(event.target.value)} placeholder="0x..." />
          </Field>
          <button
            type="button"
            className="primary-button"
            onClick={() => onSubmitWork(job, draft.hash)}
            disabled={busy}
          >
            <Send size={17} />
            Submit
          </button>
        </div>
      ) : null}

      <div className="inline-actions">
        {canClientComplete ? (
          <button type="button" className="primary-button" onClick={() => onConfirm(job)} disabled={busy}>
            <CheckCircle2 size={17} />
            Confirm
          </button>
        ) : null}
        {canCancel ? (
          <button type="button" className="ghost-button" onClick={() => onCancel(job)} disabled={busy}>
            <Ban size={17} />
            Cancel
          </button>
        ) : null}
        {canCancel ? (
          <button type="button" className="ghost-button" onClick={() => onAutoCancel(job)} disabled={busy}>
            <Clock3 size={17} />
            Auto-cancel
          </button>
        ) : null}
        {canRate ? (
          <>
            <Field label="Rating">
              <select
                value={rating}
                onChange={(event) =>
                  setRatingDrafts((current) => ({ ...current, [job.id]: event.target.value }))
                }
              >
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
              </select>
            </Field>
            <button type="button" className="primary-button" onClick={() => onRate(job)} disabled={busy}>
              <Star size={17} />
              Rate
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}

function AuditPanel({ auditAddress, setAuditAddress, audit, onAudit, busy }) {
  return (
    <section className="panel audit-panel">
      <div className="section-title">
        <div>
          <p className="eyebrow">Audit</p>
          <h2>Fraud client check</h2>
        </div>
        <ShieldCheck size={22} />
      </div>
      <div className="audit-search">
        <Field label="Client wallet">
          <input
            value={auditAddress}
            onChange={(event) => setAuditAddress(event.target.value)}
            placeholder="0x..."
          />
        </Field>
        <button type="button" className="primary-button" onClick={onAudit} disabled={busy}>
          <ShieldCheck size={17} />
          Audit
        </button>
      </div>
      {!audit ? null : audit.openedJobs === 0 ? (
        <NoRecords />
      ) : (
        <div className="audit-output">
          <div className={`risk-ring ${audit.flagged ? "danger" : "ok"}`}>
            <strong>{audit.riskScore}</strong>
            <span>risk</span>
          </div>
          <div className="stats-grid">
            <Stat label="Opened" value={audit.openedJobs} />
            <Stat label="Active" value={audit.activeJobs} />
            <Stat label="Completed" value={audit.completedJobs} />
            <Stat label="Cancelled" value={audit.cancelledJobs + audit.autoCancelledJobs} />
            <Stat label="Escrowed" value={`${formatEth(audit.totalEscrowedWei)} ETH`} />
            <Stat label="Paid" value={`${formatEth(audit.totalPaidWei)} ETH`} />
            <Stat label="Refunded" value={`${formatEth(audit.totalRefundedWei)} ETH`} />
            <Stat label="Flagged" value={audit.flagged ? "Yes" : "No"} />
          </div>
        </div>
      )}
    </section>
  );
}

function HirerDashboard(props) {
  const {
    services,
    clientJobs,
    sortMode,
    setSortMode,
    account,
    busy,
    hireDrafts,
    setHireDrafts,
    ratingDrafts,
    setRatingDrafts,
    onHire,
    onConfirm,
    onCancel,
    onAutoCancel,
    onRate
  } = props;

  return (
    <div className="dashboard-grid hirer-grid">
      <section className="panel services-panel">
        <div className="section-title">
          <div>
            <p className="eyebrow">Marketplace</p>
            <h2>Offered services</h2>
          </div>
          <div className="segmented">
            <button
              type="button"
              className={sortMode === "newest" ? "active" : ""}
              onClick={() => setSortMode("newest")}
            >
              Newest
            </button>
            <button
              type="button"
              className={sortMode === "rated" ? "active" : ""}
              onClick={() => setSortMode("rated")}
            >
              Highest rated
            </button>
          </div>
        </div>
        {services.length === 0 ? (
          <NoRecords />
        ) : (
          <div className="record-list">
            {services.map((service) => (
              <ServiceRecord
                key={service.id}
                service={service}
                account={account}
                hireDrafts={hireDrafts}
                setHireDrafts={setHireDrafts}
                onHire={onHire}
                busy={busy}
              />
            ))}
          </div>
        )}
      </section>

      <AuditPanel {...props} />

      <GasOptimisationPanel />

      <section className="panel jobs-panel">
        <div className="section-title">
          <div>
            <p className="eyebrow">Escrow</p>
            <h2>My hires</h2>
          </div>
          <LockKeyhole size={22} />
        </div>
        {clientJobs.length === 0 ? (
          <NoRecords />
        ) : (
          <div className="record-list">
            {clientJobs.map((job) => (
              <JobRecord
                key={job.id}
                job={job}
                mode="client"
                ratingDrafts={ratingDrafts}
                setRatingDrafts={setRatingDrafts}
                submitDrafts={{}}
                setSubmitDrafts={() => {}}
                onConfirm={onConfirm}
                onCancel={onCancel}
                onAutoCancel={onAutoCancel}
                onRate={onRate}
                onSubmitWork={() => {}}
                busy={busy}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FreelancerDashboard(props) {
  const {
    myServices,
    freelancerJobs,
    offerForm,
    setOfferForm,
    submitDrafts,
    setSubmitDrafts,
    busy,
    onOfferService,
    onCancel,
    onAutoCancel,
    onSubmitWork
  } = props;

  return (
    <div className="dashboard-grid freelancer-grid">
      <section className="panel offer-panel">
        <div className="section-title">
          <div>
            <p className="eyebrow">Freelancer</p>
            <h2>List new service</h2>
          </div>
          <Plus size={22} />
        </div>
        <div className="form-grid">
          <Field label="Price ETH">
            <input
              type="number"
              min="0"
              step="0.0001"
              value={offerForm.priceEth}
              onChange={(event) => setOfferForm((current) => ({ ...current, priceEth: event.target.value }))}
              placeholder="0.25"
            />
          </Field>
          <Field label="Metadata CID">
            <input
              value={offerForm.metadataCid}
              onChange={(event) =>
                setOfferForm((current) => ({ ...current, metadataCid: event.target.value }))
              }
              placeholder="ipfs://..."
            />
          </Field>
          <button type="button" className="primary-button" onClick={onOfferService} disabled={busy}>
            <Plus size={17} />
            List
          </button>
        </div>
      </section>

      <AuditPanel {...props} />

      <GasOptimisationPanel />

      <section className="panel services-panel">
        <div className="section-title">
          <div>
            <p className="eyebrow">Portfolio</p>
            <h2>My services</h2>
          </div>
          <Star size={22} />
        </div>
        {myServices.length === 0 ? (
          <NoRecords />
        ) : (
          <div className="record-list">
            {myServices.map((service) => (
              <article className="record" key={service.id}>
                <div className="record-head">
                  <div>
                    <span className="record-kicker">Service #{service.id}</span>
                    <h3>{service.priceEth} ETH</h3>
                  </div>
                  <StatusPill status={SERVICE_STATUS[service.status]} />
                </div>
                <div className="meta-grid">
                  <span>Rating</span>
                  <strong>
                    {service.ratingsCount
                      ? `${(service.averageRatingX100 / 100).toFixed(2)} / 5`
                      : "Unrated"}
                  </strong>
                  <span>Metadata CID</span>
                  <a href={ipfsUrl(service.metadataCid)} target="_blank" rel="noreferrer">
                    {service.metadataCid}
                    <ExternalLink size={13} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel jobs-panel">
        <div className="section-title">
          <div>
            <p className="eyebrow">Escrow</p>
            <h2>Assigned jobs</h2>
          </div>
          <LockKeyhole size={22} />
        </div>
        {freelancerJobs.length === 0 ? (
          <NoRecords />
        ) : (
          <div className="record-list">
            {freelancerJobs.map((job) => (
              <JobRecord
                key={job.id}
                job={job}
                mode="freelancer"
                ratingDrafts={{}}
                setRatingDrafts={() => {}}
                submitDrafts={submitDrafts}
                setSubmitDrafts={setSubmitDrafts}
                onConfirm={() => {}}
                onCancel={onCancel}
                onAutoCancel={onAutoCancel}
                onRate={() => {}}
                onSubmitWork={onSubmitWork}
                busy={busy}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function Home() {
  const [role, setRole] = useState(null);
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [chainId, setChainId] = useState("");
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractAddress, setContractAddress] = useState("");
  const [services, setServices] = useState([]);
  const [clientJobs, setClientJobs] = useState([]);
  const [freelancerJobs, setFreelancerJobs] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [sortMode, setSortMode] = useState("newest");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [offerForm, setOfferForm] = useState({ priceEth: "", metadataCid: "" });
  const [hireDrafts, setHireDrafts] = useState({});
  const [ratingDrafts, setRatingDrafts] = useState({});
  const [submitDrafts, setSubmitDrafts] = useState({});
  const [auditAddress, setAuditAddress] = useState("");
  const [audit, setAudit] = useState(null);

  const abiLoaded = (contractArtifact.abi ?? []).length > 0;

  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) => {
      if (sortMode === "rated") {
        return b.averageRatingX100 - a.averageRatingX100 || b.createdAt - a.createdAt;
      }
      return b.createdAt - a.createdAt || b.averageRatingX100 - a.averageRatingX100;
    });
  }, [services, sortMode]);

  const resetSession = useCallback(() => {
    setAccount("");
    setBalance("");
    setChainId("");
    setProvider(null);
    setContract(null);
    setContractAddress("");
    setServices([]);
    setClientJobs([]);
    setFreelancerJobs([]);
    setMyServices([]);
    setAudit(null);
    setNotice("");
    setError("");
  }, []);

  const refreshBlockchainState = useCallback(
    async (nextContract = contract, nextAccount = account, nextProvider = provider) => {
      if (!nextContract || !nextAccount) return;
      setBusy(true);
      setError("");
      try {
        const [activeServices, clientJobRows, freelancerJobRows, freelancerServices, walletBalance] =
          await Promise.all([
            nextContract.getActiveServices(),
            nextContract.getJobsForClient(nextAccount),
            nextContract.getJobsForFreelancer(nextAccount),
            nextContract.getServicesByFreelancer(nextAccount),
            nextProvider.getBalance(nextAccount)
          ]);

        setServices(activeServices.map(normalizeService));
        setClientJobs(clientJobRows.map(normalizeJob).sort((a, b) => b.id - a.id));
        setFreelancerJobs(freelancerJobRows.map(normalizeJob).sort((a, b) => b.id - a.id));
        setMyServices(freelancerServices.map(normalizeService).sort((a, b) => b.id - a.id));
        setBalance(formatEth(walletBalance));
      } catch (caught) {
        setError(readError(caught));
      } finally {
        setBusy(false);
      }
    },
    [account, contract, provider]
  );

  async function connectWallet() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not available in this browser.");
      }
      if (!abiLoaded) {
        throw new Error("Contract ABI is missing. Run npm run compile first.");
      }

      const nextProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await nextProvider.send("eth_requestAccounts", []);
      const signer = await nextProvider.getSigner();
      const network = await nextProvider.getNetwork();
      const detectedChainId = network.chainId.toString();
      const deployment = deployments[detectedChainId];
      const walletAddress = accounts[0];
      const walletBalance = await nextProvider.getBalance(walletAddress);

      setProvider(nextProvider);
      setAccount(walletAddress);
      setBalance(formatEth(walletBalance));
      setChainId(detectedChainId);
      setAuditAddress(walletAddress);

      if (!deployment?.address) {
        setContract(null);
        setContractAddress("");
        setError(`No contract deployment found for chain ${detectedChainId}.`);
        return;
      }

      const nextContract = new ethers.Contract(deployment.address, contractArtifact.abi, signer);
      setContract(nextContract);
      setContractAddress(deployment.address);
      await refreshBlockchainState(nextContract, walletAddress, nextProvider);
    } catch (caught) {
      setError(readError(caught));
    } finally {
      setBusy(false);
    }
  }

  async function runTransaction(action, successMessage) {
    if (!contract) {
      setError("No contract deployment found for this network.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("Waiting for wallet confirmation...");
    try {
      const transaction = await action();
      setNotice("Transaction submitted...");
      await transaction.wait();
      setNotice(successMessage);
      await refreshBlockchainState();
    } catch (caught) {
      setError(readError(caught));
      setNotice("");
    } finally {
      setBusy(false);
    }
  }

  async function offerService() {
    const priceEth = offerForm.priceEth.trim();
    const metadataCid = offerForm.metadataCid.trim();
    if (!priceEth || Number(priceEth) <= 0) {
      setError("Enter a positive ETH price.");
      return;
    }
    if (!metadataCid) {
      setError("Enter an IPFS metadata CID.");
      return;
    }
    await runTransaction(
      () => contract.offerService(ethers.parseEther(priceEth), metadataCid),
      "Service listed on-chain."
    );
    setOfferForm({ priceEth: "", metadataCid: "" });
  }

  async function hireService(service) {
    const days = Number(hireDrafts[service.id] ?? "7");
    if (!Number.isFinite(days) || days < 1 || days > 30) {
      setError("Deadline must be 1 to 30 days.");
      return;
    }
    const deadline = Math.floor(Date.now() / 1000) + Math.floor(days * DAY_SECONDS);
    await runTransaction(
      () => contract.hireFreelancer(service.id, deadline, { value: service.priceWei }),
      "Service hired and escrow funded."
    );
  }

  async function submitWork(job, hash) {
    if (!BYTES32_PATTERN.test(hash || "")) {
      setError("Deliverable hash must be bytes32.");
      return;
    }
    await runTransaction(() => contract.submitWork(job.id, hash), "Deliverable hash submitted.");
  }

  async function confirmJob(job) {
    await runTransaction(() => contract.confirmCompletion(job.id), "Escrow released to freelancer.");
  }

  async function cancelJob(job) {
    await runTransaction(() => contract.cancelJob(job.id), "Job cancelled and client refunded.");
  }

  async function autoCancelJob(job) {
    await runTransaction(() => contract.autoCancelExpired(job.id), "Expired job auto-cancelled.");
  }

  async function rateJob(job) {
    const score = Number(ratingDrafts[job.id] ?? "5");
    await runTransaction(() => contract.rateFreelancer(job.id, score), "Freelancer rated.");
  }

  async function auditClient() {
    if (!contract) {
      setError("No contract deployment found for this network.");
      return;
    }
    if (!ethers.isAddress(auditAddress)) {
      setError("Enter a valid client wallet address.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await contract.auditClient(auditAddress);
      setAudit(normalizeAudit(result));
    } catch (caught) {
      setError(readError(caught));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!window.ethereum) return undefined;
    const onAccountsChanged = (accounts) => {
      if (!accounts.length) {
        resetSession();
      }
    };
    const onChainChanged = () => {
      resetSession();
    };
    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener("chainChanged", onChainChanged);
    };
  }, [resetSession]);

  if (!role) {
    return <Landing onSelectRole={setRole} />;
  }

  if (!account) {
    return (
      <WalletGate
        role={role}
        onBack={() => {
          setRole(null);
          resetSession();
        }}
        onConnect={connectWallet}
        error={error}
        busy={busy}
      />
    );
  }

  const sharedProps = {
    account,
    busy,
    auditAddress,
    setAuditAddress,
    audit,
    onAudit: auditClient,
    onCancel: cancelJob,
    onAutoCancel: autoCancelJob
  };

  return (
    <main className="app-shell">
      <div className="ambient-grid" />
      <TopBar
        role={role}
        account={account}
        balance={balance}
        chainId={chainId}
        contractAddress={contractAddress}
        abiLoaded={abiLoaded}
        onRefresh={() => refreshBlockchainState()}
        onDisconnect={resetSession}
        busy={busy}
      />

      {error ? <div className="toast error-line">{error}</div> : null}
      {notice ? <div className="toast notice-line">{notice}</div> : null}

      {role === "hirer" ? (
        <HirerDashboard
          {...sharedProps}
          services={sortedServices}
          clientJobs={clientJobs}
          sortMode={sortMode}
          setSortMode={setSortMode}
          hireDrafts={hireDrafts}
          setHireDrafts={setHireDrafts}
          ratingDrafts={ratingDrafts}
          setRatingDrafts={setRatingDrafts}
          onHire={hireService}
          onConfirm={confirmJob}
          onRate={rateJob}
        />
      ) : (
        <FreelancerDashboard
          {...sharedProps}
          myServices={myServices}
          freelancerJobs={freelancerJobs}
          offerForm={offerForm}
          setOfferForm={setOfferForm}
          submitDrafts={submitDrafts}
          setSubmitDrafts={setSubmitDrafts}
          onOfferService={offerService}
          onSubmitWork={submitWork}
        />
      )}
    </main>
  );
}

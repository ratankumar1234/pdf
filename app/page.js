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
  Flag,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Star,
  UserRound,
  Wallet,
  User,
  CheckCircle,
  Sparkles,
  Zap,
  FileText
} from "lucide-react";
import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";

import contractArtifact from "../lib/contract/DecentralisedFreelance.json";
import deployments from "../lib/deployment.json";

const SERVICE_STATUS = ["None", "Listed", "Removed"];
const JOB_STATUS = ["None", "Hired", "Submitted", "Completed", "Cancelled"];
const DAY_SECONDS = 24 * 60 * 60;
const BYTES32_PATTERN = /^0x[0-9a-fA-F]{64}$/;

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

/**
 * CREATIVE DYNAMIC SIMULATION
 * Implements moving light rays and floating nodes on light cream bg
 */
function CreativeSimulation() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <>
      <style>{`
        @keyframes sweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes floatEffect {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(40px, -60px) rotate(15deg); }
        }
        .sim-container {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: #fdfbf7; z-index: -1; overflow: hidden;
        }
        .light-beam {
          position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
          background: linear-gradient(45deg, transparent 45%, rgba(37, 99, 235, 0.05) 50%, transparent 55%);
          animation: sweep 12s infinite linear;
          pointer-events: none;
        }
        .cursor-ray {
          position: absolute; width: 800px; height: 800px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.07) 0%, transparent 70%);
          pointer-events: none; border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: top 0.1s ease-out, left 0.1s ease-out;
        }
        .moving-node {
          position: absolute; border: 1.5px solid rgba(37, 99, 235, 0.15);
          background: rgba(255,255,255,0.5); border-radius: 15px;
          animation: floatEffect 18s infinite ease-in-out;
        }
      `}</style>
      <div className="sim-container">
        <div className="light-beam" />
        <div className="cursor-ray" style={{ left: mousePos.x, top: mousePos.y }} />
        <div className="moving-node" style={{ width: '120px', height: '120px', top: '10%', left: '5%' }} />
        <div className="moving-node" style={{ width: '50px', height: '50px', bottom: '15%', right: '10%', animationDelay: '-4s' }} />
        <div className="moving-node" style={{ width: '150px', height: '150px', top: '55%', left: '35%', animationDelay: '-9s', opacity: 0.4 }} />
      </div>
    </>
  );
}

function Landing({ onSelectRole }) {
  const [hovered, setHovered] = useState(null);

  const cardBase = {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: "24px", width: "320px", height: "340px", borderRadius: "48px",
    cursor: "pointer", transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    position: "relative", overflow: "hidden", color: "white"
  };

  return (
    <main className="landing-shell" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <CreativeSimulation />
      <section style={{ textAlign: "center", zIndex: 10 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '12px 24px', background: 'white', borderRadius: '100px', marginBottom: '40px', border: '1px solid #f1f5f9', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
          <Zap size={22} color="#2563eb" fill="#2563eb" />
          <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#1e293b', letterSpacing: '1.5px' }}>ENCRYPTED PROTOCOL V1.0</span>
        </div>
        
        {/* UPDATED HEADING */}
        <h1 style={{ fontSize: "5.8rem", fontWeight: "900", color: "#0f172a", marginBottom: "16px", letterSpacing: '-4px', lineHeight: '0.95' }}>
          Work <span style={{ color: '#2563eb', fontStyle: 'italic' }}>Decentralised.</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.5rem', marginBottom: '70px', fontWeight: '400', maxWidth: '700px', marginInline: 'auto' }}>
          Secure, transparent, and trustless collaboration powered by Smart Contracts.
        </p>
        
        <div style={{ display: "flex", gap: "48px", justifyContent: "center" }}>
          {/* Hirer Card - COLORFUL BLUE */}
          <div 
            style={{ 
              ...cardBase, 
              background: "linear-gradient(145deg, #3b82f6 0%, #1d4ed8 100%)",
              transform: hovered === 'h' ? 'scale(1.08) translateY(-20px)' : 'scale(1)',
              boxShadow: hovered === 'h' ? '0 50px 100px -20px rgba(37, 99, 235, 0.6)' : '0 20px 40px -10px rgba(37, 99, 235, 0.2)'
            }}
            onMouseEnter={() => setHovered('h')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelectRole("hirer")}
          >
            <div style={{ padding: '28px', background: 'rgba(255,255,255,0.25)', borderRadius: '35px', backdropFilter: 'blur(12px)' }}>
              <BriefcaseBusiness size={55} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '2rem', fontWeight: '900', margin: 0 }}>Hire Service</h3>
              <p style={{ opacity: 0.9, fontSize: '1.1rem', marginTop: '10px' }}>Access Services</p>
            </div>
          </div>

          {/* Freelancer Card - COLORFUL ONYX */}
          <div 
            style={{ 
              ...cardBase, 
              background: "linear-gradient(145deg, #1e293b 0%, #020617 100%)",
              transform: hovered === 'f' ? 'scale(1.08) translateY(-20px)' : 'scale(1)',
              boxShadow: hovered === 'f' ? '0 50px 100px -20px rgba(15, 23, 42, 0.6)' : '0 20px 40px -10px rgba(15, 23, 42, 0.2)'
            }}
            onMouseEnter={() => setHovered('f')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelectRole("freelancer")}
          >
            <div style={{ padding: '28px', background: 'rgba(255,255,255,0.15)', borderRadius: '35px', backdropFilter: 'blur(12px)' }}>
              <UserRound size={55} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '2rem', fontWeight: '900', margin: 0 }}>Offer Service</h3>
              <p style={{ opacity: 0.85, fontSize: '1.1rem', marginTop: '10px' }}>Get paid for your skills</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function WalletGate({ role, onBack, onConnect, error, busy }) {
  return (
    <main className="gate-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <CreativeSimulation />
      <section style={{ 
        background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(40px)',
        padding: '70px', borderRadius: '60px', border: '1px solid white',
        boxShadow: '0 60px 120px rgba(0,0,0,0.06)', textAlign: 'center',
        width: '100%', maxWidth: '520px', zIndex: 10
      }}>
        <button className="ghost-button compact" onClick={onBack} style={{ marginBottom: '40px' }}><ArrowLeft size={22} /></button>
        <div style={{ 
          background: 'linear-gradient(135deg, #2563eb, #6366f1)', 
          width: '120px', height: '120px', borderRadius: '40px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          color: 'white', margin: '0 auto 35px', 
          boxShadow: '0 30px 60px rgba(37, 99, 235, 0.35)' 
        }}>
          <Wallet size={55} />
        </div>
        <h2 style={{ fontSize: '2.6rem', fontWeight: '900', color: '#0f172a', marginBottom: '15px' }}>Authorize Access</h2>
        <p style={{ color: '#64748b', fontSize: '1.2rem', marginBottom: '45px' }}>Connect MetaMask to manage your {role} assets.</p>
        <button 
          className="primary-button" 
          onClick={onConnect} 
          disabled={busy}
          style={{ width: '100%', padding: '24px', borderRadius: '24px', fontSize: '1.3rem', background: '#0f172a', fontWeight: '800', transition: '0.3s' }}
        >
          {busy ? "Signing..." : "Connect MetaMask"}
        </button>
        {error && <p className="error-line" style={{ marginTop: '28px', background: '#fef2f2', padding: '16px', borderRadius: '15px' }}>{error}</p>}
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
          {service.ratingsCount > 0 
            ? `${(service.averageRatingX100 / 100).toFixed(1)} / 5 (${service.ratingsCount} ${service.ratingsCount === 1 ? 'rating' : 'ratings'})` 
            : "Unrated"}
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

function AuditPanel({ 
  auditAddress, 
  setAuditAddress, 
  audit, 
  onAudit, 
  onFlag,
  flaggedHistory,
  busy,
  freelancerCV
}) {
  const [flagDescription, setFlagDescription] = useState("");
  const [showFlagInput, setShowFlagInput] = useState(false);

  return (
    <section className="panel audit-panel">
      <div className="section-title">
        <div>
          <p className="eyebrow">Audit & Security</p>
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

      {audit && (
        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', color: '#0f172a' }}>
            <FileText size={18} />
            <strong style={{ fontSize: '0.95rem' }}>Freelancer CV</strong>
          </div>
          {freelancerCV ? (
            <>
              <p style={{ fontSize: '0.85rem', color: '#334155', margin: '0 0 10px 0' }}>{freelancerCV.description}</p>
              <a href={ipfsUrl(freelancerCV.cid)} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#2563eb', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '5px' }}>
                View CV Document <ExternalLink size={12} />
              </a>
            </>
          ) : (
            <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>This user hasn't uploaded a CV yet.</p>
          )}
        </div>
      )}

      {!audit ? null : audit.openedJobs === 0 ? (
        <NoRecords />
      ) : (
        <div className="audit-output" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
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
            <Stat label="Avg Freelancer Rating" value="4.8 / 5" /> 
          </div>

          {!showFlagInput ? (
            <button 
              className="ghost-button" 
              style={{ marginTop: '1rem', color: '#dc2626' }}
              onClick={() => setShowFlagInput(true)}
            >
              <Flag size={16} /> Flag this user
            </button>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              <Field label="Flag Description">
                <textarea 
                  value={flagDescription}
                  onChange={(e) => setFlagDescription(e.target.value)}
                  placeholder="Why are you flagging this user?"
                  style={{ width: '100%', borderRadius: '8px', padding: '10px', minHeight: '80px' }}
                />
              </Field>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  className="primary-button danger" 
                  onClick={() => {
                    onFlag(auditAddress, flagDescription);
                    setFlagDescription("");
                    setShowFlagInput(false);
                  }}
                  disabled={!flagDescription.trim()}
                >
                  Submit Flag
                </button>
                <button className="ghost-button" onClick={() => setShowFlagInput(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flagged-history" style={{ marginTop: '1rem' }}>
        <p className="eyebrow">Recent Flagged Activities</p>
        {flaggedHistory.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: '#71717a' }}>No flagged accounts on record.</p>
        ) : (
          <div className="record-list" style={{ gap: '10px' }}>
            {flaggedHistory.map((item, idx) => (
              <div key={idx} style={{ background: '#fef2f2', padding: '12px', borderRadius: '10px', border: '1px solid #fee2e2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{shortAddress(item.address)}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 'bold' }}>Risk: {item.risk}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#4b5563', margin: '0' }}>"{item.description}"</p>
                <div style={{ marginTop: '5px', display: 'flex', gap: '10px', fontSize: '0.75rem', color: '#9ca3af' }}>
                   <span>Rating: 4.8 / 5</span>
                   <span>•</span>
                   <span>Flagged on: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FreelancerProfile({ account, myServices, freelancerJobs, balance }) {
  const completedCount = freelancerJobs.filter(j => j.status === 3).length;
  const ratedJobs = freelancerJobs.filter(j => j.rated);
  const totalRatingCount = ratedJobs.length;
  const avgRating = totalRatingCount > 0 
    ? (myServices.reduce((acc, s) => acc + s.averageRatingX100, 0) / (myServices.length * 100)).toFixed(1)
    : "Unrated";

  return (
    <section className="panel profile-panel">
      <div className="section-title">
        <div>
          <p className="eyebrow">Freelancer Dashboard</p>
          <h2>My Professional Profile</h2>
        </div>
        <User size={22} />
      </div>
      <div className="profile-card" style={{ background: '#f9fafb', padding: '20px', borderRadius: '12px', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <div style={{ background: '#2563eb', padding: '12px', borderRadius: '50%', color: 'white' }}>
            <User size={28} />
          </div>
          <div>
            <h3 style={{ margin: 0 }}>{shortAddress(account)}</h3>
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Verified Provider <CheckCircle size={12} style={{ display: 'inline', color: '#10b981', verticalAlign: 'middle' }} />
            </span>
          </div>
        </div>
        <div className="stats-grid">
          <Stat label="Total Services" value={myServices.length} />
          <Stat label="Completed Jobs" value={completedCount} />
          <Stat label="Profile Rating" value={totalRatingCount > 0 ? `${avgRating} / 5 (${totalRatingCount} ${totalRatingCount === 1 ? 'rating' : 'ratings'})` : "N/A"} />
          <Stat label="Wallet Balance" value={`${balance} ETH`} />
        </div>
      </div>
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

  const [searchId, setSearchId] = useState("");

  const filteredServices = useMemo(() => {
    if (!searchId.trim()) return services;
    const term = searchId.toLowerCase().replace("service", "").trim();
    return services.filter(s => s.id.toString() === term);
  }, [services, searchId]);

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

        <div className="audit-search mb-4" style={{ marginBottom: '1.5rem' }}>
          <Field label="Search by Service ID">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="e.service 1, service 2..."
                style={{ paddingLeft: '2.5rem' }}
              />
              <Search size={18} style={{ position: 'absolute', left: '0.75rem', color: '#71717a' }} />
            </div>
          </Field>
        </div>

        {filteredServices.length === 0 ? (
          <NoRecords label={searchId ? "No service matches that ID." : "No records found."} />
        ) : (
          <div className="record-list">
            {filteredServices.map((service) => (
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
    cvForm,
    setCvForm,
    onSaveCV,
    submitDrafts,
    setSubmitDrafts,
    busy,
    onOfferService,
    onCancel,
    onAutoCancel,
    onSubmitWork,
    account,
    balance
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
          <Field label="Metadata CID (Description)">
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

      <section className="panel cv-panel" style={{ marginTop: '1.5rem' }}>
        <div className="section-title">
          <div>
            <p className="eyebrow">Professional Identity</p>
            <h2>My CV</h2>
          </div>
          <FileText size={22} />
        </div>
        <div className="form-grid">
          <Field label="CV Document CID (IPFS)">
            <input
              value={cvForm.cid}
              onChange={(event) => setCvForm((current) => ({ ...current, cid: event.target.value }))}
              placeholder="ipfs://..."
            />
          </Field>
          <Field label="Descriptive Message">
            <textarea
              value={cvForm.description}
              onChange={(event) => setCvForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Type some descriptive message about your skills..."
              style={{ width: '100%', borderRadius: '8px', padding: '10px', minHeight: '80px', border: '1px solid #e5e7eb' }}
            />
          </Field>
          <button type="button" className="primary-button" onClick={onSaveCV} disabled={busy}>
            <CheckCircle2 size={17} />
            Update CV
          </button>
        </div>
      </section>

      <FreelancerProfile 
        account={account} 
        myServices={myServices} 
        freelancerJobs={freelancerJobs} 
        balance={balance} 
      />

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
                    {service.ratingsCount > 0
                      ? `${(service.averageRatingX100 / 100).toFixed(1)} / 5 (${service.ratingsCount} ${service.ratingsCount === 1 ? 'rating' : 'ratings'})`
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
  const [flaggedHistory, setFlaggedHistory] = useState([]);
  
  const [cvForm, setCvForm] = useState({ cid: "", description: "" });
  const [storedCVs, setStoredCVs] = useState({});

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
    setRole(null);
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

  async function handleSaveCV() {
    if (!cvForm.cid.trim()) {
      setError("Please provide a valid IPFS CID for your CV.");
      return;
    }
    setBusy(true);
    setNotice("Updating professional profile...");
    
    setTimeout(() => {
      setStoredCVs(prev => ({
        ...prev,
        [account.toLowerCase()]: { ...cvForm }
      }));
      setNotice("CV successfully updated!");
      setBusy(false);
    }, 1000);
  }

  async function handleFlag(targetAddress, description) {
    if (!description.trim()) return;
    setBusy(true);
    try {
       const newFlag = {
         address: targetAddress,
         description: description,
         risk: 85,
         date: new Date()
       };
       setFlaggedHistory([newFlag, ...flaggedHistory]);
       setNotice("User successfully flagged.");
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
    freelancerCV: storedCVs[auditAddress.toLowerCase()] || null,
    cvForm,
    setCvForm,
    onSaveCV: handleSaveCV,
    onAudit: auditClient,
    onFlag: handleFlag,
    flaggedHistory,
    onCancel: cancelJob,
    onAutoCancel: autoCancelJob,
    balance
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

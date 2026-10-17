# 🇮🇳 Apex Bank India — Online Banking System (INR)

An enterprise-grade, full-stack **Indian Online Banking System** designed with a modern fintech user experience (React, Tailwind CSS, Lucide Icons) and an ACID-compliant backend (Express.js, Node.js built-in SQLite engine).

All currency, operations, and nomenclature are fully customized for **Indian retail customers in Indian Rupees (₹ / INR)**.

---

## 🌟 Indian Banking Features

### 1. Customer NetBanking Portal
- **Dashboard & Cashflow Analytics (INR)**:
  - Real-time liquid wealth in Indian Rupees (`₹`), formatted in Lakhs and Crores.
  - Active bank account switcher, balance privacy hide/reveal eye toggle.
  - Interactive 6-month cashflow bar & area analytics.
- **IMPS, NEFT & UPI Instant Fund Transfers**:
  - Send money via **12-digit Account Number + IFSC Code** (`APEX0001021`) or **Virtual Payment Address (UPI ID)** (e.g., `priya@okhdfcbank`).
  - Live beneficiary lookup with automatic name verification.
  - 4-digit UPI / Security PIN authorization modal.
  - Official transaction receipt with NPCI UTR reference number and PDF download.
- **RuPay Contactless EMV Cards**:
  - Virtual 3D RuPay Platinum & Signature cards.
  - Instant card lock / killswitch toggle.
  - Masked CVV reveal toggle.
  - Dynamic POS & E-commerce daily limit slider (₹5,000 to ₹5,00,000).
- **Inward Deposits & ATM Cash Withdrawals**:
  - Simulated UPI infeed, NEFT corporate payroll credit, and National Financial Switch (NFS) ATM cash withdrawal.
- **Bharat BillPay (BBPS) Utilities & Recharges**:
  - Settle electricity (BESCOM, Tata Power, BSES Rajdhani), Broadband (JioFiber, Airtel Xstream), Mobile 5G recharges, and NHAI FASTag.
- **Retail Loans & Term Fixed Deposits (FD)**:
  - Interactive EMI Calculator in INR (₹50,000 to ₹50,00,000).
  - Loan application with purpose, term, and live tracking.
  - DICGC-insured Fixed Deposits (FDs) with guaranteed interest up to 8.25% APY.
- **Digital Passbook & Statements**:
  - Complete transaction ledger with UTR numbers, search filters, and printable passbook format.
- **Frequent Beneficiaries**:
  - Save bank accounts, IFSC codes, and UPI IDs for 1-click quick transfers.

### 2. Bank Branch Administration & Risk Governance
- **System Liquidity Metrics**: Real-time aggregated deposits, KYC verified customers, and NPCI ledger entries in INR.
- **Underwriting & Loan Disbursals**: 1-click **Approve & Disburse** (funds are instantly credited to the customer's account).
- **Risk Control**: Instantly freeze or unfreeze accounts to prevent fraud.
- **RBI Security Audit Trail**: Real-time audit log of logins, transfers, and administrative actions with IP tracking.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide Icons, Axios |
| **Backend** | Node.js (v24), Express.js, JWT, bcryptjs |
| **Database** | Node.js Built-in SQLite (`node:sqlite`) with WAL mode & Foreign Keys |
| **Localization** | Indian Rupees (`₹`), Indian Numbering (Lakhs/Crores), IFSC Codes, UPI |

---

## 🚀 Quick Start Guide

### 🌐 Live Public Link (Instant Online Access)

Open this live link on any smartphone or computer anywhere in the world:

👉 **[https://26c04bd62ddeff.lhr.life](https://26c04bd62ddeff.lhr.life)**

---

### Local Development:
```bash
npm run dev
```

- **Frontend NetBanking**: `http://localhost:3000`
- **Backend Core Banking API**: `http://localhost:5000`

---

### ☁️ 100% Free Permanent Cloud Deployment (Render.com)

1. Push this repository to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git branch -M main
   git push -u origin main
   ```
2. On [Render.com](https://render.com), sign in with GitHub and click **"New +" -> "Web Service"**.
3. Select your repository. It will automatically load `render.yaml`.
4. Click **Deploy**. Your permanent free link `https://<your-service>.onrender.com` will be live in 2 minutes!

---

## 🔑 Pre-Seeded Test Accounts (INR)

### 1. Verified Indian Customer (Primary Demo)
- **Name**: Aarav Sharma
- **Email**: `aarav@example.com`
- **Password**: `password123`
- **UPI PIN**: `1234`
- **PAN**: `ABCPS4821N`
- **Salary A/C**: `501004928172` (₹1,45,800.00)
- **Savings A/C**: `501004928173` (₹8,50,000.00)
- **UPI ID**: `aarav@apexbank`
- **IFSC Code**: `APEX0001021` (Branch: Connaught Place, New Delhi)

### 2. Bank Branch Administrator (Admin Portal)
- **Email**: `admin@apexbank.com`
- **Password**: `admin123`
- **Access**: Total liquidity dashboard, loan review & automated disbursal, account freeze controls.

### 3. Additional Test Beneficiaries (For Transfer Testing)
- **Priya Patel**: `501008821944` | UPI: `priya@okhdfcbank` (`priya@example.com` / `password123`)
- **Rohan Gupta**: `501007733190` | UPI: `rohan@oksbi` (`rohan@example.com` / `password123`)

*(Note: The login page includes a 1-click "1-Click Indian Demo Login" button for instant access).*

---

## 🧪 Automated End-to-End Verification

```bash
npm test
```

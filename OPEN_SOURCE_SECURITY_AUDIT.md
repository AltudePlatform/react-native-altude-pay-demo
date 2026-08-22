# Open-Source Security Audit

**Repository:** `AltudePlatform/react-native-altude-pay-demo`  
**Audit date:** 2026-08-22  
**Audited local HEAD:** `bda76c5` (`main`)  
**Compared remote-tracking head:** `374b0c9` (`origin/main`)  
**Review mode:** Local, read-only source and Git inspection

## 1. Executive summary

### Release recommendation: NO-GO

**Confidence:** High for the confirmed source and repository-hygiene findings;
medium for the absence of undiscovered historical secrets because a dedicated
full-history secret scanner was not run.

This repository should not be made public with its current tree or Git history.
The most important reasons are:

1. An explicitly unapproved `AltudePay-0.1.0.tgz` archive is tracked in the
   current tree and appears at 11 or more historical points.
2. Approximately 35 MB of compiled bundles, logs, debug screenshots, UI dumps,
   and generated artifacts are tracked, including stale source and device logs
   inside the tarball.
3. The available history contains agent-host checkpoint commits and repeated
   copies of the prohibited artifacts. Publishing the current history would
   expose unnecessary internal workflow metadata and permanently retain the
   artifacts.
4. The application is intended to support mainnet, but it stores the wallet
   private key unencrypted in AsyncStorage. This is not an acceptable
   production-wallet design.
5. The build intentionally embeds the deployment's Altude API key into the
   mobile JavaScript bundle. A mobile binary cannot keep that value secret.
   Server-side sponsorship policy, authentication, quotas, and revocation must
   therefore make an extracted key safe; those controls are not verifiable in
   this repository.
6. Transaction writes and some reads follow API-key-scoped configuration, but
   reachable history, receipt, confirmation, token-mint, and token-account
   bootstrap paths use independent devnet defaults. On mainnet this can report
   a transferred payment as pending or absent, query the wrong mint, or fail
   account setup.
7. Direct RPC clients use `RpcUrl` without the transaction configuration's RPC
   bearer `Token`, do not refresh using `TokenExpiration`, and do not retry once
   after an RPC authentication failure. This can break API-key-scoped private
   RPC access.
8. Documentation contains contradictory devnet-only claims and stale references
   to a personal-branch Android SDK snapshot and a non-existent instrumented
   test.

The local pattern-based review did not identify a real committed credential.
`.env` was not found in locally available history, and the compiled bundles and
tarball did not contain an API key. This is encouraging but is not a substitute
for an exhaustive scanner over the final publishable history.

No security review can guarantee the absence of vulnerabilities. This report
describes the evidence available in this clone and the checks actually
performed.

## 2. Repository and architecture map

### Technology and components

- React Native 0.82, React 19, and TypeScript mobile application.
- npm 11.8.0 is declared as the package manager; a `package-lock.json` and a
  stale `pnpm-workspace.yaml` are both present.
- Android native host under `android/`. No iOS project was present in the
  reviewed tree.
- Zustand stores wallet state; AsyncStorage persists wallet, profile, history,
  preferences, and balance cache.
- TanStack Query manages remote/balance state.
- `@altude/core` creates the wallet mnemonic/keypair.
- `@altude/gasstation` retrieves configuration, balances, history, constructs
  payment transactions, obtains sponsorship, and relays signed transactions.
- `@solana/kit` and `@solana-program/token` provide direct RPC and token-account
  operations.
- `react-native-vision-camera` scans Solana payment QR codes.

### Sensitive flows and trust boundaries

1. `generateDemoWallet()` creates a 12-word mnemonic and derives an Ed25519
   keypair on the device. The mnemonic is not returned, but the private key is
   converted to hex.
2. `saveWallet()` serializes the public and private key together into
   AsyncStorage. `buildSigner()` reconstructs the private-key bytes and signs
   transaction messages locally.
3. Babel reads `ALTUDE_API_KEY` and `ALTUDE_NETWORK` from `.env` and replaces
   matching `process.env` expressions with string literals in non-test bundles.
4. The app sends the API key as `X-API-Key` to `https://api.altude.so`.
5. API-key-scoped transaction configuration supplies `RpcUrl`, RPC bearer
   `Token`, `TokenExpiration`, `FeePayer`, and `RpcEnvironment`.
6. The Gas Station SDK receives the API key and a network derived from
   `RpcEnvironment`. The user signs locally; the relay supplies sponsorship and
   submits the transaction.
7. Several direct RPC reads bypass that configuration and use the public devnet
   URL. Other direct RPC calls use `RpcUrl` but omit RPC bearer authorization.
8. QR codes and typed recipient/amount values are untrusted device input.
   Address validation decodes base58 and requires 32 bytes; the scanner accepts
   a constrained `solana:` URI and passes only recipient/amount navigation
   parameters.
9. Altude API JSON and Solana RPC JSON are external input. Parsing is generally
   explicit; no reachable `eval`, WebView, arbitrary URL fetch, or unsafe
   deserialization path was found.

### Public endpoints and external services

- `https://api.altude.so`
- RPC endpoints returned by Altude transaction configuration
- Hardcoded `https://api.devnet.solana.com`
- Solscan links
- Dead, unreferenced `http://localhost:54363` faucet module
- Ankr devnet RPC in an opt-in integration script

### Unverified assumptions

- Server-side Gas Station authentication, authorization, instruction policy,
  rate limits, per-key/per-user quotas, allowlists, replay defenses, and
  sponsorship limits are not in this repository.
- Organization-level GitHub settings, secrets, branch protections, and private
  refs are not visible locally.
- Whether every remote ref intended for publication exists in this clone is
  unknown.
- Brand/trademark approval and a complete third-party license inventory require
  owner or counsel confirmation.

## 3. Release blockers

- [ ] Remove `AltudePay-0.1.0.tgz` from the tree and all publishable history.
- [ ] Remove generated bundles, logcat files, debug screenshots, and UI dumps.
- [ ] Create a curated publishable history without agent-host checkpoints or
      stale branches.
- [ ] Move wallet private-key persistence to Android Keystore-backed secure
      storage, or prevent mainnet/real-fund use until secure storage exists.
- [ ] Establish a safe public-client credential and sponsorship-abuse model;
      never describe the embedded API key as secret.
- [ ] Make RPC URL, RPC authorization, expiry refresh, fee payer, and cluster
      derive from API-key-scoped transaction configuration in every production
      path.
- [ ] Remove devnet-only payment mint, RPC, and bootstrap assumptions from
      mainnet-capable paths.
- [ ] Correct the README and remove private/stale Android snapshot references.
- [ ] Run independent full-history secret, dependency, and license scans on the
      final curated history.

## 4. Findings table

### APAY-001 - Unapproved packaged source archive is tracked

- **Severity:** High
- **Confidence:** High
- **Category:** CWE-200 / repository release integrity
- **Status:** Confirmed
- **Evidence:** `AltudePay-0.1.0.tgz` is tracked (159,147 bytes). It appears in
  at least commits `a7fc4a0`, `2117c0b`, `c607c63`, `0dc4e85`, `b9842b3`,
  `1a78520`, `0aca8a8`, `f5893bf`, `385eb79`, `354e496`, `88e662e`, and
  `1126d79`. Its members include stale/deleted source and
  `package/android/blackscreen-log.txt`.
- **Scenario:** A public clone exposes an unapproved, stale app snapshot and
  invites consumers to install or redistribute it instead of the reviewed
  source.
- **Impact:** Unauthorized redistribution, supply-chain confusion, stale-code
  deployment, and low-sensitivity device-log disclosure.
- **Remediation:** Delete the archive; add `*.tgz` to `.gitignore`; create a
  clean publishable history that never contains the object.
- **Rotation/history/legal:** No credential rotation indicated. History rewrite
  or clean-root publication is required. Redistribution approval is a legal
  gate.
- **Verification:** No `.tgz` in `git ls-files`; no archive object or path in
  any ref on the public remote.

### APAY-002 - Compiled and debug artifacts are tracked

- **Severity:** High (release integrity), Low (direct confidentiality)
- **Confidence:** High
- **Category:** CWE-200 / security misconfiguration
- **Status:** Confirmed
- **Evidence:** `.tmp-altude-npm-check/startup.bundle` is about 6.5 MB;
  `android/latest.bundle` is about 13 MB; 63 PNG files total about 16.3 MB;
  `android/blackscreen-log.txt` and `android/latest-logcat.txt` total about
  0.8 MB; UI XML dumps are also tracked.
- **Scenario:** Generated bundles drift from source and may preserve build-time
  configuration after source cleanup. Logs and screenshots expose internal
  device/runtime/UI state.
- **Impact:** Repository bloat, confusing release provenance, avoidable
  information disclosure, and future risk of compiled credential retention.
- **Remediation:** Remove all non-curated generated/debug artifacts. Keep only
  deliberate documentation images and launcher resources. Add precise ignore
  rules for `.tmp-altude-npm-check/`, `*.bundle`, tarballs, logs, dumps, and
  Android debug screenshots.
- **Rotation/history/legal:** No current secret was found in the artifacts.
  Clean history is required.
- **Verification:** Inventory the final tree and scan every remaining binary
  before publication.

### APAY-003 - Current Git history is unsuitable for publication

- **Severity:** High
- **Confidence:** High
- **Category:** Repository release integrity
- **Status:** Confirmed
- **Evidence:** Locally available refs include agent/copilot branches and
  commits named `Agent host session <uuid> - turn N`; prohibited artifacts
  recur in checkpoint commits.
- **Scenario:** Mirroring the repository publishes internal workflow metadata,
  stale branches, and every retained artifact even if HEAD is cleaned.
- **Impact:** Permanent unnecessary disclosure and an unreviewable public
  provenance chain.
- **Remediation:** Select the canonical source, curate it privately, then create
  a new root history (or equivalent verified filter-repo rewrite). Push only
  intended branches and tags to a new public remote.
- **Rotation/history/legal:** History cleanup is required.
- **Verification:** Clean-room clone the candidate public remote, enumerate all
  refs and objects, and repeat secret/artifact scans.

### APAY-004 - Wallet private key is persisted unencrypted

- **Severity:** High
- **Confidence:** High
- **Category:** CWE-312, CWE-922; OWASP MASVS-STORAGE
- **Status:** Confirmed
- **Evidence:** `src/services/solana.ts:433-436` returns the private key as hex.
  `src/services/storage.ts:143-165` serializes and restores it in AsyncStorage.
  `src/services/solana.ts:440-447` reconstructs it for signing.
- **Scenario:** Malware, a compromised/debuggable device, rooted-device access,
  an insecure device transfer, or a local forensic extraction obtains the
  AsyncStorage database and drains a mainnet wallet.
- **Impact:** Irreversible loss of user funds and contradiction of safe
  production-wallet expectations. Local signing does not mitigate insecure
  key storage.
- **Remediation:** Store signing keys using an Android Keystore-backed signer
  with non-exportable key material where supported, device authentication, and
  explicit lifecycle/backup/recovery behavior. Avoid returning or persisting a
  raw private key. Until then, enforce a clear technical devnet-only/no-real-
  funds gate rather than relying only on documentation.
- **Rotation/history/legal:** Existing locally generated demo wallets should be
  treated as disposable if used on an untrusted build. No repository history
  rewrite is required for generated user keys.
- **Verification:** Device tests demonstrate no raw key in AsyncStorage, logs,
  backups, snapshots, or JS-accessible persistence; negative tests cover
  locked/authentication-failed states.

### APAY-005 - Mobile bundle embeds an extractable sponsorship API key

- **Severity:** High for production deployment; Informational for repository
  secret exposure
- **Confidence:** High for extraction, Medium for exploitability
- **Category:** CWE-798 / OWASP API4 Unrestricted Resource Consumption
- **Status:** Confirmed design; server controls need manual verification
- **Evidence:** `babel.config.js:4-15` loads `ALTUDE_API_KEY` from `.env`, and
  `babel.config.js:30-51` replaces `process.env.ALTUDE_API_KEY` with a string
  literal in non-test bundles. `src/services/altudeApi.ts:49-53` uses it as
  `X-API-Key`; `src/services/gasstationAdapter.ts:93-99` provides it to the SDK.
- **Scenario:** An attacker downloads a production APK/bundle, extracts the API
  key, and calls Gas Station endpoints directly to consume sponsored fees,
  enumerate permitted data, or exhaust tenant quotas.
- **Impact:** Sponsorship-fund loss, infrastructure cost, denial of service,
  tenant attribution errors, and key revocation disrupting every deployed app.
- **Remediation:** Treat mobile API keys as public identifiers, not secrets.
  Require server-enforced transaction policy, instruction/account validation,
  narrow scopes, per-user authentication, quotas, rate limits, allowlists,
  anomaly detection, rapid revocation, and key rotation. Prefer issuing
  short-lived user/session authorization rather than relying on a static
  tenant key for privileged sponsorship.
- **Rotation/history/legal:** No Altude key was found in the reviewed tree or
  local history. Any key used in a distributed build must be evaluated and
  rotated according to exposure policy.
- **Verification:** Independently extract the key from a test release and prove
  that unauthorized or over-quota sponsorship requests are rejected server-
  side. This requires an approved server-side assessment.

### APAY-006 - Mainnet confirmation and history query devnet

- **Severity:** High
- **Confidence:** High
- **Category:** CWE-436 / data-integrity and payment-state failure
- **Status:** Confirmed
- **Evidence:** `src/services/solana.ts:29` defines the public devnet RPC.
  `getAccountHistory()` uses it at line 41; `getSignatureHistory()` at line 82;
  `getTransactionStatus()` falls back to it at line 702.
  `src/hooks/usePayment.ts:79` calls `waitForTransactionConfirmation()` without
  an RPC URL.
- **Scenario:** Gas Station submits a mainnet payment, but the app polls devnet.
  The signature is never found and the app records/displays the transferred
  payment as pending or absent.
- **Impact:** Users may repeat payments, believe funds were not transferred, or
  lose reliable records of a real mainnet transfer.
- **Remediation:** Pass the API-key-scoped RPC transport into all history,
  receipt, and confirmation paths. Remove public-network fallback behavior from
  production code. Fail explicitly when valid RPC configuration is unavailable.
- **Rotation/history/legal:** None.
- **Verification:** Tests use distinct devnet/mainnet transports and prove every
  post-send read uses the same resolved environment as the send.

### APAY-007 - Direct RPC clients omit RPC JWT and expiry handling

- **Severity:** High
- **Confidence:** High
- **Category:** CWE-287 / API authentication and availability
- **Status:** Confirmed
- **Evidence:** `src/services/altudeApi.ts:124-149` parses `Token` and
  `TokenExpiration`, but `src/services/altudeApi.ts:253-255` creates an RPC
  client from only `RpcUrl`. `src/services/solana.ts:389-395` likewise creates
  and caches RPC clients by URL only. No RPC `Authorization` header, token-
  expiry refresh, or single safe retry after authentication failure was found.
- **Scenario:** The API key resolves to an authenticated/private RPC. Blockhash,
  history, or confirmation calls fail because the JWT is absent or stale.
  URL-only caching can retain a transport beyond token expiry.
- **Impact:** Transaction creation and status checks fail unpredictably,
  especially after token expiry; developers may add unsafe public-RPC
  fallbacks.
- **Remediation:** Build an authenticated RPC transport using `RpcUrl` unchanged
  and `Authorization: Bearer <Token>`. Cache configuration only until its
  expiry, refresh before expiration, and retry at most once after an RPC
  authentication failure when safe. Reject missing/invalid URL or JWT; never
  fall back to a public endpoint.
- **Rotation/history/legal:** None.
- **Verification:** Unit tests assert `X-API-Key` on config fetch, exact `RpcUrl`,
  bearer authorization, pre-expiry refresh, one safe auth retry, and absence of
  public RPC fallbacks.

### APAY-008 - Payment mint and bootstrap use a second devnet configuration

- **Severity:** High
- **Confidence:** High
- **Category:** CWE-15 / payment correctness
- **Status:** Confirmed
- **Evidence:** `src/config/paymentConfig.ts:1-5` defaults to devnet USDC.
  `src/config/apiConfig.ts:4-5` defaults `ALTUDE_NETWORK` to devnet.
  `src/services/solana.ts:520-547` rejects non-devnet bootstrap and uses the
  hardcoded devnet RPC. `src/services/solana.ts:675-680` queries the configured
  mint through Gas Station.
- **Scenario:** A mainnet API key is used without a separate build-time mint or
  network override. Balance, transfer, and account-bootstrap behavior targets
  the wrong asset/network.
- **Impact:** Failed transfers, incorrect balances, account setup failure, or
  payment in an unintended token.
- **Remediation:** Keep the Altude transaction configuration as the sole cluster
  authority. Resolve the supported payment asset through an explicit validated
  cluster-to-mint mapping or a dedicated server payment-asset contract. Do
  **not** use transaction config `Token` as the mint; it is the RPC JWT. Validate
  mint, decimals, token program, and associated token account before signing.
- **Rotation/history/legal:** None.
- **Verification:** Tests cover supported assets on devnet and mainnet and
  reject mismatched cluster/mint/token-program combinations.

### APAY-009 - Development fallback can report a nonexistent payment as confirmed

- **Severity:** Medium
- **Confidence:** High
- **Category:** CWE-345 / data-integrity failure
- **Status:** Confirmed
- **Evidence:** `src/services/gasstationAdapter.ts:6-11` enables fallback send
  whenever `__DEV__` is true; lines 68-79 return `MOCK_SIG_*`.
  `src/services/solana.ts:689-700` treats that prefix as confirmed without RPC.
- **Scenario:** A developer tests a real API/network configuration using a dev
  build; a dependency or service failure produces a mock signature and a
  successful UI even though no payment exists.
- **Impact:** False assurance, invalid receipts, unsafe testing, and deployment
  mistakes.
- **Remediation:** Isolate mock adapters from production modules. Require an
  explicit mock build flavor, visibly label mock transactions, and make release
  builds incapable of compiling or executing the bypass.
- **Rotation/history/legal:** None.
- **Verification:** Release-bundle scan contains no `MOCK_SIG_` confirmation
  path; integration tests fail closed when Gas Station is unavailable.

### APAY-010 - Production paths log transaction and wallet metadata

- **Severity:** Low
- **Confidence:** High
- **Category:** CWE-532
- **Status:** Confirmed
- **Evidence:** Unguarded full-object logging occurs in
  `src/services/solana.ts:286`,
  `src/services/gasstationAdapter.ts:122-129`, and
  `src/services/altudeHistory.ts:79`, with related screen logs.
- **Scenario:** Device log collection or support tooling retains wallet
  addresses, signatures, transaction metadata, and API response details.
- **Impact:** Privacy leakage and unnecessary operational exposure.
- **Remediation:** Remove full-object logs or gate minimal, redacted logs behind
  a non-production debug facility. Never log credentials, tokens, private keys,
  raw signed transactions, or profiles.
- **Verification:** Static log review plus release-device logging test.

### APAY-011 - README is contradictory and exposes stale private integration details

- **Severity:** Medium
- **Confidence:** High
- **Category:** Documentation / supply-chain safety
- **Status:** Confirmed
- **Evidence:** `README.md:28`, `README.md:35`, `README.md:44`, and
  `README.md:224-226` describe devnet-only operation, while
  `README.md:50-52` and `README.md:94-97` say cluster/RPC/fee payer derive from
  the API key. `README.md:231-250` references a personal-branch JitPack
  `chen~pay-demo-02-SNAPSHOT` Android SDK and a non-existent instrumented test
  with a static demo key. No matching Android test or dependency exists in the
  reviewed branch heads.
- **Scenario:** Integrators follow stale coordinates or assume mainnet paths
  are safe despite devnet-only implementation details.
- **Impact:** Dependency confusion, broken builds, unsafe deployment, and
  misleading security/custody claims.
- **Remediation:** Document server-authoritative network selection; state that
  the code is unaudited and should not hold real funds until the blockers are
  resolved; remove stale/private snapshot and test references; document the
  extractable-client-key and secure-storage requirements.
- **Verification:** Every README claim is traced to current source and immutable
  public dependency coordinates.

### APAY-012 - Open-source metadata and policy files are incomplete

- **Severity:** Low
- **Confidence:** High
- **Category:** Open-source/legal readiness
- **Status:** Confirmed
- **Evidence:** `LICENSE` contains MIT terms, but `package.json` lacks `license`,
  `author`, and `repository`; no complete third-party notice/license inventory
  was found; vulnerability-reporting and contribution policy require review.
  `pnpm-workspace.yaml` conflicts with the declared npm workflow and
  `@altude/core` version.
- **Scenario:** Automated tooling cannot establish package license/provenance,
  contributors lack a safe reporting path, and users receive ambiguous package
  manager instructions.
- **Impact:** Compliance uncertainty and poor vulnerability intake.
- **Remediation:** Add accurate package metadata, `SECURITY.md`,
  `CONTRIBUTING.md`, code of conduct, supported-version policy, and a verified
  third-party notice. Select one package manager and remove stale overrides.
- **Rotation/history/legal:** Counsel should confirm asset/font/image
  provenance, trademarks, and the desired contributor agreement/DCO model.
- **Verification:** License scanner and counsel/owner checklist pass on the
  curated tree.

### APAY-013 - Release Android build uses the debug signing configuration

- **Severity:** Informational for source-only release; High if binaries ship
- **Confidence:** High
- **Category:** Mobile release security
- **Status:** Confirmed
- **Evidence:** `android/app/build.gradle:101-104` configures release with the
  debug signing config. No keystore was tracked.
- **Scenario:** A downstream party mistakes the template release build for a
  distributable store artifact.
- **Impact:** Insecure/invalid update and distribution expectations.
- **Remediation:** Document that source consumers must configure their own
  protected release signing. Prevent official binary publication with debug
  signing.
- **Verification:** Any distributed APK/AAB is signed by the approved release
  identity and passes artifact provenance checks.

## 5. Secret and Git-history inventory

### No credential found in the reviewed local data

- No committed `.env` was found through local history path searches.
- Pickaxe search for `ALTUDE_API_KEY=` found no commit.
- Source searches found only the synthetic `test-api-key` in tests.
- Regex inspection of `startup.bundle` and `latest.bundle` found the Altude
  base URL but no API key literal.
- Text members of `AltudePay-0.1.0.tgz` contained only the synthetic test key.
- No tracked `.keystore`, `.jks`, `.p12`, `.pfx`, `.pem`, `.key`, `.apk`, or
  `.env` file was found.

### Action required

- **Rotate/revoke now:** No repository credential was identified.
- **Rewrite/replace history:** Required for the tarball, generated/debug
  artifacts, and agent-host metadata.
- **Owner verification:** Confirm whether any non-reviewed build ever embedded a
  real Altude API key. Treat any key in a distributed APK/bundle as extractable.
- **Independent rescan:** Required on the final public candidate using a
  dedicated full-history scanner. The current review was pattern-based and did
  not exhaustively entropy-scan every blob.

### Personal data

Onboarding accepts email or phone data and stores it locally in AsyncStorage.
No network sink or corresponding log was found. For a production-capable app,
document retention/deletion behavior and move sensitive profile data to storage
appropriate to its sensitivity.

## 6. Solana and payment threat model

### Assets

- User signing key and wallet funds
- Altude API key and tenant identity
- RPC JWT and RPC capacity
- Sponsored fee-payer funds
- Recipient, amount, mint, token account, transaction, signature, and receipt
- Local profile and payment history

### Actors

- Legitimate user and integrator
- Malicious QR/payment requester
- Malicious app repackager
- Extracted-API-key abuser
- Compromised/rooted device or malicious local app
- Malicious or compromised RPC
- Malicious fork or untrusted contributor
- Altude API/Gas Station and Solana validators as external trust domains

### Principal abuse cases and required mitigations

- **Key theft:** Use Keystore-backed signing and avoid raw JS-persisted keys.
- **API-key extraction and sponsorship drain:** Assume extraction; enforce
  server authorization, instruction/account policy, quotas, allowlists, and
  anomaly response.
- **Wrong recipient/amount:** Preserve strict address/amount validation and show
  recipient, token, amount, cluster, sponsorship, and signer responsibility
  immediately before signing.
- **Network confusion:** Use one API-key-scoped source for RPC URL, token, fee
  payer, and cluster; validate payment asset against that cluster.
- **Relay mutation:** The client and SDK must bind the displayed intent to the
  bytes the user signs; the server must reconstruct and independently validate
  sponsored transactions.
- **Replay/duplicate payment:** Avoid automatic relay resubmission after
  ambiguous failure; use explicit user retry and server idempotency/policy.
- **False confirmation:** Verify the submitted signature on the same configured
  cluster and inspect transaction error/finality rather than trusting a
  signature or mock prefix.
- **Token substitution:** Validate mint, decimals, token program, associated
  token accounts, owners, recipients, and unsupported Token-2022 behavior.
- **Stale blockhash:** Fetch immediately before final construction/signing.
- **RPC auth expiry:** Refresh before `TokenExpiration`; retry once only when
  safe after authentication failure.

The server-side sponsorship controls are essential and were not available for
review. The public client cannot enforce them against an attacker who calls the
API directly.

## 7. Dependency and supply-chain assessment

- `@altude/core` 0.1.1 and `@altude/gasstation` 2.1.0 resolve from public npm
  with lockfile integrity values. Spot checks indicate MIT licensing.
- No resolved `git+`, `http:`, `file:`, or `link:` dependency was found.
- `postinstall` runs `patch-package`. The tracked
  `react-native-screens+4.27.0.patch` changes a React type and showed no
  suspicious executable content.
- `smoke:startup` and `test:devnet-live` are opt-in scripts. The devnet
  integration script is guarded by `RUN_DEVNET_INTEGRATION=1` and was not run.
- Android repositories are limited to Google and Maven Central in the reviewed
  tree; the README's JitPack snapshot is not implemented.
- Dependency CVEs were **not verified** because `npm audit` requires network
  access and was not approved/run.
- A complete transitive license inventory was **not verified**.

## 8. CI/CD and untrusted-contributor assessment

No workflow is present on the reviewed `main` or `origin/main`. A workflow on an
agent branch uses `pull_request`, read-only contents permission, and official
version-tagged checkout/setup-node actions without referenced secrets. That
design is fork-safe, but its referenced boundary-check scripts are absent from
main and it cannot be treated as an active control.

Before accepting untrusted pull requests:

- Add CI from a curated branch with explicit least-privilege permissions.
- Do not use `pull_request_target` to run fork code.
- Do not expose deployment/API keys to fork jobs.
- Pin third-party actions to immutable commit SHAs.
- Separate untrusted checks from protected deployment/release environments.
- Treat caches and artifacts as untrusted across privilege boundaries.
- Add secret, dependency, license, type, lint, unit, and production-build gates.

## 9. Code-quality and completeness assessment

Strengths include local signing, defensive address parsing, clear service
separation, failure on unsupported RPC environments in the SDK adapter, and
tests around API headers, bootstrap behavior, Solana utilities, screens, and
navigation.

Release-relevant gaps:

- Devnet and mainnet configuration are inconsistent across services.
- Authenticated RPC transport and token refresh are incomplete.
- Wallet persistence is unsuitable for mainnet funds.
- Mock confirmation logic resides in production modules.
- Transaction/history objects are logged without a production guard.
- `src/services/faucet.ts` is dead cleartext localhost code.
- `HomeScreen.tsx` contains disabled history logic in favor of direct devnet RPC.
- Main and `origin/main` diverge; local main contains direct HTTP API code that
  is absent on `origin/main`. The canonical publication source must be selected
  before remediation.
- No negative test evidence was found for extracted API-key abuse, sponsorship
  policy, wrong-cluster confirmation, token substitution, RPC JWT expiry,
  secure-key storage, or mock-path exclusion from release builds.

## 10. Open-source and legal readiness checklist

- [x] MIT `LICENSE` file present.
- [ ] Add matching `package.json` license, author, and repository metadata.
- [ ] Remove prohibited tarball from tree and publishable history.
- [ ] Verify every image, icon, font, copied snippet, and generated asset.
- [ ] Generate and review a complete third-party license inventory/NOTICE.
- [ ] Remove personal-branch/private snapshot references.
- [ ] Confirm Altude trademark and brand-use approval.
- [ ] Add `SECURITY.md` with a safe private reporting channel and supported
      versions.
- [ ] Add contribution and conduct policies; decide DCO/CLA requirements.
- [ ] Add accurate unaudited-code, real-funds, custody, API-key exposure, and
      deployment warnings.
- [ ] Obtain counsel review for provenance, trademark, and contributor policy.

This section is an engineering readiness assessment, not legal advice.

## 11. Test and tool results

### Verified with local read-only inspection

Representative commands used:

```text
git log --oneline --all --decorate
git branch -a
git show-ref
git for-each-ref
git ls-files
git log --all --oneline -- AltudePay-0.1.0.tgz
git log --all --diff-filter=D --name-only
git log --all -S'ALTUDE_API_KEY='
git grep -nEI '<secret-patterns>'
git ls-tree -r <ref>
git cat-file -e origin/main:src/services/altudeApi.ts
tar -tzf AltudePay-0.1.0.tgz
```

PowerShell regex searches were also used locally against the two compiled
bundles and logcat files. One `ConvertFrom-Json` attempt failed because the
lockfile contains an empty-string root key; targeted text inspection was used
instead. No repository code or artifact was executed.

### Not verified

- Clean lockfile installation
- `npm audit`
- Dedicated full-history gitleaks/trufflehog scan
- Type checking, linting, unit/integration/end-to-end tests
- Production bundle/build
- Android runtime/device behavior
- Container scan (not applicable unless container config is later added)
- Complete license scan
- Server-side Gas Station and sponsorship policy

### Proposed gated commands

Run only after reviewing tool provenance and approving network access:

```powershell
npm ci --ignore-scripts
npm audit --audit-level=moderate
npx gitleaks detect --source . --log-opts="--all"
npx trufflehog git file://. --only-verified
npm run type-check
npm run lint
npm test -- --runInBand
npm run build
```

Before using `npx`, prefer preinstalled, checksum-verified binaries or pinned
versions rather than downloading latest packages implicitly. Inspect
`package.json` again before running scripts. The actual script names must be
confirmed against the canonical branch; unavailable scripts should be reported
as unavailable, not passed.

## 12. Prioritized remediation plan

### P0 - Required before the repository becomes public

1. **Select canonical source (S).** Decide whether local `main`,
   `origin/main`, or a reviewed integration branch is authoritative.
2. **Remove prohibited/generated artifacts (S).** Delete the tarball, bundles,
   logs, UI dumps, and debug screenshots; add precise ignore rules.
3. **Secure wallet keys (L).** Replace raw AsyncStorage private-key persistence
   with a Keystore-backed signer. Until complete, technically restrict the app
   to devnet and prevent real-fund claims.
4. **Define public-client API security (M, external dependency).** Verify or add
   server policy, user/session authorization, rate limits, quotas, instruction
   validation, monitoring, and revocation suitable for an extractable key.
5. **Fix authoritative RPC configuration (M).** Use `RpcUrl` plus RPC bearer
   `Token`, expiry refresh, and bounded auth retry everywhere; remove public RPC
   fallbacks.
6. **Fix cluster/payment consistency (M).** Route confirmation/history through
   configured RPC and validate a network-correct mint/token program.
7. **Correct public documentation (S).** Remove stale/private references and
   accurately describe mainnet capability, unaudited risk, key storage, and
   client-key extraction.
8. **Create clean publishable history (M).** After the tree is fixed, create a
   clean root history or verified equivalent and publish only curated refs.
9. **Independent clean-room scan (M).** Clone the candidate remote and run full
   history secret, dependency, license, and artifact scans.

Dependencies: item 1 precedes all source fixes. Items 2-7 precede item 8. Item 8
precedes item 9. Public release is blocked until every P0 item passes.

### P1 - Required before third-party deployments or contributions

1. **Isolate mock behavior (S).**
2. **Remove/redact production logging (S).**
3. **Delete or deliberately gate the dead faucet module (S).**
4. **Add security-critical negative and integration tests (M).**
5. **Add fork-safe least-privilege CI with immutable action pins (M).**
6. **Complete package metadata and vulnerability-reporting policy (S).**
7. **Configure protected release signing for any distributed binary (M).**

### P2 - Recommended hardening

1. Add transaction-intent review UI that explicitly shows cluster, token,
   recipient, amount, sponsorship, and signer responsibility (M).
2. Add privacy retention/deletion controls for local profile and history (S).
3. Add SBOM generation, provenance attestations, and dependency update policy
   (M).
4. Add abuse monitoring and tested incident-response/key-revocation playbooks
   (M).

## 13. Publication procedure

1. Select and freeze the canonical private source branch.
2. Inventory every API key ever used in local, CI, test, preview, and release
   builds. Rotate/revoke keys that appeared in distributed artifacts; verify
   server policy before issuing replacements.
3. Complete P0 code, documentation, metadata, and artifact cleanup privately.
4. Create a new curated root history or perform a verified history rewrite.
   Do not mirror agent refs, stale branches, or old tags.
5. Run independent full-history secret and prohibited-artifact scans.
6. Create a clean-room clone and repeat tree, history, dependency, license,
   type, lint, test, and production-build gates.
7. Validate CI with an untrusted fork PR and prove no protected secret or
   deployment permission is available.
8. Complete license/attribution, trademark, asset-provenance, and contributor-
   policy review with the appropriate owners/counsel.
9. Obtain application-security, Altude API/Gas Station, product, legal, and
   repository-owner approvals.
10. Publish only the curated branch and intended tags.
11. Monitor secret-scan alerts, sponsorship abuse, dependency advisories, and
    vulnerability reports after publication. Maintain a documented triage,
    revocation, patch, disclosure, and release process.

## 14. Final release gate

- [ ] No prohibited archive, compiled bundle, log, debug screenshot, UI dump,
      credential, customer data, or private reference exists in any public ref.
- [ ] Full-history scanner passes on a clean-room clone.
- [ ] Wallet keys are protected for mainnet use or mainnet is technically
      disabled.
- [ ] Extracted client API keys cannot authorize unsafe or unbounded
      sponsorship.
- [ ] RPC URL, bearer token, expiry, fee payer, and cluster come only from
      API-key-scoped configuration.
- [ ] Mainnet and devnet payment asset, history, confirmation, and bootstrap
      tests pass.
- [ ] Mock/fallback confirmation is absent from release builds.
- [ ] Dependency, license, type, lint, test, and production-build gates pass.
- [ ] Fork CI exposes no protected secret or elevated permission.
- [ ] README, security policy, license metadata, notices, and warnings match the
      reviewed implementation.
- [ ] Human application-security, API/Gas Station, product, legal, and owner
      approvals are recorded.

**Safe to publish now: NO**  
**Safe for others to deploy in production: NO**  
**Safe to accept untrusted pull requests with current CI: NO**

**Remaining uncertainty:** exhaustive secret/CVE/license scans were not run;
server-side sponsorship policy and dynamic mobile behavior were outside the
local source review; the canonical publication branch is not yet selected; and
organization-level GitHub controls were not visible.

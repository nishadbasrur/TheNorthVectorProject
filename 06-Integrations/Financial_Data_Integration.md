# Financial Data Integration v1.0

## Purpose

This document defines how North Vector should connect to financial data sources, normalize account information, monitor balances and transactions, identify risks, and support budgeting and financial planning.

The Financial Data Integration exists to improve awareness and decision-making without giving Chief uncontrolled authority over money.

Its purpose is analysis, monitoring, and planning first.

## Core Principle

Financial data is highly sensitive and financially consequential.

North Vector should begin with read-only access, narrow scope, strong authentication, and explicit separation between analysis and transaction execution.

## Primary Objectives

The integration should help Chief answer:
- What accounts and balances exist?
- What money came in or went out?
- Are spending patterns changing?
- Are any payments or obligations approaching?
- Is a goal on track?
- What financial risks are emerging?
- What assumptions are projections based on?

## Supported Data Sources

Possible sources include:
- bank accounts
- savings accounts
- credit cards
- brokerage accounts
- retirement accounts
- student financial aid portals
- loan servicers
- payment platforms
- manually entered records

## Phase 1 Scope

Phase 1 should be read-only.

Supported capabilities may include:
- read balances
- read transaction history
- read statement metadata
- read due dates
- read credit limits
- read interest rates where available
- read rewards balances
- import manually provided financial data

Phase 1 should not support:
- payments
- transfers
- purchases
- trades
- card applications
- account opening
- credit-limit requests

## Prohibited Autonomous Actions

North Vector should not autonomously:
- send money
- transfer funds
- place trades
- apply for credit
- accept financial products
- borrow money
- change beneficiaries
- close accounts
- make tax filings

Any future transaction capability would require a separate high-assurance architecture and explicit user authorization.

## Permission Model

Recommended permissions:
- read-only access
- account-by-account scope
- temporary access during early testing
- biometric or passcode authentication
- no transaction permissions
- no broad credential storage when tokenized access is available

## Account Normalization

Each account should contain:
- account_id
- external_account_id
- provider
- institution
- account_type
- account_name
- masked_account_number
- currency
- current_balance
- available_balance
- credit_limit
- interest_rate
- payment_due_date
- minimum_payment
- statement_balance
- rewards_balance
- last_updated_at
- sensitivity
- synchronization_status

## Account Types

The integration should support:
- Checking
- Savings
- Credit Card
- Brokerage
- Retirement
- Loan
- Student Aid
- Payment Platform
- Cash or Manual Account

## Transaction Normalization

Each transaction should contain:
- transaction_id
- external_transaction_id
- account_id
- posted_at
- authorized_at
- description
- normalized_merchant
- amount
- currency
- transaction_type
- category
- status
- recurring_candidate
- related_goal_ids
- related_commitment_ids
- notes
- confidence

## Transaction Types

Suggested transaction types:
- Income
- Purchase
- Transfer
- Fee
- Interest
- Refund
- Payment
- Withdrawal
- Deposit
- Investment Contribution
- Investment Trade

## Categorization

Transactions may be categorized as:
- Housing
- Food
- Transportation
- Education
- Health
- Clothing
- Travel
- Entertainment
- Subscriptions
- Gifts
- Projects
- Financial Fees
- Savings
- Investments
- Income
- Other

Automatic categorization should remain editable.

## Merchant Normalization

The integration may normalize messy transaction descriptions into recognizable merchants.

Example:
`SQ *LALAJAVA 01823`

Normalized merchant:
`Lalajava`

Normalization should preserve the raw description.

## Recurring Payment Detection

The system may identify recurring transactions using:
- merchant
- amount range
- timing interval
- account

Examples:
- subscriptions
- utilities
- tuition plans
- insurance
- loan payments

Recurring detection should create candidates, not automatic obligations.

## Cash Flow Monitoring

North Vector may calculate:
- income
- spending
- savings
- net cash flow
- upcoming obligations
- account runway

Calculations should clearly state the time range and included accounts.

## Budget Support

The integration may support:
- category targets
- savings targets
- spending alerts
- planned large purchases
- fixed and flexible expenses

Budgets should remain planning tools, not moral judgments.

## Goal Integration

Financial data may link to goals such as:
- emergency savings
- tuition funding
- credit building
- investing
- travel budget
- project funding

Each goal should define:
- target amount
- current amount
- deadline
- required contribution rate
- risk status

## Credit Card Monitoring

For credit cards, North Vector may track:
- statement balance
- current balance
- payment due date
- minimum payment
- credit limit
- utilization
- annual fee
- rewards

The system should distinguish:
- current balance
- statement balance
- posted transactions
- pending transactions

## Credit Utilization

Utilization calculations should state:
- which balance is used
- which limit is used
- whether the value is account-level or aggregate
- whether reporting timing is estimated

## Payment Risk Detection

Signals may include:
- approaching due date
- payment not detected
- insufficient available funds
- unusually high balance
- repeated fees
- rising utilization

Warnings should remain specific and proportionate.

## Spending Pattern Detection

The system may identify:
- category increases
- unusual purchase size
- subscription growth
- repeated discretionary spending
- merchant concentration

One unusual transaction should not become a durable behavioral judgment.

## Financial Opportunity Detection

Possible opportunities include:
- avoidable fees
- idle cash
- better savings allocation
- expiring rewards
- employer benefits
- scholarship or aid deadlines

Recommendations involving products or investments should remain cautious and evidence-based.

## Investment Data

Read-only investment data may include:
- holdings
- market value
- cost basis
- contributions
- gains and losses
- asset allocation

North Vector should distinguish market movement from user decisions.

## Trading Rule

North Vector should not place trades in Phase 1.

If trading analysis is provided, it should:
- state uncertainty
- distinguish speculation from long-term investing
- surface concentration and downside risk
- avoid presenting predictions as guarantees

## Debt Data

Debt records may include:
- principal balance
- interest rate
- minimum payment
- due date
- term
- payoff estimate

Debt recommendations should consider cash flow, risk, and opportunity cost.

## Financial Forecasting

The system may project:
- savings growth
- debt payoff
- future cash balance
- contribution scenarios
- major purchase affordability

Forecasts should clearly label:
- assumptions
- time horizon
- uncertainty
- excluded variables

## Daily Briefing Integration

Financial information should appear only when action is needed.

Examples:
- payment due soon
- unusual transaction
- low balance risk
- expiring reward

The briefing should not display sensitive balances unnecessarily.

## Monthly Strategy Review Integration

The monthly review may include:
- income
- spending
- savings rate
- debt progress
- goal progress
- unusual changes
- financial risks
- upcoming large costs

## Privacy

Financial data should be classified as restricted.

The integration should:
- require strong authentication
- hide balances on public devices
- avoid reading amounts aloud in public
- minimize retention
- restrict device access
- encrypt credentials and tokens
- support immediate revocation

## Data Retention

Default policy:
- store normalized records only when useful
- avoid storing full statements unless explicitly requested
- retain source references where available
- allow deletion of imported and derived data
- expire cached balances quickly

## Synchronization

The integration should support:
- on-demand refresh
- scheduled balance refresh
- transaction refresh
- last-sync timestamp
- stale-data indicator

## Synchronization States

Suggested states:
- Current
- Syncing
- Delayed
- Authentication Expired
- Permission Limited
- Provider Error
- Data Conflict
- Disconnected

## Error Handling

If account retrieval fails:
`Financial data could not be refreshed. Existing balances may be outdated.`

If one account fails:
`Your checking account could not be updated, but other connected accounts are current.`

If a transaction is uncertain:
`This transaction category is uncertain and has not been used for a behavioral conclusion.`

## Audit Log

The integration should record:
- account accessed
- balance refreshed
- transaction imported
- category changed
- financial alert created
- permission changed
- authentication failed
- access revoked

The audit log should avoid exposing full account numbers or sensitive transaction details unnecessarily.

## Manual Data Support

North Vector should support manual entry when an institution cannot connect.

Manual records should show:
- source: manual
- last updated by user
- lower synchronization confidence
- review reminder

## Phase 1 Implementation

Phase 1 should support:
- read-only account connections
- account normalization
- transaction normalization
- editable categorization
- recurring payment candidates
- payment due monitoring
- savings and cash flow summaries
- financial goal linking
- strict privacy controls
- synchronization and error states

No autonomous transaction execution should be included.

## Success Criteria

The Financial Data Integration succeeds if Chief can reliably answer:
- what financial data is current
- what obligation is approaching
- what pattern is changing
- what goal is on or off track
- what recommendation is based on confirmed data versus projection
- what the system cannot do without explicit future authorization

## Final Principle

North Vector should make money easier to understand before it ever makes money easier to move.
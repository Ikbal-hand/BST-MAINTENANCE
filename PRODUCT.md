# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript frontend, Express + TypeScript backend, Prisma with
MySQL, REST API, JWT authentication through HttpOnly cookies, TanStack Query,
Zustand, and Tailwind CSS.

## Users

The primary users are inferred from the documented workflows and seeded roles:

- branch administrators and operators who manage store data, maintenance work,
  BAP, invoice/SPH, receipts, recaps, and branch documents;
- central/developer users who need cross-branch visibility, configuration,
  technical monitoring, and administrative correction.

The main operating situation is recurring administrative work for a maintenance
company serving many Alfamart stores, where staff currently need to coordinate
spreadsheet data and multiple document types.

This audience and job description are an inference because the requested
interview could not be answered by the user.

## Product Purpose

BST Invoice is a web application for connecting store master data, maintenance
work details, BAP, invoice, SPH, receipts, recaps, document archives, and
branch monitoring in one workspace.

It exists to reduce repeated spreadsheet entry, keep documents consistent,
separate branch data safely, and give central teams visibility across branches.
Success means staff can move a transaction from store data through document
generation and recap without re-entering the same information or losing its
history.

## Positioning

The product's meaningful mechanism is a tenant-aware, document-linked workflow:
one source of truth connects each store and maintenance job to its downstream
documents and recap, while central and branch workspaces enforce different
visibility and responsibilities.

## Operating Context

The core workflow is:

`Master Toko → BAP → Detail BAP → Invoice / SPH → Kwitansi → Rekap / Tanda Serah Terima → Pembayaran dan arsip`

The application supports a central workspace and branch workspaces resolved from
subdomains. Central users monitor and configure the organization; branch users
work only with their branch's stores and transactions.

Users work with operational records, generated or uploaded PDFs, spreadsheet
imports, search and export, and audit history. The existing reference documents
and source spreadsheet are part of the working context.

## Capabilities and Constraints

Confirmed capabilities and planned scope include:

- login, session handling, roles, permissions, and protected routes;
- central and branch workspaces with server-side workspace isolation;
- store master data and initial Excel import;
- BAP, detail pekerjaan, invoice, SPH, kwitansi, recap REG/FRC, and tanda serah
  terima workflows;
- PDF generation, upload, archive, download, search, and export;
- operational and central dashboards;
- audit log;
- configurable document formats, company details, bank accounts, signatures,
  and document numbering.

The backend must remain the authority for permission checks and workspace
filters; frontend visibility is only a UX aid. Transaction tables must carry
workspace ownership where applicable, and workspace identity must come from
server-side hostname/session resolution rather than client input.

The initial version does not include automatic payment integration, direct
Alfamart integration, a native mobile app, automatic WhatsApp messaging, OCR,
complex tax calculation before rules are confirmed, multi-currency, or a highly
complex approval workflow.

The business rules for complex tax handling and any future approval workflow
remain undecided.

## Brand Commitments

The product name is BST Invoice. Existing product copy is primarily Indonesian,
with concise operational labels and some established English technical or
workspace terminology such as “Workspace” and “Secure
workspace for better work.”

The existing BST mark and document references are confirmed project assets.
Future work must preserve the product name, the meaning of the document
terminology, and consistency with the reference PDFs unless the product owner
changes those commitments.

## Evidence on Hand

- [README.md](./README.md) documents the current architecture, roles, seeded
  workspaces, setup, and operating assumptions.
- [docs/APPLICATION-BUILD-PLAN.md](./docs/APPLICATION-BUILD-PLAN.md) documents
  the business workflow, goals, roles, permissions, tenant model, and scope.
- [Progres.md](./Progres.md) records implementation progress and remaining
  modules.
- [STORE (1).xlsx](./STORE%20(1).xlsx) is the initial store data source.
- [docs_reference/](./docs_reference/) contains real PDF document references
  for output formats.
- [frontend/src/app/router.tsx](./frontend/src/app/router.tsx) confirms the
  current landing, login, dashboard, stores, BAP, invoices, recaps, and
  settings routes.
- [backend/src/services/recap-service.ts](./backend/src/services/recap-service.ts)
  confirms recap aggregation by workspace, period, store, invoice count, and
  invoice total.

No testimonials, customer logos, performance benchmarks, payment claims, or
other marketing proof should be fabricated.

## Product Principles

1. **Tenant isolation** — branch data must never be mixed accidentally.
2. **Central visibility** — central teams can understand branch operations
   without weakening branch boundaries.
3. **Single source of truth** — totals, statuses, and recaps derive from
   database records rather than copied PDF values.
4. **Repeatable documents** — the same source data should produce consistent
   documents and allow regeneration.
5. **Auditability and safe failure** — important changes are traceable, and
   non-critical logging failure must not break the primary transaction.

## Accessibility & Inclusion

The product is a web application and should target WCAG 2.2 AA for keyboard
operation, readable contrast, visible focus, semantic forms, responsive layouts,
and clear status/error feedback.

No product-specific assistive technology requirement has been confirmed yet.

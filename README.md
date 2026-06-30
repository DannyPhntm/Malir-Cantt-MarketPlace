# People of Malir Cantt Bazaar

The community marketplace for Malir Cantt residents. Buy • Sell • Hire • Discover.

## Status

Early development.

## Goal

Create a modern, trusted platform where residents can buy and sell items within the community.

## Tech Stack

* React
* Vite
* JavaScript

## Current Features

* Project setup
* React application
* Local development environment
* Project documentation

## Documentation

* PROJECT.md — Product vision and UI philosophy.
* CLAUDE.md — AI development guidelines.
* DECISIONS.md — Important project decisions.
* INSPIRATION.md — Design references and ideas.

## Run Locally

```bash
npm install
npm run dev
```

## Business verification (beta)

Business applications require a verification document photo (bill / receipt / business card / rent proof / anything showing the business name or address) plus business address and phone. CNIC photo and NTN are optional during beta. Verification documents are uploaded to Cloudinary (`malir/business-verification`) and are **admin-only** — never exposed on public pages.

> Admin user blocking (beta): admins can reversibly block/unblock a user (Admin → Users). Enforced server-side — blocked accounts get 403 "Your account has been restricted. Please contact support." on login and all protected actions. Blocking never deletes data; admins cannot block themselves or other admins.
> Business verification documents are admin-only and used only to verify authenticity before approval. Admins review them in Admin → Business (thumbnail + link); rejection can include a reason shown to the applicant. Never exposed on public pages.

# Mira Diary Manager

A standalone React application for Mira's private daily diary and long-form experience library. It supports structured travel, movie, food, activity, and general-memory stories without including notes or any other Mira manager.

## Backend contract

- `GET /api/diary?start=YYYY-MM-DD&end=YYYY-MM-DD`
- `PUT /api/diary/:entryDate`
- `DELETE /api/diary/:entryDate`

Diary writes use the existing fields: `mood`, `energy`, `sleepHours`, `highlight`, `content`, `gratitudeOne`, `gratitudeTwo`, `gratitudeThree`, `prompt`, and `tags`.

Experience stories use:

- `GET|POST /api/experiences` and `GET|PUT|DELETE /api/experiences/:id`
- `POST /api/experiences/:id/media` plus authenticated media content, metadata, cover, and delete operations
- `GET|PUT|DELETE /api/experiences/:id/publication` for owner-controlled sharing
- `GET /api/public/experiences` and `/api/public/experiences/:slug` for public or unlisted snapshots

Published stories are immutable, privacy-filtered snapshots. Editing the private source does not change the shared copy until the owner explicitly republishes it.

## Authentication

The private app uses the existing Firebase Google sign-in and sends Firebase ID tokens to the Mira backend. Shared story routes intentionally work without authentication; unlisted stories require their cryptographically random link.

## Later setup

Install or run the declared project commands only when you are ready. No dependency installation, build, preview, application execution, deployment, or test execution was performed while this source was implemented.

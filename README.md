# Mira Diary Manager

A standalone React application containing only Mira's diary experience. The existing backend and every current frontend application remain separate and unchanged.

## Existing backend contract

- `GET /api/diary?start=YYYY-MM-DD&end=YYYY-MM-DD`
- `PUT /api/diary/:entryDate`
- `DELETE /api/diary/:entryDate`

Diary writes use the existing fields: `mood`, `energy`, `sleepHours`, `highlight`, `content`, `gratitudeOne`, `gratitudeTwo`, `gratitudeThree`, `prompt`, and `tags`.

## Authentication

Authentication UI, SDKs, token handling, and Firebase are intentionally omitted, ready for you to integrate separately.

## Later setup

Install the declared packages only when you are ready to run the project. No dependency installation, build, preview, application execution, deployment, or test execution was performed while this source was created.

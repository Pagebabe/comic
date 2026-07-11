# Security Policy

## Scope

This public repository contains a browser-based Comic Factory recovery and production-proof line. It must not contain production credentials, private deployment links, personal data, confidential source material, or unrestricted local execution paths.

## Reporting

Do not publish sensitive details in a public issue. Use GitHub private vulnerability reporting when available. Otherwise open a public issue requesting a private contact channel without including exploit payloads, credentials, personal data, or private URLs.

Include:

- affected route, workflow, script, or artifact;
- affected commit or Pages URL;
- observed impact;
- safe reproduction steps using synthetic data;
- whether credentials, private assets, or personal data may be involved.

## Incident rules

If a credential, private asset, personal record, or confidential source is found:

1. do not reproduce it in another issue, pull request, screenshot, or chat;
2. treat credentials as compromised and rotate them at the provider;
3. identify affected branches, Actions, Pages artifacts, caches, releases, and logs;
4. preserve the minimum evidence required for the incident review;
5. remove public access only through a reviewed recovery plan;
6. rewrite Git history only after backup, dependency review, and an explicit rollback path.

## Repository boundaries

- no real `.env` files, credentials, tokens, private URLs, or provider secrets;
- no free-shell or unrestricted command execution from the public browser surface;
- generated assets must have documented source, rights, review status, and version;
- no real voices, likenesses, personal data, or copyrighted source material may be published without documented authorization;
- GitHub Actions permissions must be minimal and explicit;
- Pages deployments must be bound to reviewed commits and evidence;
- screenshots, logs, packages, and test artifacts must be checked for sensitive data;
- synthetic and review-required material must remain visibly labeled;
- public proof does not equal creative approval or production readiness.

## Supported state

Only the current default branch and explicitly documented live Pages deployment are supported. Historical branches, archive branches, temporary artifacts, and unmerged experiments are not security-maintained unless an issue states otherwise.

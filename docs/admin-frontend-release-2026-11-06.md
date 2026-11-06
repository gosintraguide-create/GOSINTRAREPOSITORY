# Admin frontend release — 6 November 2026

Release branch: codex/admin-frontend-release. Isolated checkout under .tmp-admin-release/frontend-20261106.

The deployed dispatch release dpl_AQVxnrRy97yhqUzXMVKMsZAgMs5y already included the reviewed admin navigation, order labels and empty states. Preserve its frontend sources; add the remaining admin header/footer isolation from the reviewed local preview. Record the deployed backend baseline and migrations for reproducibility, without redeploying the backend.

Validation: isolated production build and 112 admin/security/payment integration tests passed. Import/chunk-size warnings remain. Test database dependency is the existing .tmp-capacity-tests PGlite install; no production transactions were triggered.

Main workspace changes and mobile sources are not included. Production deployment status will be recorded after verification.

## Published

Deployment dpl_J9jyGgmv6qm9d3uR5uLjPTJzQpox is READY and aliased to https://www.hoponsintra.com. Published from commit a1fe920f, following baseline ca0a2019. Production admin login loads without public header/footer. Verified the served admin bundle includes sidebar navigation, unissued-card labels and existing dispatch controls. Authenticated production walkthrough still requires owner sign-in; the local authenticated walkthrough was completed earlier. No Git push or merge into main was performed.

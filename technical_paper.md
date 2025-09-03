# Veyra Technical Paper

## Overview
**Veyra** provides a minimal-data, privacy-compliant API for verification needs, mainly used for ID verification using its sister bot which integrates with **iDenfy** to verify a piece of ID and tie it to a byond account and discord account.
---

## Verification Flow

1. **Request Initiation**
   - A client application requests verification for a ckey
   - Veyra enforces request limits to prevent abuse and repeated verification requests from the same user.

2. **Session Creation**
   - Veyra generates a verification session with iDenfy.
   - The user completes ID verification on iDenfy’s platform.

3. **Result Processing**
   - iDenfy sends the result to Veyra via webhook.
   - Veyra stores only minimal metadata about the verification.

4. **Data Deletion**
   - After result processing, Veyra issues a deletion request to iDenfy which deletes the data within seconds.
   - Only a **scanRef** (non-identifiable reference token) remains in storage on iDenfy and Veyra.

---

## Data Handling

### Data Stored by Veyra
- **scanRef**: Non-identifiable verification reference.
- **External Identifier**: Provided by client (e.g., BYOND key, Discord ID).
- **Verification Status**: Approved, Denied, Expired, Suspected.
- **Timestamps**: Verification completion and deletion request.

### Data Not Stored by Veyra
- Government-issued ID details.
- Document scans or images.
- Biometric data.

### Data Temporarily Stored by iDenfy
- Identity documents and facial recognition data.
- Deleted immediately upon Veyra’s deletion request.

---

## Security

- **Transport Security**: All communication uses HTTPS.
- **Access Control**:
  - Client applications can access only their own user records.
  - Administrative access is protected by key-based authentication.
- **Immutable Records**: Verification logs cannot be edited without creating an audit entry.
- **Automatic Cleanup**: Expired or incomplete sessions older than 24 hours are purged.

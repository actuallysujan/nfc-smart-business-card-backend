# Postman Collection & API Reference

**Prod Demo Base URL:** `https://nfc-smart-business-card-backend.onrender.com`  
**Local Base URL:** `http://localhost:5000`

---

## Files in This Folder

| File | Purpose |
| --- | --- |
| `nfc-smart-business-card.postman_collection.json` | Full Postman v2.1 collection with 21 requests covering all API routes, sample bodies, and auto-token test scripts |
| `nfc-smart-business-card.prod.postman_environment.json` | Environment configured for `https://nfc-smart-business-card-backend.onrender.com` |
| `nfc-smart-business-card.local.postman_environment.json` | Environment configured for `http://localhost:5000` |

---

## How to Use in Postman

1. Open Postman → click **Import**.
2. Drag in `nfc-smart-business-card.postman_collection.json` and both `.postman_environment.json` files.
3. In the top-right environment selector, pick **NFC Smart Business Card - Prod Demo** (or **Local**).
4. Run **1. Auth (Public) → Login** (or **Register Super Admin** first if setting up a fresh database).
   - The `Login` request has a test script that automatically saves the returned JWT into `{{token}}` and your ID into `{{userId}}`.
5. Every protected request automatically sends `Authorization: Bearer {{token}}`.

> **Note on Render Free Tier:** If the hosted demo API on Render has been idle, the first request may take ~30–60 seconds to wake up. Also note that on ephemeral hosts like Render, local disk uploads in `/uploads` reset on redeploy unless Cloudinary env vars (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) are configured.

---

## Complete API Listing

All API routes are mounted under `/api/v1/auth` (plus `/uploads` for static files).

### 1. Auth (Public)

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register-super-admin` | Public | Create a `SUPER_ADMIN` account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate and receive a 7-day JWT |

#### `POST /api/v1/auth/register-super-admin`
- **Content-Type:** `application/json`
- **Body Keys:**
  - `name` *(string, required)* — Full name
  - `email` *(string, required)* — Unique email address
  - `password` *(string, required)* — Account password

#### `POST /api/v1/auth/login`
- **Content-Type:** `application/json`
- **Body Keys:**
  - `email` *(string, required)* — Registered email
  - `password` *(string, required)* — Account password

---

### 2. Profile (Authenticated User)

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/v1/auth/profile` | Bearer Token | Get your own profile |
| `PUT` | `/api/v1/auth/profile` | Bearer Token | Update profile fields (JSON or `form-data` with optional `profileImage`) |

#### `PUT /api/v1/auth/profile`
Supports either **`application/json`** or **`multipart/form-data`** (provide at least one field or file):
- `name` *(string, optional)* — First/full name
- `lastName` *(string, optional)* — Last name
- `bio` *(string, optional, max 500 chars)* — Short bio
- `mobileNumber` *(string, optional)* — Phone number
- `permanentAddress` *(string, optional)* — Address
- `currentPosition` *(string, optional)* — Current job title
- `profileImage` *(file, optional, `form-data` only)* — Profile picture (`jpeg`, `jpg`, `png`, `gif`, `webp`, max 5MB; `image` key also accepted)
- `experience` *(array of objects, optional; JSON string if using `form-data`)*:
  - `company` *(string, required)*
  - `position` *(string, required)*
  - `startDate` *(ISO date string, optional)*
  - `endDate` *(ISO date string, optional)*
  - `description` *(string, optional)*
  - `isCurrent` *(boolean, optional, default `false`)*
- `education` *(array of objects, optional; JSON string if using `form-data`)*:
  - `institution` *(string, required)*
  - `degree` *(string, required)*
  - `fieldOfStudy` *(string, optional)*
  - `startDate` *(ISO date string, optional)*
  - `endDate` *(ISO date string, optional)*
  - `description` *(string, optional)*

---

### 3. Profile Picture & Images (Authenticated User)

Supported formats: `jpeg`, `jpg`, `png`, `gif`, `webp` (max **5MB** per file).

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/profile/picture` | Bearer Token | Upload or replace profile picture |
| `PUT` | `/api/v1/auth/profile/picture` | Bearer Token | Replace profile picture (alias of `POST`) |
| `DELETE` | `/api/v1/auth/profile/picture` | Bearer Token | Remove profile picture and delete stored file |
| `GET` | `/api/v1/auth/profile/images` | Bearer Token | List `profileImage` and all gallery `images` |
| `POST` | `/api/v1/auth/profile/images` | Bearer Token | Upload 1–10 gallery images |
| `PATCH` | `/api/v1/auth/profile/images/:imageId` | Bearer Token | Update a gallery image caption |
| `DELETE` | `/api/v1/auth/profile/images/:imageId` | Bearer Token | Delete a gallery image and its file |
| `GET` | `/uploads/...` | Public | Serve a locally uploaded static file (e.g. `/uploads/profiles/...`) |

#### `POST` / `PUT /api/v1/auth/profile/picture`
- **Content-Type:** `multipart/form-data`
- **Body Keys:**
  - `profileImage` *(File, required — `image` key also accepted)* — Image file

#### `POST /api/v1/auth/profile/images`
- **Content-Type:** `multipart/form-data`
- **Body Keys:**
  - `images` *(File(s), required — `image` key also accepted; 1–10 files)* — Image file(s)
  - `caption` *(Text, optional, max 200 chars)* — Single caption applied to uploaded file(s)
  - `captions` *(Text, optional)* — JSON array string of captions matching file order, e.g. `["Front", "Back"]`

#### `PATCH /api/v1/auth/profile/images/:imageId`
- **Path Params:** `imageId` *(MongoDB ObjectId of the image)*
- **Content-Type:** `application/json`
- **Body Keys:**
  - `caption` *(string, required, max 200 chars)* — Updated caption text

#### `DELETE /api/v1/auth/profile/images/:imageId`
- **Path Params:** `imageId` *(MongoDB ObjectId of the image)*
- **Body:** None

---

### 4. User Management (`ADMIN` & `SUPER_ADMIN`)

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/v1/auth/users` | `SUPER_ADMIN`, `ADMIN` | List all users (newest first) |
| `GET` | `/api/v1/auth/users/:userId` | `SUPER_ADMIN`, `ADMIN` | Get a user by ID |
| `PATCH` | `/api/v1/auth/users/:userId/deactivate` | `SUPER_ADMIN`, `ADMIN` | Deactivate a user (`isActive: false`) |
| `PATCH` | `/api/v1/auth/users/:userId/activate` | `SUPER_ADMIN`, `ADMIN` | Activate a user (`isActive: true`) |
| `DELETE` | `/api/v1/auth/users/:userId` | `SUPER_ADMIN`, `ADMIN` | Permanently delete a user and their images |

- **Path Params (`:userId`):** Target user's MongoDB ObjectId.
- **Body:** None.

---

### 5. Role Management (`SUPER_ADMIN` Only)

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register-user` | `SUPER_ADMIN` | Create a new `USER` or `ADMIN` |
| `PATCH` | `/api/v1/auth/users/:userId/promote` | `SUPER_ADMIN` | Promote a `USER` to `ADMIN` |
| `PATCH` | `/api/v1/auth/users/:userId/demote` | `SUPER_ADMIN` | Demote an `ADMIN` to `USER` |

#### `POST /api/v1/auth/register-user`
- **Content-Type:** `application/json`
- **Body Keys:**
  - `name` *(string, required)* — Full name
  - `email` *(string, required)* — Unique email
  - `password` *(string, required)* — Account password
  - `role` *(string, optional)* — `"USER"` (default) or `"ADMIN"`

#### `PATCH /api/v1/auth/users/:userId/promote` & `.../demote`
- **Path Params:** `userId` *(MongoDB ObjectId of the target user)*
- **Body:** None.

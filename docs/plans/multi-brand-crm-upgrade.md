# Multi-Brand CRM Upgrade Plan

## Goal
Transform CRM from Byondwalls-only to multi-brand (Songhwa + Byondwalls + HWC Coffee).
Import existing Google Sheet data. Enable cross-brand creator sharing.
Future: OpenCLI auto-tracks post performance after creator posts.

## Google Sheet Data Source
- Sheet ID: `1rlEoHhrsGsBwEA4dt3dnyBuo9w1-ApKfa49KMNLDpQo`
- GID 0: Songhwa (32 creators, 17 paid, Liz manages)
- GID 335424191: Byondwalls (73 creators, 5 paid, Amber manages)
- Exported CSVs at: /tmp/xhs_gid_0.csv, /tmp/xhs_gid_335424191.csv

## Business Logic (from Chris)
- Liz manages Songhwa creators, Amber manages Byondwalls creators
- If a creator works well for one brand, share to the other brand too
- Same creator can have DIFFERENT status per brand (paid for Songhwa, prospect for Byondwalls)
- Duplicates across brands = SUCCESS (cross-brand value)
- Rate, payout, food credit tracked PER BRAND engagement

## Step 1: Add Brand & Engagement Types ✅ DONE
- [ ] Add `Brand` type: 'songhwa' | 'byondwalls' | 'hwc_coffee' | 'decore'
- [ ] Add `BrandEngagement` type: creator_id, brand, status, rate, payout, food_credit, pic, proceed_date, month, posted_link, likes, collects, paid_status
- [ ] Add `EngagementStatus`: 'prospect' | 'contacted' | 'negotiating' | 'confirmed' | 'visited' | 'posted' | 'paid' | 'skipped'
- [ ] Update Creator type: add `brands` array (which brands they work with)

## Step 2: Import Google Sheet Data ✅ DONE
- [ ] Parse Songhwa CSV → create/update creators + brand engagements
- [ ] Parse Byondwalls CSV → create/update creators + brand engagements
- [ ] Merge duplicates (same XHS profile = same creator, multiple brand engagements)
- [ ] Import: name, followers, XHS link, IG link, rate, payout, food credit, PIC, status, post link, likes, collects

## Step 3: User Management + Staff Portal ✅ DONE
- [ ] Firestore `users` collection: id, name, email, role (admin/staff), brands[], created_at
- [ ] Registration page: staff can register with name + email + password
- [ ] Admin can assign brands + creators to staff
- [ ] Staff dashboard: see only their assigned creators
- [ ] Staff can update creator status (contacted, negotiating, confirmed, etc.)
- [ ] Staff can upload Google Sheet data (CSV import via UI)
- [ ] Staff can see engagement details (rate, payout, food credit, posted link)
- [ ] Roles: admin (Chris) sees everything, staff (Liz/Amber) sees their assignments

## Step 4: Brand Filter + Engagement UI ✅ DONE
- [ ] Brand filter on creator list (Songhwa / Byondwalls / HWC / All)
- [ ] Show brand engagements on creator detail page
- [ ] Add "Share to [other brand]" button
- [ ] PIC column with staff filter
- [ ] Engagement status pipeline view per brand
- [ ] Contact number (WhatsApp) click-to-chat
- [ ] Posted link with likes/collects display

## Step 5: Future — OpenCLI Post Tracking ⬜
- [ ] After creator posts and gives us the link, store in brand engagement
- [ ] Cron job: `opencli xiaohongshu download --note-id <id>` to get likes/collects
- [ ] Auto-update engagement metrics weekly
- [ ] ROI dashboard: cost per like, cost per collect per brand

## Data Model
```
Creator (1) ──── (many) BrandEngagement
                           │
                           ├── brand: 'songhwa' | 'byondwalls' | 'hwc_coffee'
                           ├── status: 'prospect' → 'contacted' → ... → 'paid'
                           ├── pic: 'liz' | 'amber'
                           ├── rate_rm: number
                           ├── payout_rm: number
                           ├── food_credit_rm: number
                           ├── proceed_date: string
                           ├── month: string
                           ├── posted_link: string
                           ├── likes: number
                           ├── collects: number
                           └── paid_status: string
```

## Import Results (2026-03-24)
- 1,011 existing OpenCLI creators preserved (zero data loss)
- 92 new creators added from Google Sheet
- **1,103 total creators** in CRM
- 104 brand engagements (31 Songhwa + 73 Byondwalls)
- 7 cross-brand creators identified (work with both brands)
- 13 with phone/WhatsApp numbers
- 83 with posted links
- Backup at: crm-import-final.backup-20260324.json
- Import script: scripts/import-google-sheet.py (re-runnable)

## Status: Steps 1-4 DONE, Step 5 (OpenCLI post tracking) PENDING

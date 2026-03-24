# CRM UI Fixes — Urgent (2026-03-24)

## Problems
1. No per-brand status columns — can't see Songhwa vs Byondwalls status
2. PIC filter broken — PIC data only in engagements, not on creator record
3. No inline status update — Liz/Amber can't tick "contacted" per brand
4. Location column all empty
5. Source column empty

## Fix Plan

### Creator Table Columns (should look like):
| Name | Followers | XHS Link | Songhwa Status | Byondwalls Status | PIC | Source | Location |

### How:
- [ ] Denormalize: when engagements load, build a map of creator_id → {songhwa_status, byondwalls_status, pic}
- [ ] Add Songhwa Status + Byondwalls Status columns with inline dropdown
- [ ] Dropdown changes → PUT /api/engagements/:id to update status
- [ ] If no engagement exists for that brand → show "-" or "Add" button
- [ ] PIC column: pull from engagements, not creator record
- [ ] Source column: from tags (google-sheet → PIC name, opencli → "XHS Scraper")
- [ ] Location: populate from tags (e.g. "Petaling_Jaya_food" → "Petaling Jaya")
- [ ] Always load engagements on creator page (not just when filter active)

### PIC Filter Fix:
- [ ] Fetch all engagements on page load (cap at 2000)
- [ ] Build pic lookup from engagements
- [ ] Filter creators by matching engagement pic

## Status: TODO

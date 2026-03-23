#!/usr/bin/env python3
"""
Import Google Sheet KOC data into CRM JSON format.
Handles: Songhwa + Byondwalls sheets, deduplication, multi-brand engagements.

Usage: python3 scripts/import-google-sheet.py
Output: social-media-crawl-data/crm-import-final.json (updated)
        social-media-crawl-data/brand-engagements.json (new)
"""

import csv
import json
import re
import uuid
from pathlib import Path

DATA_DIR = Path("/Users/chrisfun/social-media-crawl-data")
EXPORT_DIR = DATA_DIR / "google-sheet-export"

def clean_phone(raw):
    """Normalize phone numbers."""
    if not raw:
        return None
    cleaned = re.sub(r'[^\d+]', '', raw)
    if cleaned and not cleaned.startswith('+'):
        if cleaned.startswith('60'):
            cleaned = '+' + cleaned
        elif cleaned.startswith('0'):
            cleaned = '+6' + cleaned
    return cleaned if len(cleaned) >= 10 else None

def extract_xhs_user_id(url):
    """Extract XHS user profile ID from URL."""
    if not url:
        return None
    match = re.search(r'/user/profile/([a-f0-9]+)', url)
    return match.group(1) if match else None

def parse_followers(raw):
    """Parse follower string like '2k', '8k XHS', '10K XHS'."""
    if not raw:
        return None
    match = re.search(r'([\d.]+)\s*[kK]', raw)
    if match:
        return int(float(match.group(1)) * 1000)
    match = re.search(r'(\d+)', raw)
    return int(match.group(1)) if match else None

def parse_rm(raw):
    """Parse RM amount from text like 'RM100', '150', 'RM100-120 Photo'."""
    if not raw:
        return None
    match = re.search(r'(\d+)', str(raw))
    return int(match.group(1)) if match else None

def parse_likes_collects(likes_raw, collects_raw):
    """Parse likes and collects from various formats."""
    likes = None
    collects = None

    # Try direct number
    if likes_raw:
        match = re.search(r'(\d+)', str(likes_raw))
        if match:
            likes = int(match.group(1))

    if collects_raw:
        # Collects sometimes has "111 like/ 119 collect" format
        like_match = re.search(r'(\d+)\s*like', str(collects_raw))
        collect_match = re.search(r'(\d+)\s*collect', str(collects_raw))
        if like_match and not likes:
            likes = int(like_match.group(1))
        if collect_match:
            collects = int(collect_match.group(1))
        elif not collect_match:
            match = re.search(r'(\d+)', str(collects_raw))
            if match:
                collects = int(match.group(1))

    return likes, collects

def map_status(paid_raw):
    """Map Google Sheet status to standardized engagement status."""
    if not paid_raw:
        return 'prospect'
    paid = paid_raw.strip().upper()
    if 'PAID' in paid:
        return 'paid'
    if 'SKIP' in paid:
        return 'skipped'
    if 'PENDING DELIVERABLE' in paid:
        return 'posted'
    if 'PENDING SHOOT' in paid:
        return 'confirmed'
    if 'PENDING' in paid:
        return 'negotiating'
    return 'prospect'

def parse_songhwa(filepath):
    """Parse Songhwa CSV."""
    creators = {}
    engagements = []

    with open(filepath, 'r') as f:
        rows = list(csv.reader(f))

    for row in rows[1:]:
        if len(row) < 10:
            continue
        name = row[1].strip()
        if not name or name == 'Name' or 'MARCH' in name.upper() or '2025' in name or '2026' in name:
            continue

        xhs_link = row[4].strip() if len(row) > 4 else ''
        ig_link = row[3].strip() if len(row) > 3 else ''
        xhs_uid = extract_xhs_user_id(xhs_link)
        followers = parse_followers(row[2].strip() if len(row) > 2 else '')
        contact = clean_phone(row[9].strip() if len(row) > 9 else '')
        pic = row[10].strip().lower() if len(row) > 10 else ''
        month = row[11].strip() if len(row) > 11 else ''
        rate = row[5].strip() if len(row) > 5 else ''
        payout = parse_rm(row[6].strip() if len(row) > 6 else '')
        food_credit = parse_rm(row[7].strip() if len(row) > 7 else '')
        proceed = row[8].strip() if len(row) > 8 else ''
        posted_link = row[12].strip() if len(row) > 12 else ''
        likes_raw = row[13].strip() if len(row) > 13 else ''
        collects_raw = row[14].strip() if len(row) > 14 else ''
        paid_status = row[15].strip() if len(row) > 15 else ''

        likes, collects = parse_likes_collects(likes_raw, collects_raw)

        # Unique key: XHS user ID or name
        key = xhs_uid or name

        if key not in creators:
            creators[key] = {
                'id': str(uuid.uuid4()),
                'platform': 'xhs',
                'platform_id': xhs_uid or name,
                'name': name,
                'username': name,
                'profile_url': xhs_link,
                'ig_url': ig_link,
                'follower_count': followers,
                'contact_info': contact,
                'content_type': 'food',
                'has_posted_about_us': bool(posted_link),
                'outreach_status': 'posted' if posted_link else 'contacted',
                'outreach_notes': f'Rate: {rate}' if rate else None,
                'tags': ['xhs', 'google-sheet', 'songhwa'],
            }

        engagements.append({
            'id': str(uuid.uuid4()),
            'creator_id': creators[key]['id'],
            'creator_name': name,
            'brand': 'songhwa',
            'status': map_status(paid_status),
            'pic': pic if pic else None,
            'rate_card': rate,
            'rate_rm': parse_rm(rate),
            'payout_rm': payout,
            'food_credit_rm': food_credit,
            'proceed_date': proceed,
            'month': month,
            'contact_number': contact,
            'posted_link': posted_link,
            'likes': likes,
            'collects': collects,
            'paid_status': paid_status,
            'ig_url': ig_link,
            'xhs_url': xhs_link,
        })

    return creators, engagements

def parse_byondwalls(filepath, existing_creators):
    """Parse Byondwalls CSV, merge with existing creators."""
    creators = dict(existing_creators)
    engagements = []
    current_month = ''

    with open(filepath, 'r') as f:
        rows = list(csv.reader(f))

    for row in rows[1:]:
        if len(row) < 10:
            continue

        # Detect month separators
        first_col = row[0].strip() if row[0] else ''
        if any(m in first_col for m in ['2025', '2026']):
            current_month = first_col
            continue

        name = row[1].strip()
        if not name or name == 'Name':
            continue

        xhs_link = row[4].strip() if len(row) > 4 else ''
        ig_link = row[3].strip() if len(row) > 3 else ''
        xhs_uid = extract_xhs_user_id(xhs_link)
        followers = parse_followers(row[2].strip() if len(row) > 2 else '')
        contact = clean_phone(row[10].strip() if len(row) > 10 else '')
        pic = row[11].strip().lower() if len(row) > 11 else ''
        month = row[9].strip() if len(row) > 9 else current_month
        rate = row[5].strip() if len(row) > 5 else ''
        payout = parse_rm(row[6].strip() if len(row) > 6 else '')
        food_credit = parse_rm(row[7].strip() if len(row) > 7 else '')
        proceed = row[8].strip() if len(row) > 8 else ''
        posted_link = row[12].strip() if len(row) > 12 else ''
        likes_raw = row[13].strip() if len(row) > 13 else ''
        collects_raw = row[14].strip() if len(row) > 14 else ''
        paid_status = row[15].strip() if len(row) > 15 else ''

        likes, collects = parse_likes_collects(likes_raw, collects_raw)

        key = xhs_uid or name

        if key not in creators:
            creators[key] = {
                'id': str(uuid.uuid4()),
                'platform': 'xhs',
                'platform_id': xhs_uid or name,
                'name': name,
                'username': name,
                'profile_url': xhs_link,
                'ig_url': ig_link,
                'follower_count': followers,
                'contact_info': contact,
                'content_type': 'food',
                'has_posted_about_us': bool(posted_link),
                'outreach_status': 'posted' if posted_link else 'contacted',
                'outreach_notes': f'Rate: {rate}' if rate else None,
                'tags': ['xhs', 'google-sheet', 'byondwalls'],
            }
        else:
            # Cross-brand creator — update tags
            if 'byondwalls' not in creators[key].get('tags', []):
                creators[key]['tags'] = list(creators[key].get('tags', [])) + ['byondwalls']
            if contact and not creators[key].get('contact_info'):
                creators[key]['contact_info'] = contact

        engagements.append({
            'id': str(uuid.uuid4()),
            'creator_id': creators[key]['id'],
            'creator_name': name,
            'brand': 'byondwalls',
            'status': map_status(paid_status),
            'pic': pic if pic else None,
            'rate_card': rate,
            'rate_rm': parse_rm(rate),
            'payout_rm': payout,
            'food_credit_rm': food_credit,
            'proceed_date': proceed,
            'month': month,
            'contact_number': contact,
            'posted_link': posted_link,
            'likes': likes,
            'collects': collects,
            'paid_status': paid_status,
            'ig_url': ig_link,
            'xhs_url': xhs_link,
        })

    return creators, engagements

def main():
    print("=== Importing Google Sheet KOC Data ===\n")

    # Parse Songhwa first
    songhwa_creators, songhwa_engagements = parse_songhwa(EXPORT_DIR / "songhwa.csv")
    print(f"Songhwa: {len(songhwa_creators)} creators, {len(songhwa_engagements)} engagements")

    # Parse Byondwalls, merging with Songhwa creators
    all_creators, byondwalls_engagements = parse_byondwalls(EXPORT_DIR / "byondwalls.csv", songhwa_creators)
    all_engagements = songhwa_engagements + byondwalls_engagements
    print(f"Byondwalls: {len(all_creators) - len(songhwa_creators)} new + {len(songhwa_creators)} existing, {len(byondwalls_engagements)} engagements")

    # Find cross-brand creators
    cross_brand = [c for c in all_creators.values() if 'songhwa' in c.get('tags', []) and 'byondwalls' in c.get('tags', [])]
    print(f"\nCross-brand creators: {len(cross_brand)}")
    for c in cross_brand:
        print(f"  {c['name']}")

    # Stats
    print(f"\n=== TOTALS ===")
    print(f"Unique creators: {len(all_creators)}")
    print(f"Total engagements: {len(all_engagements)}")
    print(f"  Songhwa: {len(songhwa_engagements)}")
    print(f"  Byondwalls: {len(byondwalls_engagements)}")

    # Status breakdown
    by_status = {}
    for e in all_engagements:
        s = e['status']
        by_status[s] = by_status.get(s, 0) + 1
    print(f"\nBy status:")
    for s, c in sorted(by_status.items(), key=lambda x: -x[1]):
        print(f"  {s}: {c}")

    # PIC breakdown
    by_pic = {}
    for e in all_engagements:
        p = e['pic'] or 'unassigned'
        by_pic[p] = by_pic.get(p, 0) + 1
    print(f"\nBy PIC:")
    for p, c in sorted(by_pic.items(), key=lambda x: -x[1]):
        print(f"  {p}: {c}")

    # Save engagements
    with open(DATA_DIR / "brand-engagements.json", 'w') as f:
        json.dump(all_engagements, f, indent=2, ensure_ascii=False)
    print(f"\nSaved: brand-engagements.json ({len(all_engagements)} records)")

    # Merge with existing CRM data (keep the 1011 OpenCLI creators, add sheet creators)
    existing = json.load(open(DATA_DIR / "crm-import-final.json"))
    existing_names = {c['name'] for c in existing}

    new_from_sheet = 0
    for c in all_creators.values():
        if c['name'] not in existing_names:
            existing.append({
                'platform': c['platform'],
                'platform_id': c['platform_id'],
                'name': c['name'],
                'username': c['username'],
                'profile_url': c['profile_url'],
                'follower_count': c['follower_count'],
                'content_type': c['content_type'],
                'has_posted_about_us': c['has_posted_about_us'],
                'outreach_status': c['outreach_status'],
                'tags': c['tags'],
                'outreach_notes': c.get('outreach_notes', ''),
                'contact_info': c.get('contact_info'),
                'ig_url': c.get('ig_url'),
            })
            new_from_sheet += 1
        else:
            # Update existing with sheet data (contact info, etc)
            for e in existing:
                if e['name'] == c['name']:
                    if c.get('contact_info') and not e.get('contact_info'):
                        e['contact_info'] = c['contact_info']
                    if c.get('ig_url'):
                        e['ig_url'] = c.get('ig_url')
                    if 'google-sheet' not in e.get('tags', []):
                        e['tags'] = list(e.get('tags', [])) + ['google-sheet']
                    break

    with open(DATA_DIR / "crm-import-final.json", 'w') as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)
    print(f"Updated: crm-import-final.json (added {new_from_sheet} new, updated existing)")
    print(f"Total creators in CRM: {len(existing)}")

if __name__ == '__main__':
    main()

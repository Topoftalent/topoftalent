#!/usr/bin/env python3
"""
upload_artistas.py
Reads the "Artistas" sheet from CRM_ToT.xlsx and upserts each row
into Firestore collection: artistas/{id}

Usage:
    python3 upload_artistas.py

Requirements:
    pip install firebase-admin openpyxl
"""

import re
import firebase_admin
from firebase_admin import credentials, firestore
import openpyxl

# ── Firebase Admin init ──────────────────────────────────────────
cred = credentials.Certificate("top-of-talent-firebase-adminsdk-fbsvc-141163f28b.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# ── Load workbook ────────────────────────────────────────────────
wb = openpyxl.load_workbook("CRM_ToT.xlsx", data_only=True)
ws = wb["Artistas"]

rows = list(ws.iter_rows(values_only=True))

# Normalize multi-line headers → first line, lowercased, spaces→underscores
def normalize_header(h):
    if h is None:
        return ""
    s = str(h).split('\n')[0].strip()
    return s

raw_headers = [normalize_header(h) for h in rows[0]]

# Explicit map from normalized header → field key used in code
HEADER_MAP = {
    'ID':              'id',
    'Nombre':          'nombre',
    'Ciudad':          'ciudad',
    'Género':          'genero',
    'Activo':          'activo_desde',   # first occurrence = activo_desde
    'Tipo':            'tipo',
    'Sello':           'sello',
    'Ranking':         'ranking',
    'Score':           'score',
    'EP Label':        'ep_label',
    'Instagram':       'ig_seguidores',
    'Spotify':         'spotify_oyentes',
    'YouTube':         'youtube_subs',
    'TikTok':          'tiktok',
    'Link Spotify':    'link_spotify',
    'Link Instagram':  'link_instagram',
    'Discografía':     'discografia',
    'Colaboraciones':  'colaboraciones',
    'Foto Principal':  'foto_principal',
    'Galería':         '_gallery',        # handled below by index
    'Bio Headline':    'bio_headline',
    'Bio Párrafo 1':   'bio_p1',
    'Bio Párrafo 2':   'bio_p2',
    'Bio Párrafo 3':   'bio_p3',
    'Bio Párrafo 4':   'bio_p4',
    'Quote':           'quote',
    'Siguiente':       '_siguiente',      # handled below by index
    'Activo':          'active',          # second occurrence = active bool
    'Orden':           'order',
    'Notas':           'notas',
}

# Build ordered list of field keys, handling duplicates by position
headers = []
gallery_count  = 0
sig_count      = 0
activo_count   = 0

for h in raw_headers:
    if h == 'Galería':
        gallery_count += 1
        headers.append('foto_' + str(gallery_count))
    elif h == 'Siguiente':
        sig_count += 1
        if sig_count == 1:
            headers.append('siguiente_id')
        else:
            headers.append('siguiente_nombre')
    elif h == 'Activo':
        activo_count += 1
        if activo_count == 1:
            headers.append('activo_desde')
        else:
            headers.append('active')
    else:
        headers.append(HEADER_MAP.get(h, h.lower().replace(' ', '_')))

def cell(row_dict, key, default=""):
    v = row_dict.get(key, default)
    if v is None:
        return default
    return str(v).strip()

def pipe_list(row_dict, key):
    """Split a pipe-separated cell into a list, stripping whitespace."""
    raw = cell(row_dict, key)
    if not raw:
        return []
    return [x.strip() for x in raw.split("|") if x.strip()]

def to_int(row_dict, key, default=0):
    v = row_dict.get(key)
    if v is None:
        return default
    try:
        return int(v)
    except (ValueError, TypeError):
        return default

def to_bool(row_dict, key, default=True):
    v = row_dict.get(key)
    if v is None:
        return default
    if isinstance(v, bool):
        return v
    s = str(v).strip().lower()
    return s not in ("false", "0", "no", "n")

print(f"Columns found: {headers}\n")

uploaded = 0
skipped  = 0

for raw_row in rows[1:]:
    row = dict(zip(headers, raw_row))

    artist_id = cell(row, "id")
    if not artist_id:
        skipped += 1
        continue

    nombre = cell(row, "nombre")
    if not nombre:
        skipped += 1
        continue

    doc = {
        # Identity
        "id":             artist_id,
        "nombre":         nombre,
        "ciudad":         cell(row, "ciudad"),
        "genero":         cell(row, "genero"),
        "activo_desde":   cell(row, "activo_desde"),
        "tipo":           cell(row, "tipo"),
        "sello":          cell(row, "sello"),

        # Ranking
        "ranking":        to_int(row, "ranking"),
        "score":          to_int(row, "score"),
        "ep_label":       cell(row, "ep_label"),

        # Social stats
        "ig_seguidores":      cell(row, "ig_seguidores"),
        "spotify_oyentes":    cell(row, "spotify_oyentes"),
        "youtube_subs":       cell(row, "youtube_subs"),
        "tiktok":             cell(row, "tiktok"),

        # Links
        "link_spotify":   cell(row, "link_spotify"),
        "link_instagram": cell(row, "link_instagram"),

        # Lists
        "discografia":    pipe_list(row, "discografia"),
        "colaboraciones": pipe_list(row, "colaboraciones"),

        # Photos
        "foto_principal": cell(row, "foto_principal"),
        "foto_1":         cell(row, "foto_1"),
        "foto_2":         cell(row, "foto_2"),
        "foto_3":         cell(row, "foto_3"),
        "foto_4":         cell(row, "foto_4"),

        # Bio
        "bio_headline":   cell(row, "bio_headline"),
        "bio_p1":         cell(row, "bio_p1"),
        "bio_p2":         cell(row, "bio_p2"),
        "bio_p3":         cell(row, "bio_p3"),
        "bio_p4":         cell(row, "bio_p4"),

        # Quote / CTA
        "quote":          cell(row, "quote"),

        # Navigation
        "siguiente_id":     cell(row, "siguiente_id"),
        "siguiente_nombre": cell(row, "siguiente_nombre"),

        # Meta
        "active": to_bool(row, "active"),
        "order":  to_int(row, "order"),
        "notas":  cell(row, "notas"),
    }

    # Remove empty strings to keep Firestore clean
    doc = {k: v for k, v in doc.items() if v != "" and v != []}

    db.collection("artistas").document(artist_id).set(doc, merge=True)
    print(f"  ✓ {artist_id}: {nombre}")
    uploaded += 1

print(f"\nDone — {uploaded} artistas subidos, {skipped} filas omitidas.")

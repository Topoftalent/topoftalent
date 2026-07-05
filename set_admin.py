#!/usr/bin/env python3
"""
set_admin.py
Finds the user doc for the TOT Gmail account and sets isAdmin: true.

Usage:
    python3 set_admin.py
"""

import firebase_admin
from firebase_admin import credentials, firestore, auth

cred = credentials.Certificate("top-of-talent-firebase-adminsdk-fbsvc-141163f28b.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

EMAIL = "topoftalentoficial@gmail.com"

# Look up the UID from Firebase Auth
try:
    user = auth.get_user_by_email(EMAIL)
    uid = user.uid
    print(f"Found user: uid={uid}, email={user.email}")
except Exception as e:
    print(f"\nNo se encontro la cuenta: {e}")
    print(f"\nPaso 1: Inicia sesion con {EMAIL} en topoftalentoficial.com")
    print("Paso 2: Vuelve a ejecutar este script")
    exit(1)

# Set isAdmin: true in the users Firestore doc
doc_ref = db.collection("users").document(uid)
doc_ref.set({"isAdmin": True}, merge=True)
print(f"Set isAdmin=true on users/{uid}")

#!/usr/bin/env python3
"""
update_artistas_v2.py
Actualiza Firestore con:
  - Stats de redes sociales corregidos
  - Links de Spotify completos para todos
  - Colaboraciones corregidas (sin entradas falsas)
  - Bio reducida a 1 párrafo (elimina bio_p2/p3/p4)
  - Sello correcto para cada artista
  - Elimina cualquier valor "—" restante
"""

import firebase_admin
from firebase_admin import credentials, firestore

KEY = 'top-of-talent-firebase-adminsdk-fbsvc-141163f28b.json'
cred = credentials.Certificate(KEY)
firebase_admin.initialize_app(cred)
db = firestore.client()
DELETE = firestore.DELETE_FIELD

updates = {
    'artista1': {
        'sello': 'NEON16',
        'ig_seguidores': '1.2M',
        'spotify_oyentes': '1.45M',
        'link_spotify': 'https://open.spotify.com/artist/2rtnKY7iQJHIEBnOd66DCO',
        'colaboraciones': 'Blanko | Jombriel',
        # bio condensada 1 párrafo
        'bio_p1': (
            'Alex Ponce nació el 23 de julio de 1998 en Cuenca. '
            'Firmó con NEON16 (el sello de Tainy) tras viralizarse en TikTok con "Plan", '
            'que alcanzó el Top 50 Global de Spotify — primera vez para un artista ecuatoriano. '
            'Nominado a los Premios Juventud 2025, es hoy la voz del pop ecuatoriano con mayor '
            'proyección internacional.'
        ),
        'bio_p2': DELETE,
        'bio_p3': DELETE,
        'bio_p4': DELETE,
        'youtube_subs': DELETE,
        'tiktok': DELETE,
    },
    'artista2': {
        'sello': 'Independiente',
        'ig_seguidores': '1M',
        'link_spotify': 'https://open.spotify.com/artist/2zIqc1M0zkI6rnB8cA4Phc',
        # Ricky Martin/Camilo/Greeicy fueron co-concursantes o mentor en TV, no collabs musicales
        'colaboraciones': DELETE,
        'bio_p1': (
            'Johann Alexander Vera Tapia nació el 4 de diciembre de 1995 en Guayaquil. '
            'Finalista en La Banda (Univisión) y ganador de la Gaviota de Plata en el Festival de Viña del Mar 2020. '
            'Su canción "Donde Nací" se convirtió en el himno no oficial de la selección ecuatoriana en el Mundial Qatar 2022. '
            'En 2024 lanzó su EP más personal, "Nada importa en verdad", donde habló de su orientación sexual por primera vez.'
        ),
        'bio_p2': DELETE,
        'bio_p3': DELETE,
        'bio_p4': DELETE,
        'spotify_oyentes': DELETE,
        'youtube_subs': DELETE,
        'tiktok': DELETE,
    },
    'artista3': {
        'sello': 'Independiente',
        'ig_seguidores': '374K',
        'link_spotify': 'https://open.spotify.com/artist/7Fk848MU19rSzUvRNwtpV8',
        'bio_p1': (
            'María del Mar Rendón Kalil nació el 10 de noviembre de 2002 en Guayaquil. '
            'Ganadora de dos Heat Latin Awards como mejor artista Rock y primera ecuatoriana '
            'en aparecer en la sección de moda de la revista Marie Claire. '
            'En 2024 protagonizó el musical "Legally Blonde" y fue nominada en los Premios REM de SAYCE 2026 '
            'en la categoría Favorito del Público.'
        ),
        'bio_p2': DELETE,
        'bio_p3': DELETE,
        'bio_p4': DELETE,
        'spotify_oyentes': DELETE,
        'youtube_subs': DELETE,
        'tiktok': DELETE,
    },
    'artista4': {
        'sello': 'Warner Music Latina',
        'ig_seguidores': '2M',
        'spotify_oyentes': '16M',
        'link_spotify': 'https://open.spotify.com/artist/3Y9A8EQQtWU8RStiTlzErv',
        # Nicki Nicole solo bailó su canción en TikTok — no es colaboración musical
        'colaboraciones': 'Ryan Castro | Alex Krack | DFZM | Jøtta | Maldy | Neutro Shorty | Alex Ponce',
        'bio_p1': (
            'Jonathan Cedeño Romero, conocido como Jombriel, nació el 5 de mayo de 2003 en Esmeraldas. '
            'Con solo 21 años acumula 16 millones de oyentes mensuales en Spotify — superando a Thalía y Chayanne. '
            'Su canción "Vitamina" llegó al Top 1 de Spotify Ecuador y su álbum debut "De la Suerte" (2025) '
            'confirma su lugar como el mayor fenómeno del urbano ecuatoriano.'
        ),
        'bio_p2': DELETE,
        'bio_p3': DELETE,
        'bio_p4': DELETE,
        'youtube_subs': DELETE,
        'tiktok': DELETE,
    },
    'artista5': {
        'sello': 'Universal Music Latino',
        'ig_seguidores': '25K',
        'link_spotify': 'https://open.spotify.com/artist/1YZcJWydWAbSpknMUKtD9m',
        'bio_p1': (
            'Alex Fernando Barrio Ayoví, conocido como Alex Krack, nació el 12 de noviembre de 2000 en Esmeraldas. '
            'Su participación en el remix de "Parte & Choke" con Jombriel y Ryan Castro lo catapultó al Billboard Argentina Hot 100 '
            'y le valió la firma con Universal Music Latino. '
            'Fue elegido para cantar en "Camisa 10", el primer álbum del astro Ronaldinho Gaúcho.'
        ),
        'bio_p2': DELETE,
        'bio_p3': DELETE,
        'bio_p4': DELETE,
        'spotify_oyentes': DELETE,
        'youtube_subs': DELETE,
        'tiktok': DELETE,
    },
    'artista6': {
        'sello': 'Independiente',
        'link_spotify': 'https://open.spotify.com/artist/5qPLQJcclXpSdB7f8Yp4p7',
        'spotify_oyentes': '16.8K',
        # Invasores fue su banda anterior, Ha$h y Morat son artistas con quienes compartió escenario — no collabs
        'colaboraciones': DELETE,
        'bio_p1': (
            'Diego Rafael Chiang Centanaro, conocido como DiCapo, nació en Guayaquil en 1996 — hijo del músico Eddy Chiang. '
            'Finalista en La Voz Ecuador y antes parte de la banda Invasores. '
            'Su sonido funde el pop de los 80, soul, jazz y funk latino, con influencias de Michael Jackson, Jamiroquai y The Police. '
            'Rolling Stone lo destacó entre los artistas ecuatorianos que conquistan 2025.'
        ),
        'bio_p2': DELETE,
        'bio_p3': DELETE,
        'bio_p4': DELETE,
        'ig_seguidores': DELETE,
        'youtube_subs': DELETE,
        'tiktok': DELETE,
    },
    'artista7': {
        'sello': '777 Records',
        'ig_seguidores': '70K',
        'link_spotify': 'https://open.spotify.com/artist/6CHaM7DPIvAhLVOB5wNncN',
        'bio_p1': (
            'Kenny Santiago Martínez, conocido como Kenny Die, es un cantante y compositor de Quito. '
            'Desde 2020 fusiona trap y reggaetón con una identidad marcada por lo oscuro y lo romántico. '
            'Su sencillo "Me Pone Crazy" rinde homenaje al reggaetón clásico con producción contemporánea '
            'y su proyecto debut "777" lo consolidó en el urbano ecuatoriano con millones de streams.'
        ),
        'bio_p2': DELETE,
        'bio_p3': DELETE,
        'bio_p4': DELETE,
        'spotify_oyentes': DELETE,
        'youtube_subs': DELETE,
        'tiktok': DELETE,
    },
    'artista8': {
        'sello': 'Banchon Music',
        'link_spotify': 'https://open.spotify.com/artist/0Th8VTQbid8IDUYC1nLAh2',
        'spotify_oyentes': '14.2K',
        'bio_p1': (
            'Yilda Banchón Rivera comenzó su carrera artística a los 7 años, seleccionada entre 8,000 niños para "Pequeños Brillantes" (2008). '
            'En 2017 ganó el primer lugar en la competencia IPOP en Estados Unidos con cuatro medallas. '
            'En 2024 representó a Ecuador como invitada en los Latin Grammy en Miami. '
            'En enero de 2026 se graduó como abogada de la Universidad Católica de Guayaquil.'
        ),
        'bio_p2': DELETE,
        'bio_p3': DELETE,
        'bio_p4': DELETE,
        'ig_seguidores': DELETE,
        'youtube_subs': DELETE,
        'tiktok': DELETE,
    },
    'artista9': {
        'sello': 'Sony Music Andino / RCA China',
        'ig_seguidores': '479K',
        'link_spotify': 'https://open.spotify.com/artist/4ZUU6PKIrQET7oGxQ0r5zL',
        'bio_p1': (
            'Ren Kai Yin Moretta nació el 15 de enero de 1993 en Guayaquil, de madre ecuatoriana y padre chino. '
            'Breakthrough Artist of the Year en TC Televisión 2019. '
            'En 2023 firmó con Sony Music Andino y RCA China — es el único artista ecuatoriano con contrato activo en China continental. '
            'Ha colaborado con Yilda y la artista quichua Ñusta, fusionando español, chino y quichua en un solo sonido.'
        ),
        'bio_p2': DELETE,
        'bio_p3': DELETE,
        'bio_p4': DELETE,
        'spotify_oyentes': DELETE,
        'youtube_subs': DELETE,
        'tiktok': DELETE,
    },
    'artista10': {
        'sello': 'Emporio Records / Warner Argentina',
        'link_spotify': 'https://open.spotify.com/artist/2tsxhfhrjoqKy2okihHP0x',
        # Sech no es una colaboración — solo le dio un shoutout. Vius no está confirmado.
        'colaboraciones': 'Piso 21 | Rombai | Alex Ponce | Yubeili',
        'bio_p1': (
            'Blanko es un artista de 21 años de Quito que comenzó en 2021 creando remixes de Sech, Lunay y The Kid Laroi. '
            'Acumula 1.6 millones de oyentes mensuales en Spotify, con colaboraciones confirmadas con Piso 21, Rombai, Alex Ponce y Yubeili. '
            'Firmado con Emporio Records y distribuido por Warner Argentina, '
            'construyó su audiencia desde las plataformas digitales sin radio ni televisión.'
        ),
        'bio_p2': DELETE,
        'bio_p3': DELETE,
        'bio_p4': DELETE,
        'ig_seguidores': DELETE,
        'youtube_subs': DELETE,
        'tiktok': DELETE,
    },
}

for artist_id, data in updates.items():
    ref = db.collection('artistas').document(artist_id)
    ref.update(data)
    print(f'✓ {artist_id} actualizado')

print('\nTodo listo.')

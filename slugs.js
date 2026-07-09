// Map artista IDs (internal) -> public slugs (URLs). One source of truth.
window.TOT_SLUGS = {"artista1": "alex-ponce", "artista2": "johann-vera", "artista3": "mar-rendon", "artista4": "jombriel", "artista5": "alex-krack", "artista6": "dicapo", "artista7": "kenny-die", "artista8": "yilda", "artista9": "ren-kai", "artista10": "blanko"};
window.TOT_SLUG_OF = function(id){ return (window.TOT_SLUGS && window.TOT_SLUGS[id]) || id; };

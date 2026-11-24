#!/usr/bin/env python3
"""Content audit: grade every image + audio slot in the live database.

Rebuilt 2026-11-22 (the original was lost — .content-audit/ is untracked).
The severity model is reproduced exactly from the 2026-11-20 baseline so
`--compare` stays meaningful; verified by re-grading the baseline snapshot
and matching all ten counts.

Usage:
    python3 .content-audit/audit.py            # snapshot only
    python3 .content-audit/audit.py --compare  # snapshot + diff vs baseline
    python3 .content-audit/audit.py --live --compare  # only content reachable in the app
"""
import json, os, re, sys, datetime, urllib.request, urllib.error
from pathlib import Path
from io import BytesIO

ROOT = Path(__file__).resolve().parent
CACHE = ROOT / '.cache'
BASELINE = ROOT / 'snapshot-2026-11-20.json'
API = os.environ.get('AUDIT_API_URL', 'https://guide-me-monorepo.onrender.com')

# --- severity model (DO NOT change without re-baselining) -----------------
MIN_OK_WIDTH, MIN_WIDTH = 1200, 600
BIG_MB, MED_MB = 2.0, 1.0
PORTRAIT, PANORAMA = 0.8, 2.4
# Visible stock watermark. Only a visual pass finds these; all 382 were
# eyeballed on 2026-11-20 and this was the only one. Add here if more found.
WATERMARKED = {'443b52-Slika_zaslona_2026-06-05_u_19.08.31.png'}
LANGS = ('en', 'de', 'hr')


def token():
    env = ROOT.parent / 'api' / '.env'
    for line in env.read_text().splitlines():
        if line.startswith('ADMIN_TOKEN='):
            return line.split('=', 1)[1].strip()
    sys.exit('ADMIN_TOKEN not found in api/.env')


def get(path, tok, unwrap=None):
    """Admin endpoints wrap their payload in a single key; unwrap it."""
    req = urllib.request.Request(API + path, headers={'x-admin-token': tok})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.load(r)
    if isinstance(data, dict):
        if unwrap and unwrap in data:
            return data[unwrap]
        if len(data) == 1:
            return next(iter(data.values()))
    return data


def fetch_image(url):
    """Return (width, height, kb) using a cached copy when available."""
    name = re.sub(r'[^A-Za-z0-9._-]', '_', url.rsplit('/', 1)[-1])[:150]
    cached = CACHE / name
    if cached.exists():
        data = cached.read_bytes()
    else:
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                data = r.read()
        except Exception:
            return None
        CACHE.mkdir(exist_ok=True)
        cached.write_bytes(data)
    try:
        from PIL import Image
        im = Image.open(BytesIO(data))
        return im.width, im.height, round(len(data) / 1024)
    except Exception:
        return None


def grade_image(url, w, h, kb):
    """-> (severity, [(sev, title, detail), ...])"""
    issues = []
    fname = url.rsplit('/', 1)[-1]
    if fname in WATERMARKED:
        issues.append(('critical', 'Stock watermark',
                       'Visible agency watermark. Contradicts the "No" given to '
                       'Apple on third-party content rights.'))
    if w and w < MIN_WIDTH:
        issues.append(('high', 'Too small',
                       f'{w}px wide. Upscaled {MIN_OK_WIDTH/w:.1f}× to fill a '
                       'phone — visibly blurry.'))
    elif w and w < MIN_OK_WIDTH:
        issues.append(('minor', 'Below ideal width',
                       f'{w}px wide. Ideal is 1600–2000px; 1200px is the floor.'))
    mb = kb / 1024 if kb else 0
    if mb > BIG_MB:
        issues.append(('high', 'Oversized file',
                       f'{mb:.2f} MB. Slow on mobile data; target 200–600 KB.'))
    elif mb > MED_MB:
        issues.append(('medium', 'Large file',
                       f'{mb:.2f} MB. Target 200–600 KB.'))
    if w and h:
        ar = round(w / h, 2)
        if ar < PORTRAIT:
            issues.append(('minor', 'Portrait crop',
                           f'{ar} ratio. Cards crop to landscape, so top and '
                           'bottom are cut off.'))
        elif ar > PANORAMA:
            issues.append(('minor', 'Panorama crop',
                           f'{ar} ratio. Very wide — sides are cut off in cards.'))
    rank = {'critical': 0, 'high': 1, 'medium': 2, 'minor': 3}
    sev = min((i[0] for i in issues), key=lambda s: rank[s], default='ok')
    return sev, issues


def grade_audio(present):
    """present: set of langs that have audio. -> (sev, problem, missing)"""
    if not present:
        return 'critical', 'No audio at all', 'English, German, Croatian'
    missing = [l for l in LANGS if l not in present]
    names = {'en': 'English', 'de': 'German', 'hr': 'Croatian'}
    if 'en' not in present:
        return 'high', 'No English', ', '.join(names[l] for l in missing)
    if missing:
        return 'medium', 'Missing ' + ' and '.join(names[l] for l in missing), \
               ', '.join(names[l] for l in missing)
    return 'ok', '', ''


def collect(tok):
    """Walk cities, places and excursions, grading images + audio.

    Records carry `scope` metadata so a later pass can restrict the report to
    content a user can actually reach (enabled city -> its excursions and
    places). A disabled city hides everything under it even when the child
    docs are themselves enabled.
    """
    imgs, aud = [], []
    scope = {'imgs': [], 'aud': []}

    def add_img(kind_type, slug, kind, lang, url, city=None, live=True):
        if not url:
            return
        got = fetch_image(url)
        if not got:
            return
        w, h, kb = got
        sev, issues = grade_image(url, w, h, kb)
        imgs.append([kind_type, slug, kind, lang, w, h,
                     round(w / h, 2) if h else 0, kb, sev, issues, url])
        scope['imgs'].append({'city': city, 'live': live})

    def langs_with_audio(node):
        a = (node or {}).get('audioUrl') or {}
        return {l for l in LANGS if a.get(l)}

    cities = get('/admin/discover/cities', tok, 'cities')
    enabled_cities = {c['slug'] for c in cities if c.get('isEnabled')}
    # A place is reachable only through a city that lists it AND is enabled.
    live_place_slugs = set()
    for c in cities:
        slug = c.get('slug', '')
        full = get(f'/admin/discover/cities/{slug}', tok, 'city')
        live = slug in enabled_cities
        if live:
            live_place_slugs.update(full.get('cityPlaceSlugs') or [])
        add_img('city', slug, 'hero', '', full.get('image'), slug, live)
        for i, g in enumerate(full.get('images') or [], 1):
            add_img('city', slug, f'gallery{i}', '', g, slug, live)

    for p in get('/admin/discover/places', tok, 'places'):
        slug = p.get('slug', '')
        full = get(f'/admin/discover/places/{slug}', tok, 'place')
        live = slug in live_place_slugs and full.get('isEnabled', True)
        add_img('place', slug, 'hero', '', full.get('image'), None, live)
        for i, g in enumerate(full.get('images') or [], 1):
            add_img('place', slug, f'gallery{i}', '', g, None, live)

    for e in get('/admin/discover/excursions', tok, 'excursions'):
        slug = e.get('slug', '')
        full = get(f'/admin/discover/excursions/{slug}', tok, 'excursion')
        city = full.get('citySlug')
        # An enabled excursion under a disabled city is unreachable: the city
        # never appears in Discover, so there is no path to its routes.
        live = bool(full.get('isEnabled')) and city in enabled_cities
        add_img('excursion', slug, 'hero', '', full.get('image'), city, live)
        for part in ('intro', 'outro'):
            node = full.get(part)
            if node:
                add_img('excursion', slug, part, '', node.get('image'), city, live)
                s, prob, miss = grade_audio(langs_with_audio(node))
                aud.append([slug, part, '',
                            ''.join(sorted(langs_with_audio(node))), s, prob, miss])
                scope['aud'].append({'city': city, 'live': live})
        for si, st in enumerate(full.get('stops') or [], 1):
            add_img('stop', slug, f'stop {si}', '', st.get('image'), city, live)
            for gi, g in enumerate(st.get('images') or [], 1):
                add_img('stop', slug, f'stop {si} gallery{gi}', '', g, city, live)
            s, prob, miss = grade_audio(langs_with_audio(st))
            aud.append([slug, f'stop {si}', '',
                        ''.join(sorted(langs_with_audio(st))), s, prob, miss])
            scope['aud'].append({'city': city, 'live': live})
            for bi, sub in enumerate(st.get('subStops') or [], 1):
                k = f'stop {si}.sub{bi}'
                add_img('stop', slug, k, '', sub.get('image'), city, live)
                s, prob, miss = grade_audio(langs_with_audio(sub))
                aud.append([slug, k, '',
                            ''.join(sorted(langs_with_audio(sub))), s, prob, miss])
                scope['aud'].append({'city': city, 'live': live})
    return {'imgs': imgs, 'aud': aud, 'scope': scope,
            'enabledCities': sorted(enabled_cities)}


def counts(snap):
    order = ['critical', 'high', 'medium', 'minor', 'ok']
    ic = {k: 0 for k in order}
    ac = {k: 0 for k in order}
    for r in snap['imgs']:
        ic[r[8]] = ic.get(r[8], 0) + 1
    for r in snap['aud']:
        ac[r[4]] = ac.get(r[4], 0) + 1
    return ic, ac


def show_diff(base, cur):
    order = ['critical', 'high', 'medium', 'minor', 'ok']
    bi, ba = counts(base)
    ci, ca = counts(cur)
    for label, b, c, bt, ct in (('IMAGES', bi, ci, len(base['imgs']), len(cur['imgs'])),
                                ('AUDIO', ba, ca, len(base['aud']), len(cur['aud']))):
        print(f'\n{label}  (baseline {bt} -> now {ct})')
        print(f'{"":10} {"before":>8} {"after":>8} {"change":>8}')
        for k in order:
            d = c[k] - b[k]
            arrow = '' if d == 0 else (f'  {d:+d}')
            print(f'{k:10} {b[k]:>8} {c[k]:>8} {arrow:>8}')


def filter_live(snap):
    """Restrict a snapshot to records reachable in the app.

    Returns a plain {'imgs','aud'} snapshot so it can be fed to the same
    counts()/show_diff() as any other. A snapshot taken before scope
    tracking existed has no 'scope' key — return it unchanged rather than
    silently reporting zero.
    """
    sc = snap.get('scope')
    if not sc:
        return {'imgs': snap['imgs'], 'aud': snap['aud']}
    return {
        'imgs': [r for r, m in zip(snap['imgs'], sc['imgs']) if m['live']],
        'aud': [r for r, m in zip(snap['aud'], sc['aud']) if m['live']],
    }


def main():
    tok = token()
    print(f'Fetching from {API} ...', file=sys.stderr)
    snap = collect(tok)
    today = datetime.date.today().isoformat()
    out = ROOT / f'snapshot-{today}.json'
    out.write_text(json.dumps(snap))
    print(f'wrote {out} ({len(snap["imgs"])} images, {len(snap["aud"])} audio)',
          file=sys.stderr)
    live_only = '--live' in sys.argv
    if live_only:
        cities = snap.get('enabledCities') or []
        print(f'\nLIVE SCOPE — enabled cities: {", ".join(cities) or "(none)"}',
              file=sys.stderr)
        view = filter_live(snap)
        ic, ac = counts(view)
        order = ['critical', 'high', 'medium', 'minor', 'ok']
        print(f'\nIMAGES  {len(view["imgs"])} reachable '
              f'(of {len(snap["imgs"])} total)')
        for k in order:
            print(f'  {k:10} {ic[k]:>5}')
        print(f'\nAUDIO   {len(view["aud"])} reachable '
              f'(of {len(snap["aud"])} total)')
        for k in order:
            print(f'  {k:10} {ac[k]:>5}')

    if '--compare' in sys.argv:
        base = json.loads(BASELINE.read_text())
        if live_only:
            # Compare like with like: restrict the baseline to the SAME
            # records that are live now, so the diff shows content change,
            # not the effect of disabling cities.
            keep_i = {r[10] for r in filter_live(snap)['imgs']}
            keep_a = {(r[0], r[1]) for r in filter_live(snap)['aud']}
            base = {
                'imgs': [r for r in base['imgs'] if r[10] in keep_i],
                'aud': [r for r in base['aud'] if (r[0], r[1]) in keep_a],
            }
            snap = filter_live(snap)
            print('\n(diff restricted to currently-reachable content)')
        show_diff(base, snap)


if __name__ == '__main__':
    main()


import os
import sys
import time
from datetime import datetime

import requests
from dotenv import load_dotenv
from sqlalchemy import delete, func, insert, select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db import SessionLocal
from app.models import Card, CardAbility, CardAttack, CardResistance, CardSet, CardWeakness

load_dotenv()
API = 'https://api.pokemontcg.io/v2'
key = os.getenv('POKEMONTCG_API_KEY')
HEADERS = {'X-Api-Key': key} if key else {}
PAGE_SIZE = 250


# ---------- Acceso a la API ----------

def get(path, params=None, tries=100):
    for i in range(tries):
        try:
            r = requests.get(
                API + path,
                params=params,
                headers=HEADERS,
                timeout=120
            )
            r.raise_for_status()
            return r.json()

        except (requests.RequestException, ValueError) as e:
            wait = 1 ** i
            print('Error:', e, '| reintento en', wait, 's')
            time.sleep(wait)

    raise RuntimeError('La API no respondió tras varios intentos')


def pages(path, start_page=1, end_page=None):
    page = start_page
    seen = 0

    while True:
        res = get(path, {'page': page, 'pageSize': PAGE_SIZE})
        items, total = res['data'], res['totalCount']

        if not items:
            return

        seen += len(items)
        yield page, seen, total, items

        if seen >= total or (end_page is not None and page >= end_page):
            return

        page += 1


# ---------- Conversión: objeto de la API -> fila de la base ----------

DATE_FORMATS = (
    '%Y/%m/%d %H:%M:%S',
    '%Y-%m-%d %H:%M:%S',
    '%Y/%m/%d',
    '%Y-%m-%d'
)


def parse_dt(value):
    if not value:
        return None

    text = str(value).strip()

    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue

    try:
        return datetime.fromisoformat(
            text.replace('Z', '+00:00')
        ).replace(tzinfo=None)

    except ValueError:
        print('Fecha no reconocida, se guarda vacía:', repr(value))
        return None


def to_datetime(value):
    return parse_dt(value)


def to_date(value):
    d = parse_dt(value)
    return d.date() if d else None


def legal(obj, fmt):
    return (obj.get('legalities') or {}).get(fmt)


def set_row(s):
    imgs = s.get('images') or {}

    return dict(
        id=s['id'],
        name=s['name'],
        series=s.get('series'),
        printed_total=s.get('printedTotal'),
        total=s.get('total'),
        ptcgo_code=s.get('ptcgoCode'),
        release_date=to_date(s.get('releaseDate')),
        updated_at=to_datetime(s.get('updatedAt')),
        legal_standard=legal(s, 'standard'),
        legal_expanded=legal(s, 'expanded'),
        legal_unlimited=legal(s, 'unlimited'),
        image_symbol=imgs.get('symbol'),
        image_logo=imgs.get('logo'),
    )


def card_row(c):
    imgs = c.get('images') or {}
    trait = c.get('ancientTrait') or {}
    tcg = c.get('tcgplayer') or {}
    cm = c.get('cardmarket') or {}

    return dict(
        id=c['id'],
        name=c['name'],
        supertype=c.get('supertype'),
        subtypes=c.get('subtypes') or [],
        level=c.get('level'),
        hp=c.get('hp'),
        types=c.get('types') or [],
        evolves_from=c.get('evolvesFrom'),
        evolves_to=c.get('evolvesTo') or [],
        rules=c.get('rules') or [],
        ancient_trait_name=trait.get('name'),
        ancient_trait_text=trait.get('text'),
        retreat_cost=c.get('retreatCost') or [],
        converted_retreat_cost=c.get('convertedRetreatCost'),
        set_id=c['set']['id'],
        number=c.get('number'),
        artist=c.get('artist'),
        rarity=c.get('rarity'),
        flavor_text=c.get('flavorText'),
        national_pokedex_numbers=c.get('nationalPokedexNumbers') or [],
        legal_standard=legal(c, 'standard'),
        legal_expanded=legal(c, 'expanded'),
        legal_unlimited=legal(c, 'unlimited'),
        regulation_mark=c.get('regulationMark'),
        image_small=imgs.get('small'),
        image_large=imgs.get('large'),
        tcgplayer_url=tcg.get('url'),
        tcgplayer_updated_at=to_date(tcg.get('updatedAt')),
        tcgplayer_prices=tcg.get('prices'),
        cardmarket_url=cm.get('url'),
        cardmarket_updated_at=to_date(cm.get('updatedAt')),
        cardmarket_prices=cm.get('prices'),
    )


def child_rows(cards):
    abilities, attacks, weaknesses, resistances = [], [], [], []

    for c in cards:
        cid = c['id']

        for i, a in enumerate(c.get('abilities') or []):
            abilities.append(dict(
                card_id=cid,
                position=i,
                name=a.get('name'),
                text=a.get('text'),
                type=a.get('type')
            ))

        for i, a in enumerate(c.get('attacks') or []):
            attacks.append(dict(
                card_id=cid,
                position=i,
                name=a.get('name'),
                cost=a.get('cost') or [],
                converted_energy_cost=a.get('convertedEnergyCost'),
                damage=a.get('damage'),
                text=a.get('text')
            ))

        for i, w in enumerate(c.get('weaknesses') or []):
            weaknesses.append(dict(
                card_id=cid,
                position=i,
                type=w.get('type'),
                value=w.get('value')
            ))

        for i, r in enumerate(c.get('resistances') or []):
            resistances.append(dict(
                card_id=cid,
                position=i,
                type=r.get('type'),
                value=r.get('value')
            ))

    return abilities, attacks, weaknesses, resistances


# ---------- Guardado en la base ----------

def upsert(session, model, rows):
    if not rows:
        return

    stmt = pg_insert(model).values(rows)
    cols = {
        c.name: c
        for c in stmt.excluded
        if c.name != 'id'
    }

    session.execute(
        stmt.on_conflict_do_update(
            index_elements=['id'],
            set_=cols
        )
    )


def save_cards(session, cards):
    ids = [c['id'] for c in cards]

    upsert(session, Card, [card_row(c) for c in cards])

    child_models = (
        CardAbility,
        CardAttack,
        CardWeakness,
        CardResistance
    )

    for model in child_models:
        session.execute(
            delete(model).where(model.card_id.in_(ids))
        )

    for model, rows in zip(child_models, child_rows(cards)):
        if rows:
            session.execute(insert(model), rows)

    session.commit()


# ---------- Ejecución principal ----------

def main():
    start_page = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    end_page = int(sys.argv[2]) if len(sys.argv) > 2 else None

    if start_page < 1 or (end_page is not None and end_page < start_page):
        raise ValueError('Rango de páginas inválido')

    with SessionLocal() as session:

        # Descargar sets
        for page, seen, total, items in pages('/sets'):
            upsert(session, CardSet, [set_row(s) for s in items])
            session.commit()
            print('Sets:', seen, 'de', total)

        # Descargar cartas desde la página indicada
        for page, seen, total, items in pages(
            '/cards',
            start_page=start_page,
            end_page=end_page
        ):
            save_cards(session, items)
            print(
                'Cartas, página', page,
                '-', seen, 'descargadas de', total
            )

        n_cards = session.scalar(
            select(func.count()).select_from(Card)
        )

        print('Listo. Cartas en la base:', n_cards)


if __name__ == '__main__':
    main()

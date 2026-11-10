"""FastAPI application and endpoints for card catalog and collection features."""

import os
import time

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel
from sqlalchemy import BigInteger, Integer, and_, cast, func, select
from sqlalchemy.orm import Session, contains_eager, joinedload, selectinload

from .accounts import router as accounts_router
from .db import SessionLocal
from .models import Card, CardSet, CollectionItem, SetShowcase, WishlistItem
load_dotenv()
app = FastAPI(title='PKollector API')
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(','),
    allow_methods=['*'],
    allow_headers=['*'],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.include_router(accounts_router)

# The 11 energy types returned by the Pokémon TCG API.
TYPES = ['Colorless', 'Darkness', 'Dragon', 'Fairy', 'Fighting', 'Fire',
         'Grass', 'Lightning', 'Metal', 'Psychic', 'Water']


def get_db():
    """Yield a database session and close it after the request completes."""
    with SessionLocal() as db:
        yield db


def iso(d):
    """Serialize a date or datetime to ISO 8601, preserving ``None`` values.

    Args:
        d: A date, datetime, or ``None`` value.

    Returns:
        The ISO 8601 string representation, or ``None``.
    """
    return d.isoformat() if d else None


# Sort card numbers naturally: alphabetic prefix first, then numeric value.
NUM_PREFIX = func.regexp_replace(Card.number, '[0-9].*$', '')
NUM_VALUE = cast(func.nullif(func.regexp_replace(Card.number, '[^0-9]', '', 'g'), ''), BigInteger)
# HP is stored as text, so cast its numeric portion for comparisons and sorting.
HP_VALUE = cast(func.nullif(func.regexp_replace(Card.hp, '[^0-9]', '', 'g'), ''), Integer)

ORDERS = {
    'name': (Card.name, Card.id),
    'number': (NUM_PREFIX, NUM_VALUE.nulls_last(), Card.number, Card.id),
    'newest': (CardSet.release_date.desc().nulls_last(), CardSet.id,
               NUM_PREFIX, NUM_VALUE.nulls_last(), Card.number, Card.id),
    'oldest': (CardSet.release_date.asc().nulls_last(), CardSet.id,
               NUM_PREFIX, NUM_VALUE.nulls_last(), Card.number, Card.id),
    'hp_desc': (HP_VALUE.desc().nulls_last(), Card.name, Card.id),
    'hp_asc': (HP_VALUE.asc().nulls_last(), Card.name, Card.id),
}


def card_out(c: Card):
    """Serialize a card and its related gameplay, set, and market data.

    Args:
        c: Card ORM instance with its relationships loaded.

    Returns:
        A JSON-compatible dictionary containing the full card representation.
    """
    return {
        'id': c.id, 'name': c.name, 'supertype': c.supertype, 'subtypes': c.subtypes,
        'level': c.level, 'hp': c.hp, 'types': c.types,
        'evolves_from': c.evolves_from, 'evolves_to': c.evolves_to, 'rules': c.rules,
        'ancient_trait': (
            {'name': c.ancient_trait_name, 'text': c.ancient_trait_text}
            if c.ancient_trait_name else None
        ),
        'abilities': [{'name': a.name, 'text': a.text, 'type': a.type} for a in c.abilities],
        'attacks': [
            {'name': a.name, 'cost': a.cost, 'converted_energy_cost': a.converted_energy_cost,
             'damage': a.damage, 'text': a.text}
            for a in c.attacks
        ],
        'weaknesses': [{'type': w.type, 'value': w.value} for w in c.weaknesses],
        'resistances': [{'type': r.type, 'value': r.value} for r in c.resistances],
        'retreat_cost': c.retreat_cost, 'converted_retreat_cost': c.converted_retreat_cost,
        'set_id': c.set_id, 'set_name': c.card_set.name, 'set_symbol': c.card_set.image_symbol,
        'number': c.number, 'artist': c.artist, 'rarity': c.rarity,
        'flavor_text': c.flavor_text,
        'national_pokedex_numbers': c.national_pokedex_numbers,
        'legalities': {'standard': c.legal_standard, 'expanded': c.legal_expanded,
                       'unlimited': c.legal_unlimited},
        'regulation_mark': c.regulation_mark,
        'image_small': c.image_small, 'image_large': c.image_large,
        'tcgplayer': {'url': c.tcgplayer_url, 'updated_at': iso(c.tcgplayer_updated_at),
                      'prices': c.tcgplayer_prices},
        'cardmarket': {'url': c.cardmarket_url, 'updated_at': iso(c.cardmarket_updated_at),
                       'prices': c.cardmarket_prices},
    }


def card_summary(c: Card):
    """Serialize the fields needed to render a card in catalog results.

    Args:
        c: Card ORM instance with its set relationship loaded.

    Returns:
        A compact, JSON-compatible card dictionary.
    """
    return {
        'id': c.id, 'name': c.name, 'supertype': c.supertype, 'subtypes': c.subtypes,
        'types': c.types, 'hp': c.hp, 'rarity': c.rarity, 'number': c.number,
        'set_id': c.set_id, 'set_name': c.card_set.name, 'set_symbol': c.card_set.image_symbol,
        'image_small': c.image_small, 'image_large': c.image_large,
    }


LOAD_ALL = (
    joinedload(Card.card_set),
    selectinload(Card.abilities),
    selectinload(Card.attacks),
    selectinload(Card.weaknesses),
    selectinload(Card.resistances),
)


@app.get('/health')
def health():
    """Report that the API process is responsive.

    Returns:
        A dictionary with ``ok`` set to ``True``.
    """
    return {'ok': True}


# Filter options rarely change, so cache them for ten minutes.
FILTERS_TTL = 600
_filters_cache = {'at': 0.0, 'data': None}


@app.get('/filters')
def filters(db: Session = Depends(get_db)):
    """Return distinct catalog values used to populate frontend filters.

    Args:
        db: Database session provided by FastAPI.

    Returns:
        Available sets, series, rarities, supertypes, subtypes, and energy types.
    """
    now = time.time()
    if _filters_cache['data'] and now - _filters_cache['at'] < FILTERS_TTL:
        return _filters_cache['data']

    sets = db.execute(
        select(CardSet.id, CardSet.name, CardSet.series)
        .order_by(CardSet.release_date.desc().nulls_last())
    ).all()
    series = db.scalars(
        select(CardSet.series)
        .where(CardSet.series.is_not(None))
        .group_by(CardSet.series)
        .order_by(func.max(CardSet.release_date).desc().nulls_last())
    ).all()
    rarities = db.scalars(
        select(Card.rarity).where(Card.rarity.is_not(None)).distinct().order_by(Card.rarity)
    ).all()
    supertypes = db.scalars(
        select(Card.supertype).where(Card.supertype.is_not(None)).distinct().order_by(Card.supertype)
    ).all()
    unnested = select(func.unnest(Card.subtypes).label('s')).subquery()
    subtypes = db.scalars(select(unnested.c.s).distinct().order_by(unnested.c.s)).all()

    data = {
        'sets': [{'id': s.id, 'name': s.name, 'series': s.series} for s in sets],
        'series': series,
        'rarities': rarities,
        'supertypes': supertypes,
        'subtypes': subtypes,
        'types': TYPES,
    }
    _filters_cache.update(at=now, data=data)
    return data


@app.get('/sets/{set_id}')
def get_set(set_id: str, db: Session = Depends(get_db)):
    """Return metadata for a single set.

    Args:
        set_id: Pokémon TCG API identifier for the set.
        db: Database session provided by FastAPI.

    Returns:
        Set metadata, including release date and image URLs.

    Raises:
        HTTPException: If the requested set does not exist.
    """
    s = db.get(CardSet, set_id)
    if not s:
        raise HTTPException(404, 'Set not found')
    return {
        'id': s.id, 'name': s.name, 'series': s.series,
        'printed_total': s.printed_total, 'total': s.total,
        'release_date': iso(s.release_date),
        'image_logo': s.image_logo, 'image_symbol': s.image_symbol,
    }

_sets_cache = {'at': 0.0, 'data': None}


@app.get('/sets')
def list_sets(db: Session = Depends(get_db)):
    """List sets with card counts and curated preview cards.

    Args:
        db: Database session provided by FastAPI.

    Returns:
        Set records with metadata, card counts, and showcase previews.
    """
    now = time.time()
    if _sets_cache['data'] and now - _sets_cache['at'] < FILTERS_TTL:
        return _sets_cache['data']

    sets = db.scalars(select(CardSet)).all()
    counts = dict(db.execute(select(Card.set_id, func.count(Card.id)).group_by(Card.set_id)).all())
    rows = db.execute(
        select(SetShowcase.set_id, Card.id, Card.name, Card.number, Card.image_small)
        .select_from(SetShowcase)
        .join(Card, Card.id == SetShowcase.card_id)
        .order_by(SetShowcase.set_id, SetShowcase.position)
    ).all()
    previews = {}
    for r in rows:
        previews.setdefault(r.set_id, []).append({
            'id': r.id, 'name': r.name, 'number': r.number, 'image_small': r.image_small,
        })

    data = [
        {
            'id': s.id, 'name': s.name, 'series': s.series,
            'printed_total': s.printed_total, 'total': s.total,
            'count': counts.get(s.id, 0),
            'release_date': iso(s.release_date),
            'image_logo': s.image_logo, 'image_symbol': s.image_symbol,
            'cards': previews.get(s.id, []),
        }
        for s in sets
    ]
    _sets_cache.update(at=now, data=data)
    return data

@app.get('/cards')
def list_cards(
    q: str | None = None,
    set_id: str | None = None,
    series: str | None = None,
    type: str | None = None,
    subtype: str | None = None,
    rarity: str | None = None,
    supertype: str | None = None,
    hp_min: int | None = None,
    hp_max: int | None = None,
    owned: bool | None = None,
    wanted: bool | None = None,
    duplicates: bool | None = None,
    sort: str = 'name',
    page: int = 1,
    page_size: int = 40,
    x_user_id: str | None = Header(None),
    db: Session = Depends(get_db),
):
    """Search, filter, sort, and paginate the card catalog.

    Args:
        q: Optional case-insensitive card-name query.
        set_id: Optional set identifier filter.
        series: Optional series name filter.
        type: Optional energy type filter.
        subtype: Optional card subtype filter.
        rarity: Optional rarity filter.
        supertype: Optional card category filter.
        hp_min: Optional minimum HP value.
        hp_max: Optional maximum HP value.
        owned: When provided with a user ID, filter by collection ownership.
        wanted: When true, limit results to the user's wishlist.
        duplicates: When true, limit results to cards owned in multiple copies.
        sort: Sort key; unknown values fall back to name order.
        page: One-based page number.
        page_size: Number of results per page, capped at 1,000.
        x_user_id: Optional ID used to apply user-specific filters.
        db: Database session provided by FastAPI.

    Returns:
        A dictionary containing the total match count, page number, and card summaries.
    """
    stmt = select(Card).join(Card.card_set)
    if q:
        stmt = stmt.where(Card.name.ilike('%' + q + '%'))
    if set_id:
        stmt = stmt.where(Card.set_id == set_id)
    if series:
        stmt = stmt.where(CardSet.series == series)
    if type:
        stmt = stmt.where(Card.types.contains([type]))
    if subtype:
        stmt = stmt.where(Card.subtypes.contains([subtype]))
    if rarity:
        stmt = stmt.where(Card.rarity == rarity)
    if supertype:
        stmt = stmt.where(Card.supertype == supertype)
    if hp_min is not None:
        stmt = stmt.where(HP_VALUE >= hp_min)
    if hp_max is not None:
        stmt = stmt.where(HP_VALUE <= hp_max)
    if owned is not None and x_user_id:
        mine = select(CollectionItem.card_id).where(CollectionItem.user_id == x_user_id)
        stmt = stmt.where(Card.id.in_(mine) if owned else Card.id.not_in(mine))
    if wanted and x_user_id:
        wished = select(WishlistItem.card_id).where(WishlistItem.user_id == x_user_id)
        stmt = stmt.where(Card.id.in_(wished))
    if duplicates and x_user_id:
        dups = select(CollectionItem.card_id).where(
            CollectionItem.user_id == x_user_id, CollectionItem.quantity > 1)
        stmt = stmt.where(Card.id.in_(dups))

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    page = max(page, 1)
    page_size = min(max(page_size, 1), 1000)
    order = ORDERS.get(sort, ORDERS['name'])
    rows = db.scalars(
        stmt.options(contains_eager(Card.card_set))
        .order_by(*order)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return {'total': total, 'page': page, 'items': [card_summary(c) for c in rows]}


@app.get('/cards/{card_id}')
def get_card(card_id: str, db: Session = Depends(get_db)):
    """Return the full details for one card.

    Args:
        card_id: Pokémon TCG API identifier for the card.
        db: Database session provided by FastAPI.

    Returns:
        The full serialized card record.

    Raises:
        HTTPException: If the requested card does not exist.
    """
    c = db.scalar(select(Card).options(*LOAD_ALL).where(Card.id == card_id))
    if not c:
        raise HTTPException(404, 'Card not found')
    return card_out(c)


class QtyBody(BaseModel):
    """Request payload for setting a card's collection quantity."""

    quantity: int


class WantBody(BaseModel):
    """Request payload for adding or removing a card from a wishlist."""

    wanted: bool


def need_user(x_user_id: str | None = Header(None)):
    """Require the client identifier used to scope collection data.

    Args:
        x_user_id: Value of the ``X-User-Id`` request header.

    Returns:
        The supplied user identifier.

    Raises:
        HTTPException: If the request does not include the required header.
    """
    if not x_user_id:
        raise HTTPException(400, 'Missing X-User-Id header')
    return x_user_id


@app.get('/collection')
def my_collection(user_id: str = Depends(need_user), db: Session = Depends(get_db)):
    """Return the current user's card quantities.

    Args:
        user_id: Required client identifier from the request header.
        db: Database session provided by FastAPI.

    Returns:
        A mapping of card IDs to owned quantities.
    """
    rows = db.execute(
        select(CollectionItem.card_id, CollectionItem.quantity)
        .where(CollectionItem.user_id == user_id)
    ).all()
    return {r.card_id: r.quantity for r in rows}


@app.put('/collection/{card_id}')
def set_quantity(card_id: str, body: QtyBody,
                 user_id: str = Depends(need_user), db: Session = Depends(get_db)):
    """Create, update, or remove a card quantity in the user's collection.

    A quantity less than or equal to zero removes the card from the collection.

    Args:
        card_id: Pokémon TCG API identifier for the card.
        body: Requested collection quantity.
        user_id: Required client identifier from the request header.
        db: Database session provided by FastAPI.

    Returns:
        The card ID and non-negative quantity after the update.

    Raises:
        HTTPException: If the requested card does not exist.
    """
    if not db.get(Card, card_id):
        raise HTTPException(404, 'Card not found')
    item = db.scalar(
        select(CollectionItem).where(
            CollectionItem.user_id == user_id, CollectionItem.card_id == card_id)
    )
    if body.quantity <= 0:
        if item:
            db.delete(item)
    elif item:
        item.quantity = body.quantity
    else:
        db.add(CollectionItem(user_id=user_id, card_id=card_id, quantity=body.quantity))
    db.commit()
    return {'card_id': card_id, 'quantity': max(body.quantity, 0)}


@app.get('/wishlist')
def my_wishlist(user_id: str = Depends(need_user), db: Session = Depends(get_db)):
    """Return the card IDs in the current user's wishlist.

    Args:
        user_id: Required client identifier from the request header.
        db: Database session provided by FastAPI.

    Returns:
        A list of card IDs.
    """
    return db.scalars(
        select(WishlistItem.card_id).where(WishlistItem.user_id == user_id)
    ).all()


@app.put('/wishlist/{card_id}')
def set_wanted(card_id: str, body: WantBody,
               user_id: str = Depends(need_user), db: Session = Depends(get_db)):
    """Add or remove a card from the current user's wishlist.

    Args:
        card_id: Pokémon TCG API identifier for the card.
        body: Whether the card should be on the wishlist.
        user_id: Required client identifier from the request header.
        db: Database session provided by FastAPI.

    Returns:
        The card ID and its requested wishlist state.

    Raises:
        HTTPException: If the requested card does not exist.
    """
    if not db.get(Card, card_id):
        raise HTTPException(404, 'Card not found')
    item = db.scalar(
        select(WishlistItem).where(
            WishlistItem.user_id == user_id, WishlistItem.card_id == card_id)
    )
    if body.wanted and not item:
        db.add(WishlistItem(user_id=user_id, card_id=card_id))
    elif not body.wanted and item:
        db.delete(item)
    db.commit()
    return {'card_id': card_id, 'wanted': body.wanted}


@app.get('/progress')
def progress(user_id: str = Depends(need_user), db: Session = Depends(get_db)):
    """Summarize owned card counts per set for the current user.

    Args:
        user_id: Required client identifier from the request header.
        db: Database session provided by FastAPI.

    Returns:
        Overall totals and per-set owned and total card counts.
    """
    stmt = (
        select(
            CardSet.id, CardSet.name, CardSet.series,
            func.count(Card.id).label('total'),
            func.count(CollectionItem.id).label('owned'),
        )
        .join(Card, Card.set_id == CardSet.id)
        .outerjoin(CollectionItem, and_(
            CollectionItem.card_id == Card.id, CollectionItem.user_id == user_id))
        .group_by(CardSet.id, CardSet.name, CardSet.series, CardSet.release_date)
        .order_by(CardSet.release_date.desc().nulls_last())
    )
    sets = [
        {'id': r.id, 'name': r.name, 'series': r.series, 'total': r.total, 'owned': r.owned}
        for r in db.execute(stmt).all()
    ]
    return {
        'total': sum(s['total'] for s in sets),
        'owned': sum(s['owned'] for s in sets),
        'sets': sets,
    }
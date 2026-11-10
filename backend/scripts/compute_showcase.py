"""Select and persist representative preview cards for each set."""

import math
from collections import defaultdict

from sqlalchemy import delete, insert, select

from app.db import SessionLocal
from app.models import Card, SetShowcase

PER_SET = 6
SAMPLE = ('base1', 'swsh12pt5', 'sv3pt5')

TIERS = {
    0: ['Common'],
    1: ['Uncommon'],
    2: ['Rare', 'Promo', 'Classic Collection', 'Black White Rare', 'Pikachu Rare'],
    3: ['Rare Holo', 'Double Rare', 'Rare Prime', 'Rare BREAK', 'Rare Holo LV.X', 'Rare Holo Star',
        'LEGEND', 'Rare ACE', 'ACE SPEC Rare', 'Amazing Rare', 'Radiant Rare', 'Rare Prism Star',
        'Trainer Gallery Rare Holo', 'MEGA_ATTACK_RARE'],
    4: ['Rare Holo EX', 'Rare Holo ex', 'Rare Holo GX', 'Rare Holo V', 'Holo Rare V', 'Rare Ultra',
        'Ultra Rare', 'Rare Shining', 'Rare Shiny', 'Shiny Rare', 'Futuristic Rare'],
    5: ['Rare Holo VMAX', 'Rare Holo VSTAR', 'Holo Rare VMAX', 'Holo Rare VSTAR', 'Illustration Rare',
        'Rare Shiny GX', 'Shiny Ultra Rare'],
    6: ['Rare Rainbow', 'Rare Secret', 'Hyper Rare', 'Special Illustration Rare', 'Mega Hyper Rare'],
}
RARITY_RANK = {name: tier for tier, names in TIERS.items() for name in names}

# Iconic Pokémon by National Pokédex number; adjust this set to tune previews.
ICONIC = {
    1, 3, 4, 6, 7, 9, 25, 94, 130, 131, 133, 134, 135, 136, 143, 144, 145, 146, 149, 150, 151,
    196, 197, 249, 250, 282, 384, 445, 448, 483, 484, 487, 493, 658, 700, 778, 791, 792,
    888, 889, 906, 909, 912, 1007, 1008,
}


def unit_price(prices):
    """Return the lowest positive market price found in a price mapping.

    Args:
        prices: Mapping of market variants to their price data, or ``None``.

    Returns:
        The lowest positive market price, or ``None`` when no price is available.
    """
    if not prices:
        return None
    values = [
        v['market'] for v in prices.values()
        if isinstance(v, dict) and isinstance(v.get('market'), (int, float)) and v['market'] > 0
    ]
    return min(values) if values else None


def score(card):
    """Calculate a showcase ranking score for a card.

    The score combines rarity, market value, Pokédex prominence, and card
    category to prioritize visually or culturally notable cards.

    Args:
        card: Card-like row containing rarity, prices, Pokédex numbers, and type.

    Returns:
        A numeric score; higher values rank ahead of lower values.
    """
    tier = RARITY_RANK.get(card.rarity, 2 if card.rarity else 1)
    total = tier * 100
    price = unit_price(card.tcgplayer_prices)
    if price:
        total += min(math.log10(1 + price) * 60, 180)
    if any(n in ICONIC for n in (card.national_pokedex_numbers or [])):
        total += 120
    total += {'Pokémon': 0, 'Trainer': -80}.get(card.supertype, -200)
    return total


def main():
    """Rank cards in each set and replace the persisted showcase selection."""
    with SessionLocal() as db:
        rows = db.execute(
            select(Card.id, Card.name, Card.set_id, Card.supertype, Card.rarity,
                   Card.national_pokedex_numbers, Card.tcgplayer_prices)
        ).all()

        by_set = defaultdict(list)
        for r in rows:
            by_set[r.set_id].append((score(r), r))

        picks = {}
        for set_id, items in by_set.items():
            items.sort(key=lambda x: (-x[0], x[1].id))
            seen, chosen = set(), []
            for _, r in items:
                key = tuple(sorted(r.national_pokedex_numbers or [])) or (r.name,)
                if key in seen:
                    continue
                seen.add(key)
                chosen.append(r)
                if len(chosen) == PER_SET:
                    break
            if len(chosen) < PER_SET:
                ids = {c.id for c in chosen}
                for _, r in items:
                    if r.id not in ids:
                        chosen.append(r)
                        ids.add(r.id)
                    if len(chosen) == PER_SET:
                        break
            picks[set_id] = chosen

        out = [
            {'set_id': set_id, 'card_id': r.id, 'position': pos}
            for set_id, chosen in picks.items()
            for pos, r in enumerate(chosen)
        ]
        db.execute(delete(SetShowcase))
        db.execute(insert(SetShowcase), out)
        db.commit()

        print(len(picks), 'sets,', len(out), 'showcase cards')
        for set_id in SAMPLE:
            if set_id in picks:
                print(set_id, '->', [r.name for r in picks[set_id]])


if __name__ == '__main__':
    main()
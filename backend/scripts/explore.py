"""Inspect sample responses from the Pokémon TCG and TCGdex APIs."""

import json
import os
import requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv('POKEMONTCG_API_KEY')
HEADERS = {'X-Api-Key': key} if key else {}


def probe(name, url, params=None, headers=None):
    """Request an API endpoint and print a short response preview.

    Args:
        name: Human-readable service name for the diagnostic output.
        url: Endpoint URL to request.
        params: Optional query parameters.
        headers: Optional request headers.

    Returns:
        The decoded JSON response, or ``None`` if the request or decoding fails.
    """
    print('=====', name, url)
    try:
        r = requests.get(url, params=params, headers=headers, timeout=60)
    except requests.RequestException as e:
        print('Connection error:', e)
        return None
    print('status:', r.status_code, '| content-type:', r.headers.get('content-type'))
    print('First 300 characters:', r.text[:300])
    try:
        return r.json()
    except ValueError:
        print('The response is not JSON')
        return None


def main():
    """Fetch representative card data from both supported API services."""
    pokemon_tcg = probe(
        'pokemontcg.io',
        'https://api.pokemontcg.io/v2/cards',
        {'q': 'name:charizard', 'pageSize': 2},
        HEADERS,
    )
    if pokemon_tcg and pokemon_tcg.get('data'):
        print(json.dumps(pokemon_tcg['data'][0], indent=2, ensure_ascii=False)[:3000])

    tcgdex = probe('TCGdex', 'https://api.tcgdex.net/v2/en/cards/base1-4')
    if tcgdex:
        print(json.dumps(tcgdex, indent=2, ensure_ascii=False)[:3000])


if __name__ == '__main__':
    main()
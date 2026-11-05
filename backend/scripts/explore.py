import json
import os
import requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv('POKEMONTCG_API_KEY')
HEADERS = {'X-Api-Key': key} if key else {}


def probe(name, url, params=None, headers=None):
    print('=====', name, url)
    try:
        r = requests.get(url, params=params, headers=headers, timeout=60)
    except requests.RequestException as e:
        print('Error de conexión:', e)
        return None
    print('status:', r.status_code, '| content-type:', r.headers.get('content-type'))
    print('primeros 300 caracteres:', r.text[:300])
    try:
        return r.json()
    except ValueError:
        print('La respuesta no es JSON')
        return None


a = probe('pokemontcg.io', 'https://api.pokemontcg.io/v2/cards', {'q': 'name:charizard', 'pageSize': 2}, HEADERS)
if a and a.get('data'):
    print(json.dumps(a['data'][0], indent=2, ensure_ascii=False)[:3000])

b = probe('TCGdex', 'https://api.tcgdex.net/v2/en/cards/base1-4')
if b:
    print(json.dumps(b, indent=2, ensure_ascii=False)[:3000])
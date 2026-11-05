import sys

from app.db import engine
from app.models import Base

if 'reset' in sys.argv:
    Base.metadata.drop_all(engine)
    print('Tablas borradas')
Base.metadata.create_all(engine)
print('Tablas creadas')
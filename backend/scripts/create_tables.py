"""Create the application's database tables, optionally dropping them first."""

import sys

from app.db import engine
from app.models import Base


def main():
    """Create all ORM tables, or reset the schema when ``reset`` is provided."""
    if 'reset' in sys.argv:
        Base.metadata.drop_all(engine)
        print('Tables dropped')
    Base.metadata.create_all(engine)
    print('Tables created')


if __name__ == '__main__':
    main()
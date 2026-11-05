from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class CardSet(Base):
    __tablename__ = 'sets'
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    series: Mapped[str | None] = mapped_column(String, index=True)
    printed_total: Mapped[int | None] = mapped_column(Integer)
    total: Mapped[int | None] = mapped_column(Integer)
    ptcgo_code: Mapped[str | None] = mapped_column(String)
    release_date: Mapped[date | None] = mapped_column(Date)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime)
    legal_standard: Mapped[str | None] = mapped_column(String)
    legal_expanded: Mapped[str | None] = mapped_column(String)
    legal_unlimited: Mapped[str | None] = mapped_column(String)
    image_symbol: Mapped[str | None] = mapped_column(String)
    image_logo: Mapped[str | None] = mapped_column(String)


class Card(Base):
    __tablename__ = 'cards'
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, index=True)
    supertype: Mapped[str | None] = mapped_column(String, index=True)
    subtypes: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    level: Mapped[str | None] = mapped_column(String)
    hp: Mapped[str | None] = mapped_column(String)
    types: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    evolves_from: Mapped[str | None] = mapped_column(String)
    evolves_to: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    rules: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    ancient_trait_name: Mapped[str | None] = mapped_column(String)
    ancient_trait_text: Mapped[str | None] = mapped_column(Text)
    retreat_cost: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    converted_retreat_cost: Mapped[int | None] = mapped_column(Integer)
    set_id: Mapped[str] = mapped_column(ForeignKey('sets.id'), index=True)
    number: Mapped[str | None] = mapped_column(String)
    artist: Mapped[str | None] = mapped_column(String)
    rarity: Mapped[str | None] = mapped_column(String, index=True)
    flavor_text: Mapped[str | None] = mapped_column(Text)
    national_pokedex_numbers: Mapped[list[int]] = mapped_column(ARRAY(Integer), default=list)
    legal_standard: Mapped[str | None] = mapped_column(String)
    legal_expanded: Mapped[str | None] = mapped_column(String)
    legal_unlimited: Mapped[str | None] = mapped_column(String)
    regulation_mark: Mapped[str | None] = mapped_column(String)
    image_small: Mapped[str | None] = mapped_column(String)
    image_large: Mapped[str | None] = mapped_column(String)
    tcgplayer_url: Mapped[str | None] = mapped_column(String)
    tcgplayer_updated_at: Mapped[date | None] = mapped_column(Date)
    tcgplayer_prices: Mapped[dict | None] = mapped_column(JSONB(none_as_null=True))
    cardmarket_url: Mapped[str | None] = mapped_column(String)
    cardmarket_updated_at: Mapped[date | None] = mapped_column(Date)
    cardmarket_prices: Mapped[dict | None] = mapped_column(JSONB(none_as_null=True))
    
    card_set: Mapped[CardSet] = relationship()
    abilities: Mapped[list['CardAbility']] = relationship(
        cascade='all, delete-orphan', order_by='CardAbility.position')
    attacks: Mapped[list['CardAttack']] = relationship(
        cascade='all, delete-orphan', order_by='CardAttack.position')
    weaknesses: Mapped[list['CardWeakness']] = relationship(
        cascade='all, delete-orphan', order_by='CardWeakness.position')
    resistances: Mapped[list['CardResistance']] = relationship(
        cascade='all, delete-orphan', order_by='CardResistance.position')


class CardAbility(Base):
    __tablename__ = 'card_abilities'
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    card_id: Mapped[str] = mapped_column(ForeignKey('cards.id', ondelete='CASCADE'), index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    name: Mapped[str | None] = mapped_column(String)
    text: Mapped[str | None] = mapped_column(Text)
    type: Mapped[str | None] = mapped_column(String)


class CardAttack(Base):
    __tablename__ = 'card_attacks'
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    card_id: Mapped[str] = mapped_column(ForeignKey('cards.id', ondelete='CASCADE'), index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    name: Mapped[str | None] = mapped_column(String)
    cost: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    converted_energy_cost: Mapped[int | None] = mapped_column(Integer)
    damage: Mapped[str | None] = mapped_column(String)
    text: Mapped[str | None] = mapped_column(Text)


class CardWeakness(Base):
    __tablename__ = 'card_weaknesses'
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    card_id: Mapped[str] = mapped_column(ForeignKey('cards.id', ondelete='CASCADE'), index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    type: Mapped[str | None] = mapped_column(String)
    value: Mapped[str | None] = mapped_column(String)


class CardResistance(Base):
    __tablename__ = 'card_resistances'
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    card_id: Mapped[str] = mapped_column(ForeignKey('cards.id', ondelete='CASCADE'), index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    type: Mapped[str | None] = mapped_column(String)
    value: Mapped[str | None] = mapped_column(String)


class CollectionItem(Base):
    __tablename__ = 'collection'
    __table_args__ = (UniqueConstraint('user_id', 'card_id'),)
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String, index=True)
    card_id: Mapped[str] = mapped_column(ForeignKey('cards.id'), index=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
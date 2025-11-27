export interface Card {
    id: string;
    name: string;
    mana_cost?: string;
    cmc: number;
    type_line: string;
    oracle_text?: string;
    colors?: string[];
    color_identity?: string[];
    set: string;
    rarity: string;
    prices?: {
        usd?: string;
        usd_foil?: string;
    };
    image_uris?: {
        small?: string;
        normal?: string;
        large?: string;
    };
}

export interface DeckCard {
    name: string;
    quantity: number;
}

export interface Deck {
    cards: DeckCard[];
    totalCards: number;
}

export interface CachedCard {
    card: Card;
    cachedAt: string;
}

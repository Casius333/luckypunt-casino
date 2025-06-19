-- Insert mock games data for development/staging
INSERT INTO public.games (provider_id, name, type, provider, wager_multiplier, is_active) VALUES
-- Coin Toss (our custom game)
(1001, 'Coin Toss', 'table', 'LuckyPunt', 1.0, true),

-- Slots (1.0x wagering multiplier)
(2001, 'Sweet Bonanza', 'slots', 'Pragmatic Play', 1.0, true),
(2002, 'Gates of Olympus', 'slots', 'Pragmatic Play', 1.0, true),
(2003, 'Fruit Party', 'slots', 'Pragmatic Play', 1.0, true),
(2004, 'Book of Dead', 'slots', 'Play\'n GO', 1.0, true),
(2005, 'Starburst', 'slots', 'NetEnt', 1.0, true),
(2006, 'Gonzo\'s Quest', 'slots', 'NetEnt', 1.0, true),
(2007, 'Big Bass Bonanza', 'slots', 'Pragmatic Play', 1.0, true),
(2008, 'Wolf Gold', 'slots', 'Pragmatic Play', 1.0, true),
(2009, 'The Dog House', 'slots', 'Pragmatic Play', 1.0, true),
(2010, 'Reactoonz', 'slots', 'Play\'n GO', 1.0, true),
(2011, 'Dead or Alive 2', 'slots', 'NetEnt', 1.0, true),
(2012, 'Money Train 2', 'slots', 'Relax Gaming', 1.0, true),
(2013, 'Jammin\' Jars', 'slots', 'Push Gaming', 1.0, true),
(2014, 'Book of Ra', 'slots', 'Novomatic', 1.0, true),
(2015, 'Buffalo King', 'slots', 'Pragmatic Play', 1.0, true),
(2016, 'Razor Shark', 'slots', 'Push Gaming', 1.0, true),
(2017, 'Wild West Gold', 'slots', 'Pragmatic Play', 1.0, true),
(2018, 'Book of Shadows', 'slots', 'Nolimit City', 1.0, true),
(2019, 'Fire Joker', 'slots', 'Play\'n GO', 1.0, true),
(2020, 'Rise of Olympus', 'slots', 'Play\'n GO', 1.0, true),
(2021, 'Moon Princess', 'slots', 'Play\'n GO', 1.0, true),
(2022, 'Mental', 'slots', 'Nolimit City', 1.0, true),
(2023, 'San Quentin', 'slots', 'Nolimit City', 1.0, true),

-- Table Games (0.03x wagering multiplier - much lower contribution)
(3001, 'European Roulette', 'table', 'Evolution Gaming', 0.03, true),
(3002, 'American Roulette', 'table', 'Evolution Gaming', 0.03, true),
(3003, 'Baccarat', 'table', 'Evolution Gaming', 0.03, true),
(3004, 'Blackjack', 'table', 'Evolution Gaming', 0.03, true),
(3005, 'Poker', 'table', 'Evolution Gaming', 0.03, true),
(3006, 'Craps', 'table', 'Evolution Gaming', 0.03, true),

-- Live Casino (0.03x wagering multiplier)
(4001, 'Live Roulette', 'live', 'Evolution Gaming', 0.03, true),
(4002, 'Live Baccarat', 'live', 'Evolution Gaming', 0.03, true),
(4003, 'Live Blackjack', 'live', 'Evolution Gaming', 0.03, true),
(4004, 'Live Poker', 'live', 'Evolution Gaming', 0.03, true),

-- Jackpot Games (1.0x wagering multiplier)
(5001, 'Mega Fortune', 'jackpot', 'NetEnt', 1.0, true),
(5002, 'Hall of Gods', 'jackpot', 'NetEnt', 1.0, true),
(5003, 'Mega Moolah', 'jackpot', 'Microgaming', 1.0, true),

-- Plinko (1.0x wagering multiplier)
(6001, 'Plinko', 'plinko', 'LuckyPunt', 1.0, true),

-- Other Games (0.5x wagering multiplier)
(7001, 'Keno', 'other', 'LuckyPunt', 0.5, true),
(7002, 'Scratch Cards', 'other', 'LuckyPunt', 0.5, true)
ON CONFLICT (provider_id) DO NOTHING; 
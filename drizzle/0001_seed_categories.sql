-- Categories are reference data, not content: the create form cannot function
-- without them, so a fresh deployment must have them from the first boot.
-- They live in a migration rather than a seed script for exactly that reason.
--
-- ON CONFLICT keeps this safe to re-run and lets a later migration adjust a
-- name or colour without fighting rows that already exist.
insert into "categories" ("slug", "name", "icon", "accent_color", "sort_order", "is_system") values
  ('people',     'People',          'people',     '#38bdf8',  0, false),
  ('characters', 'Characters',      'characters', '#c084fc',  1, false),
  ('animals',    'Animals',         'animals',    '#84cc16',  2, false),
  ('food',       'Food & Drink',    'food',       '#fb923c',  3, false),
  ('objects',    'Objects',         'objects',    '#8d8378',  4, false),
  ('tech',       'Tech & Internet', 'tech',       '#2dd4bf',  5, false),
  ('games',      'Games',           'games',      '#6366f1',  6, false),
  ('screen',     'Movies & TV',     'screen',     '#f43f5e',  7, false),
  ('music',      'Music',           'music',      '#f472b6',  8, false),
  ('sports',     'Sports',          'sports',     '#facc15',  9, false),
  ('places',     'Places',          'places',     '#22d3ee', 10, false),
  ('concepts',   'Concepts',        'concepts',   '#a3e635', 11, false),
  ('mythical',   'Mythical',        'mythical',   '#fb7185', 12, false),
  ('vehicles',   'Vehicles',        'vehicles',   '#94a3b8', 13, false),
  ('cursed',     'Cursed',          'cursed',     '#a855f7', 14, false)
on conflict ("slug") do update set
  "name" = excluded."name",
  "icon" = excluded."icon",
  "accent_color" = excluded."accent_color",
  "sort_order" = excluded."sort_order";

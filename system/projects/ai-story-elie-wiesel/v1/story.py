# Elie Wiesel and "wounded hope". V1. Narrator: ElevenLabs George. Template: "This man ... This is the story of ..." with an arrow on him.
# His words: "The Perils of Indifference", White House, 12 April 1999 (US government footage, youtube ldylvNscW54) and
# "The Urgency of Hope", 92nd Street Y, New York, 5 March 1998 (youtube 844UQzNbChw: AUDIO ONLY, 92Y states its copyright, NOT cleared).
# Facts: DOSSIER.md (Nobel Foundation, USHMM). Nothing graphic is shown.
W = "../src/ldylvNscW54.mp4"
Y = "../src/844UQzNbChw.mp4"
VOICE = "JBFqnCBsd6RMkjVDRZzb"          # George
L = [("h1", "This man lost his mother, his father and his little sister in the Holocaust."),
     ("h2", "He was fifteen."),
     ("h3", "And he still chose hope."),
     ("h4", "This is the story of"),
     ("h5", "Elie Wiesel."),
     ("n2", "Elie Wiesel grew up in a small town in Romania. In 1944, he was put on a train to Auschwitz."),
     ("n3", "His mother and his little sister were murdered the night they arrived. His father died weeks before the camp was freed."),
     ("n4", "Years later, he wrote a book about it, called Night. Millions of people have read it."),
     ("n5", "In 1986, he won the Nobel Peace Prize. He spent his life warning the world about one thing."),
     ("n7", "And when people asked how he could still believe in tomorrow, he said this."),
     ("n9", "This story is proof that hope is a choice.")]
ON = {"b6": (W, [(1411.12, 1415.80)], (1411.12, 1415.85)),
      "b8": (Y, [(2534.70, 2537.98)], (2534.70, 2535.6))}
CLIPS = {"wh": (W, 892.6, 896.4)}
VID = {k: f"src/{k}.mp4" for k in CLIPS}
SEQ = [("h1", 0), ("h2", 0), ("h3", 0), ("h4", 0), ("h5", .30), ("n2", .25), ("n3", .25), ("n4", .25), ("n5", .25), ("b6", .25), ("n7", .25), ("b8", .30), ("n9", .40)]
WHO = {"b6": "ELIE WIESEL &middot; THE WHITE HOUSE, 1999", "b8": "ELIE WIESEL &middot; HIS VOICE, 1998"}
END = ("DESPAIR", "HOPE.")
TEXT = {
    "h1": "~This man lost his mother, his father and his little sister in the Holocaust.", "h2": "~He was fifteen.", "h3": "~And he still chose hope.", "h4": "~This is the story of", "h5": "~Elie Wiesel.",
    "n2": "~Elie Wiesel grew up | ~in a small town | ~in Romania. | In 1944, | he was put on a train | to *Auschwitz.",
    "n3": "His mother | and his little sister | were murdered | the night they *arrived. | His father died | weeks before | the camp was *freed.",
    "n4": "Years later, | he wrote a book | about it, | called *Night. | Millions of people | have *read it.",
    "n5": "~In 1986, | ~he won the | ~Nobel Peace Prize. | He spent his life | warning the world | about *one thing.",
    "b6": "Indifference | is always | the friend | of *the enemy.",
    "n7": "And when people asked | how he could still | believe in *tomorrow, | he said *this.",
    "b8": "No hope | is as powerful | as a *wounded hope.",
    "n9": "This story is proof | that hope | is *a choice.",
}
WH = "THE WHITE HOUSE, 1999 &middot; US GOVERNMENT FOOTAGE"
CREDIT = {"X": WH, "wh": WH}
WC = " &middot; WIKIMEDIA COMMONS"
PC = {"w_1966_portrait.jpg": "ELIE WIESEL, 1966" + WC, "w_1966_crop.jpg": "ELIE WIESEL, 1966" + WC, "w_1944_age15.jpg": "ELIE WIESEL, AGED 15" + WC, "w_2010_shankbone.jpg": "ELIE WIESEL, 2010 &middot; DAVID SHANKBONE, CC BY", "w_1990s_portrait_smith.jpg": "ELIE WIESEL" + WC,
      "sighet_house_2013.jpg": "HIS CHILDHOOD HOME, SIGHET, ROMANIA" + WC, "sighet_synagogue_pd.jpg": "SIGHET, ROMANIA" + WC, "birkenau_1944_arrival.jpg": "AUSCHWITZ-BIRKENAU, 1944 &middot; PUBLIC DOMAIN",
      "birkenau_gate_tracks_2019.jpg": "AUSCHWITZ-BIRKENAU" + WC, "birkenau_rails.jpg": "AUSCHWITZ-BIRKENAU" + WC, "buchenwald_gate.jpg": "BUCHENWALD" + WC, "book_la_nuit_1958.jpg": "LA NUIT, 1958" + WC, "book_night_flickr1.jpg": "NIGHT" + WC,
      "nobel_1986_item.jpg": "NOBEL PEACE PRIZE, 1986" + WC, "oslo_city_hall.jpg": "OSLO" + WC, "w_1985_gold_medal.jpg": "ELIE WIESEL, 1985 &middot; US GOVERNMENT PHOTO", "w_2009_portrait.jpg": "ELIE WIESEL, 2009" + WC,
      "w_2012_shankbone.jpg": "ELIE WIESEL, 2012 &middot; DAVID SHANKBONE, CC BY", "w_2003_portrait.jpg": "ELIE WIESEL, 2003" + WC, "birkenau_gate_pd.jpg": "AUSCHWITZ-BIRKENAU &middot; PUBLIC DOMAIN"}
PLAN = [
    ("h1", [(1, "P", "w_1966_crop.jpg", 50, "glow still arrow:540,600,4.0,350 title:this_man_lost_his_family|IN_THE|HOLOCAUST")]),
    ("h2", [(1, "P", "w_1944_age15.jpg", 50, "title:he_was|FIFTEEN")]),
    ("h3", [(1, "P", "w_2010_shankbone.jpg", 50, "title:and_he_still_chose|HOPE")]),
    ("h4", [(1, "P", "sighet_house_2013.jpg", 50, "title:this_is|THE_STORY|OF")]),
    ("h5", [(1, "P", "w_1990s_portrait_smith.jpg", 50, "bigflash title:|ELIE|WIESEL")]),
    ("n2", [(.34, "X2", "paper.jpg", 50, "map:ROMANIA,24.6,46.0;POLAND,19.4,51.6@8,34,41,57"), (.17, "P", "sighet_house_2013.jpg", 50, "whip"), (.16, "P", "sighet_synagogue_pd.jpg", 50, ""), (.16, "P", "g_train.jpg", 50, ""), (.17, "P", "birkenau_gate_tracks_2019.jpg", 50, "")]),
    ("n3", [(.2, "P", "birkenau_1944_arrival.jpg", 50, "whip"), (.2, "P", "birkenau_rails.jpg", 50, ""), (.2, "P", "g_shoes.jpg", 50, ""), (.2, "P", "buchenwald_gate.jpg", 50, ""), (.2, "P", "g_candle.jpg", 50, "")]),
    ("n4", [(.25, "P", "g_desk.jpg", 50, "whip"), (.25, "P", "book_la_nuit_1958.jpg", 50, ""), (.25, "P", "book_night_flickr1.jpg", 50, ""), (.25, "P", "w_1966_crop.jpg", 50, "")]),
    ("n5", [(.3, "X2", "paper.jpg", 50, "count:#111111|Nobel_Peace_Prize|1986"), (.24, "P", "nobel_1986_item.jpg", 50, "whip"), (.23, "P", "oslo_city_hall.jpg", 50, ""), (.23, "P", "w_1985_gold_medal.jpg", 50, "")]),
    ("b6", [(-2.4, "V", "b_b6_0.mp4@0", "tall50", "whip"), (1, "V", "b_b6_0.mp4@2.4", "tall50", "z1.2")]),
    ("n7", [(.5, "P", "w_2003_portrait.jpg", 50, "whip"), (.5, "P", "w_2009_portrait.jpg", 50, "")]),
    ("b8", [(1, "P", "w_2012_shankbone.jpg", 50, "whip")]),
    ("n9", [(.5, "P", "g_candle.jpg", 50, "whip"), (.5, "P", "w_1990s_portrait_smith.jpg", 50, "shim")]),
    ("end", [(1, "P", "oslo_city_hall.jpg", 50, "")]),
]
GEN = {"train": "An old wooden freight train wagon standing on a railway track in fog at dawn, seen from the side, closed sliding door, bare trees, no people",
       "shoes": "A single pair of small worn leather shoes placed side by side on bare wooden floorboards in a shaft of window light. Only the shoes and the floor. Absolutely no people, no figures, no photographs of people anywhere in the collage",
       "candle": "One memorial candle burning in a glass on a stone ledge in the dark, a small warm flame, no people",
       "desk": "An old typewriter on a small wooden desk by a window in a 1950s Paris attic room, a stack of handwritten pages beside it, a cup of coffee, morning light, no people"}
GENSTYLE = "Mixed-media hand-cut paper collage, editorial zine style, vertical. Torn paper edges, scissor-cut borders, tape corners, halftone print dot patterns, paper drop shadows. Printed-texture cut-outs from vintage black-and-white photography. NOT 3D, NOT CGI. Palette: pale grey paper, charcoal black, one warm gold accent. No text, no letters, no faces. Subject: "

# Dor Shachar and Nissim V1. Narrator: ElevenLabs Matilda. A NARROW kindness story: the man who fed a boy alone on a building site. No politics, no claim of reconciliation (DOSSIER.md, section 0).
# His words: STV studio interview, 2021 (youtube dcPX9jGe04c), Hebrew, credited on screen, NOT cleared. English captions are a translation that a Hebrew speaker (Tal) must check before posting.
# Everything rests on his own account. No face is shown as Nissim (no picture of him exists).
V = "../src/stv2021_dcPX9jGe04c.mp4"
VOICE = "XrExE9yKIg1WjnnlVkGX"          # Matilda
L = [  # hook: "No father, far from Gaza. You should hear who stopped." (ig-reel hookscore 100.0)
     ("h1", "No father."),
     ("h2", "Far from Gaza."),
     ("h3", "You should hear"),
     ("h4", "who stopped:"),
     ("h5", "a stranger, with one question."),
     ("n3", "The stranger's name was Nissim. He said: half an hour, and I'll be back."),
     ("n5", "For years, Nissim and his wife taught him to read. Every Passover, they kept him a seat at their table. The same chair."),
     ("n7", "Today his name is Dor Shachar, and he has a family of his own."),
     ("n8", "This story is proof that one question can change a life.")]
ON = {"b2": (V, [(633.25, 637.85), (638.95, 639.78)], (633.25, 639.0)),
      "b4": (V, [(645.90, 651.38)], (645.90, 651.42)),
      "b6": (V, [(692.52, 694.36)], (692.52, 694.40))}
BITELANG = {"b2": "he", "b4": "he", "b6": "he"}
CLIPS = {"open": (V, 708.0, 710.6)}
VID = {k: f"src/{k}.mp4" for k in CLIPS}
SEQ = [("h1", 0), ("h2", 0), ("h3", 0), ("h4", 0), ("h5", 0.3), ("b2", 0.25), ("n3", 0.25), ("b4", 0.25), ("n5", 0.25), ("b6", 0.25), ("n7", 0.25), ("n8", 0.4)]
WHO = {"b2": "DOR SHACHAR", "b4": "DOR SHACHAR", "b6": "DOR SHACHAR"}
END = ("ALONE", "FAMILY.")
TEXT = {
    "h1": "~No father.", "h2": "~Far from Gaza.", "h3": "~You should hear", "h4": "~who stopped:", "h5": "~a stranger, with one question.",
    "b2": "He asks me, | in Arabic: | &ldquo;Where is your father?&rdquo; | I told him: | I&rsquo;m *alone.",
    "n3": "The stranger&rsquo;s name | was *Nissim. | He said: | half an hour, | and I&rsquo;ll *be back.",
    "b4": "He brought | *clothes, | hot food, | a stereo, | and a *cassette.",
    "n5": "For years, | Nissim and his wife | taught him | to *read. | Every Passover, | they kept him a seat | at their table. | The *same chair.",
    "b6": "He is | *my father.",
    "n7": "Today his name | is *Dor Shachar, | and he has | a family | *of his own.",
    "n8": "This story is proof | that one question | can change | *a life.",
}
STV = "STV, 2021 &middot; TRANSLATED FROM HEBREW"
CREDIT = {"X": STV, "open": "STV, 2021"}
WC = " &middot; WIKIMEDIA COMMONS"
PC = {"gaza_port1980.jpg": "GAZA, 1980" + WC, "rishon_constr_a.jpg": "RISHON LEZION, ISRAEL" + WC, "rishon_constr_b.jpg": "RISHON LEZION, ISRAEL" + WC, "rishon_crane_sunset.jpg": "RISHON LEZION, ISRAEL" + WC, "rishon_crane_sunrise.jpg": "RISHON LEZION, ISRAEL" + WC,
      "seder_table2.jpg": "PASSOVER SEDER TABLE" + WC, "seder_table_fr.jpg": "PASSOVER SEDER TABLE" + WC, "shabbat_table.jpg": "WIKIMEDIA COMMONS", "rishon_8790.jpg": "RISHON LEZION, ISRAEL" + WC, "rishon_syn_night.jpg": "RISHON LEZION, ISRAEL" + WC, "gaza_view2009.jpg": "GAZA" + WC}
PLAN = [
    ("h1", [(1, "P", "g_boy.jpg", 50, "glow title:|NO|FATHER")]),
    ("h2", [(1, "P", "rishon_constr_a.jpg", 50, "title:far_from|GAZA")]),
    ("h3", [(1, "P", "g_night.jpg", 50, "title:you_should|HEAR")]),
    ("h4", [(1, "P", "g_man.jpg", 50, "title:who|STOPPED")]),
    ("h5", [(1, "P", "g_tea.jpg", 50, "bigflash title:a_stranger_with|ONE|QUESTION")]),
    ("b2", [(-2.4, "V", "b_b2_0.mp4@0", "tall50", "whip"), (1, "V", "b_b2_0.mp4@2.4", "tall50", "z1.25")]),
    ("n3", [(.34, "P", "g_man.jpg", 50, "whip z1.2"), (.33, "P", "g_car.jpg", 50, ""), (.33, "P", "rishon_crane_sunset.jpg", 50, "")]),
    ("b4", [(-2.0, "V", "b_b4_0.mp4@0", "tall50", "whip"), (-1.7, "P", "g_food.jpg", 50, ""), (1, "P", "g_cassette.jpg", 50, "")]),
    ("n5", [(.2, "P", "g_book.jpg", 50, "whip"), (.2, "P", "rishon_8790.jpg", 50, ""), (.2, "P", "seder_table2.jpg", 50, ""), (.2, "P", "seder_table_fr.jpg", 50, ""), (.2, "P", "g_chair.jpg", 50, "")]),
    ("b6", [(1, "V", "b_b6_0.mp4@0", "tall50", "whip z1.2")]),
    ("n7", [(.5, "open", 0.1, "tall50", "whip"), (.5, "P", "shabbat_table.jpg", 50, "")]),
    ("n8", [(.5, "P", "g_tea.jpg", 50, "whip"), (.5, "P", "g_chair.jpg", 50, "shim")]),
    ("end", [(1, "P", "rishon_crane_sunrise.jpg", 50, "")]),
]
GEN = {"boy": "A thin boy of about twelve seen from behind sitting on a stack of concrete blocks on a building site at dusk, looking at the lights of a distant city, face not visible",
       "night": "An unfinished concrete house on a building site at night, one bare light bulb hanging inside, a thin mattress on the floor of an empty room, no people",
       "man": "A short middle-aged man seen from behind wearing a knitted kippah and a simple shirt, standing at the entrance of an unfinished concrete house at dusk, face not visible",
       "tea": "Close-up of two small glasses of tea on an upturned bucket on a dusty building site, an adult's hand and a boy's hand reaching for them, no faces",
       "car": "The red tail lights of an old 1990s car driving away down an unpaved road past houses under construction at dusk, no people",
       "food": "Close-up of a man's hands holding out a pot of hot food wrapped in a towel and a folded pile of clean clothes, building site at night behind, no faces",
       "cassette": "An old portable stereo cassette player and one cassette tape standing on a concrete floor in an unfinished room, a bare light bulb above, no people",
       "book": "Close-up of a man's finger pointing at large Hebrew letters in a children's reading book while a boy's hand holds a pencil beside it, kitchen table, no faces",
       "chair": "A long Passover seder table in a warm family home, seen from the end, every chair pushed in except one empty wooden chair pulled out beside the head of the table, candles, no people"}

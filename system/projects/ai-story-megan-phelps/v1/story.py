# Megan Phelps-Roper and David Abitbol V1. Narrator: ElevenLabs Matilda.
# Her words: TED talk 2017 (youtube bVV2Zk88beY). The two on stage: Times of Israel 2017 (G6X53uKLypE). Credited on screen, NOT cleared.
# Facts: DOSSIER.md (her on-camera words, NPR, JTA, New Yorker via Nieman). Photos: Wikimedia Commons, raw/CREDITS.json. No picket sign is shown.
T_ = "../src/bVV2Zk88beY.mp4"
I_ = "../src/G6X53uKLypE.mp4"
VOICE = "XrExE9yKIg1WjnnlVkGX"          # Matilda
L = [  # hook: "This woman held hate signs at five years old. This is the story of Megan Phelps-Roper." (ig-reel hookscore 0)
     ("h1", "This woman held hate signs at five years old."),
     ("h2", "Then a Jewish man"),
     ("h3", "answered her with dessert."),
     ("h4", "This is the story of"),
     ("h5", "Megan Phelps-Roper."),
       # hook: "She held hate signs at 5. You won't believe who stopped her." (ig-reel hookscore 100.0)
     ("n2", "Megan Phelps-Roper grew up in the Westboro Baptist Church. Online, she attacked a Jewish blogger named David."),
     ("n3", "He answered with jokes. Then he walked up to her picket line, with halva from the Jerusalem market."),
     ("n5", "In 2012, she left. David invited her to stay with a rabbi she had once picketed."),
     ("n8", "This story is proof that kindness reaches where arguments can't.")]
ON = {"b4": (T_, [(194.86, 199.25)], (194.86, 199.30)),
      "b6": (T_, [(385.62, 390.00)], (385.62, 390.05)),
      "b7": (T_, [(906.92, 910.40)], (906.92, 910.45))}
CLIPS = {"david": (I_, 252.5, 256.0, 1.0, "crop=iw*0.30:ih*0.60:iw*0.17:ih*0.28"), "open": (T_, 20.2, 22.6), "ted2": (T_, 357.7, 360.2), "duo": (I_, 252.5, 256.0, 1.0, "crop=iw*0.62:ih*0.62:iw*0.10:ih*0.22"), "duo2": (I_, 144.9, 147.8, 1.0, "crop=iw*0.62:ih*0.62:iw*0.10:ih*0.22")}
VID = {k: f"src/{k}.mp4" for k in CLIPS}
SEQ = [("h1", 0), ("h2", 0), ("h3", 0), ("h4", 0), ("h5", 0.3), ("n2", 0.25), ("n3", 0.25), ("b4", 0.25), ("n5", 0.25), ("b6", 0.25), ("b7", 0.25), ("n8", 0.4)]
WHO = {"b4": "MEGAN PHELPS-ROPER"}
END = ("ENEMIES", "FRIENDS.")
TEXT = {
    "h1": "~This woman held hate signs at five years old.", "h2": "~Then a Jewish man", "h3": "~answered her with dessert.", "h4": "~This is the story of", "h5": "~Megan Phelps-Roper.",
    "n2": "Megan Phelps-Roper | grew up in the | *Westboro Baptist Church. | Online, | she attacked | a Jewish blogger | named *David.",
    "n3": "He answered | with *jokes. | Then he walked up | to her picket line, | with *halva | from the Jerusalem market.",
    "b4": "We&rsquo;d started | to see each other | as *human beings, | and it changed the way | we spoke | to *one another.",
    "n5": "In 2012, | she *left. | David invited her | to stay with a rabbi | she had once | *picketed.",
    "b6": "They treated us | like *family. | They held nothing | *against us.",
    "b7": "We just have to decide | that it&rsquo;s going to | start *with us.",
    "n8": "This story is proof | that kindness reaches | where arguments | *can&rsquo;t.",
}
TED = "TED, 2017"
TOI = "THE TIMES OF ISRAEL, 2017"
CREDIT = {"X": TED, "open": TED, "ted2": TED, "duo": TOI, "duo2": TOI}
C2 = "WIKIMEDIA COMMONS, CC BY-SA 2.0"
PC = {"church03.jpg": "TOPEKA, KANSAS &middot; WIKIMEDIA COMMONS, CC BY 2.0", "topeka_jackson00.jpg": "TOPEKA, KANSAS &middot; " + C2, "capitol01.jpg": "TOPEKA, KANSAS &middot; " + C2, "jlm_oldcity00.jpg": "JERUSALEM &middot; " + C2,
      "shuk21400.jpg": "MAHANE YEHUDA MARKET, JERUSALEM &middot; " + C2, "halva00.jpg": "MAHANE YEHUDA MARKET, JERUSALEM &middot; WIKIMEDIA COMMONS, CC BY-SA 4.0", "megan01.jpg": "MEGAN PHELPS-ROPER, 2019 &middot; " + C2,
      "nmd19.jpg": "MEGAN PHELPS-ROPER, 2023 &middot; " + C2, "nmd18.jpg": "MEGAN PHELPS-ROPER, 2023 &middot; " + C2, "topeka_sky00.jpg": "TOPEKA, KANSAS &middot; WIKIMEDIA COMMONS, CC0"}
PLAN = [
    ("h1", [(1, "P", "megan01.jpg", 45, "glow arrow:440,680,2.4,255 title:this_woman_held|HATE_SIGNS|AT_FIVE")]),
    ("h2", [(1, "P", "g_jman.jpg", 50, "title:then_a|JEWISH|MAN")]),
    ("h3", [(1, "P", "shuk21400.jpg", 50, "title:answered_her_with|DESSERT")]),
    ("h4", [(1, "P", "topeka_jackson00.jpg", 50, "title:this_is|THE_STORY|OF")]),
    ("h5", [(1, "P", "nmd19.jpg", 50, "bigflash title:|MEGAN|PHELPS-ROPER")]),
    ("n2", [(.34, "X2", "paper.jpg", 50, "map:USA,-95.7,39.05;ISRAEL,35.2,31.8@-128,60,12,58"), (.2, "P", "megan01.jpg", 45, "whip"), (.18, "P", "church03.jpg", 42, "z1.3"), (.18, "P", "g_kid.jpg", 50, ""), (.14, "P", "g_phone.jpg", 50, ""), (.15, "P", "g_laptop.jpg", 50, ""), (.15, "david", 0.0, "band", "tag:DAVID ABITBOL")]),
    ("n3", [(.22, "P", "g_laugh.jpg", 50, "whip"), (.2, "P", "g_walk.jpg", 50, ""), (.2, "P", "g_gift.jpg", 50, ""), (.19, "P", "halva00.jpg", 50, ""), (.19, "P", "shuk21400.jpg", 50, "z1.3")]),
    ("b4", [(-2.2, "V", "b_b4_0.mp4@0", "tall45", "whip"), (1, "V", "b_b4_0.mp4@2.2", "tall45", "z1.25")]),
    ("n5", [(.28, "X2", "paper.jpg", 50, "card:#111111|in_2012|SHE_LEFT"), (.24, "P", "g_road.jpg", 50, "whip"), (.24, "P", "g_table.jpg", 50, ""), (.24, "P", "g_couch.jpg", 50, "")]),
    ("b6", [(-2.0, "V", "b_b6_0.mp4@0", "tall48", "whip"), (1, "V", "b_b6_0.mp4@2.0", "tall48", "z1.25")]),
    ("b7", [(1, "V", "b_b7_0.mp4@0", "tall48", "z1.1")]),
    ("n8", [(.5, "P", "nmd18.jpg", 55, "whip"), (.5, "P", "megan01.jpg", 45, "shim")]),
    ("end", [(1, "P", "jlm_oldcity00.jpg", 60, "")]),
]

# V1b: illustrations for the lines no real free photo exists for (no faces, no readable signs)
GEN = {"jman": "A man in his forties seen from behind wearing a knitted kippah, walking through the covered Mahane Yehuda market in Jerusalem carrying a small paper bag, face not visible", "kid": "A small child seen from behind standing on a suburban American sidewalk holding a blank white cardboard sign on a stick, 1990s, overcast, face not visible, the sign is completely blank",
       "phone": "Close-up of a young woman's hands typing fast on a smartphone, 2010, a social media feed blurred on the screen, no face",
       "laptop": "Over-the-shoulder view of a man's hands typing on a laptop on a small desk by a window with a view of Jerusalem stone rooftops, evening, face not visible",
       "laugh": "A smartphone lying on a wooden table lighting up with a new message notification, a cup of coffee beside it, warm light, no people",
       "walk": "A man seen from behind walking along a city sidewalk toward a small group of people standing in the distance, carrying a small gift box in one hand, faces not visible, daylight",
       "gift": "Close-up of a man's hands offering a small open box of halva sweets to a woman's hands outdoors on a street, no faces visible, daylight",
       "road": "A long empty Kansas highway at dawn seen through a car windscreen, two suitcases on the back seat reflected in the mirror, no people",
       "table": "A long Shabbat dinner table set for many guests in a warm family home, two lit candles, braided challah bread, plates and glasses, every chair empty, absolutely no people, no hands, no faces",
       "couch": "A living room couch made up as a bed with folded blankets and two pillows in a warm book-filled family home at night, a lamp on, no people"}

# The illustrations in the Vox paper-collage look (style block from skills/toolbox/vox-ai-motion-graphics-generator), made with Agnes.
GENSTYLE = "Mixed-media hand-cut paper collage, editorial zine style, vertical. Torn paper edges, scissor-cut borders, tape corners, halftone print dot patterns, paper drop shadows. Figures are printed-texture cut-outs from vintage photography. NOT 3D, NOT CGI. Palette: parchment cream, charcoal black, warm gold accent, one deep green. No text, no letters, no faces. Subject: "

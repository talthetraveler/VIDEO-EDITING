# Ella Blumenthal: "wait one more day". V2 (Tal, 2026-10-13: "have her mostly speaking at the beginning, and then go into it"; V1 is story.v1.py). Her own voice carries it; narrator (ElevenLabs George) only frames it.
# Asked for by Tal 2026-10-12 ("look at the video of Ella Blumenthal and her speech of her struggle on claims conference" ... "yes yes").
# Her words: Claims Conference #RememberThis (youtube 8rKfMCPoSwU, posted 24 July 2026 for her 105th birthday; she says "103" in it). NOT cleared.
# Facts: Wikipedia + UN profile (born Warsaw 25 July 1921, youngest of seven; Warsaw Ghetto, Majdanek, Auschwitz, Bergen-Belsen; of 27 in her
# immediate family only she and her niece Roma survived; later Paris, Tel Aviv, South Africa). Roma's plea is told by the narrator in gentle words.
W = "src/8rKfMCPoSwU.mp4"
BOX = "crop=926:870:376:0"         # her picture inside the Claims Conference frame, above their subtitles
VOICE = "JBFqnCBsd6RMkjVDRZzb"     # George
L = [("n2", "Ella was born in Warsaw in 1921, the youngest of seven children. She lived through the Warsaw Ghetto, and then three camps."),
     ("n4", "One day, Roma told her she could not go on. She wanted them both to give up."),
     ("n6", "They waited. One more day became liberation. Of twenty-seven people in her family, only Ella and Roma survived."),
     ("n7", "Ella built a new life in South Africa. In July 2026, she turned one hundred and five."),
     ("n9", "This story is proof that sometimes, hope is just one more day.")]
ON = {"b0": (W, [(0.45, 6.45)], (0.45, 6.5), "crop=926:690:376:180"),          # V2: she opens the video herself; this crop also drops their caption box at the top of her picture
      "b3": (W, [(27.0, 40.1)], (27.0, 40.15), BOX),
      "b5": (W, [(61.5, 78.4)], (61.5, 78.45), BOX),
      "b8": (W, [(85.4, 103.25)], (85.4, 103.3), BOX)}
CLIPS = {"open": (W, 0.4, 3.6, 1.0, BOX), "wait": (W, 63.2, 67.4, 1.0, BOX), "smile": (W, 104.8, 110.4, 1.0, BOX)}          # "open" stops before their own caption box appears at about 4 s
VID = {k: f"src/{k}.mp4" for k in CLIPS}
SEQ = [("b0", .25), ("b3", .25), ("n4", .25), ("b5", .30), ("n2", .25), ("n6", .25), ("n7", .25), ("b8", .30), ("n9", .40)]
WHO = {"b0": "ELLA BLUMENTHAL &middot; AUSCHWITZ SURVIVOR", "b3": "ELLA BLUMENTHAL &middot; AUSCHWITZ SURVIVOR", "b5": "ELLA BLUMENTHAL &middot; AUSCHWITZ SURVIVOR", "b8": "ELLA BLUMENTHAL &middot; AUSCHWITZ SURVIVOR"}
END = ("TODAY", "TOMORROW.")
TEXT = {
    "b0": "~My name is | ~Ella Blumenthal | ~and I&rsquo;m an | ~Auschwitz survivor.",
    "n2": "Ella was born | in *Warsaw | in 1921, | ~the youngest | ~of seven children. | She lived through | the Warsaw Ghetto, | ~and then | ~three camps.",
    "b3": "When I was | in *Auschwitz, | I had already lost | my entire *family | and survived | only with | my niece, | *Roma.",
    "n4": "One day, | Roma told her | she could not | *go on. | She wanted them both | to *give up.",
    "b5": "I convinced her | to wait | *one more day, | and then again | to wait | *another day, | because I wasn&rsquo;t | ready to die. | I wanted | to *live.",
    "n6": "They *waited. | One more day | became *liberation. | ~Of twenty-seven people | ~in her family, | ~only Ella and Roma | ~survived.",
    "n7": "Ella built | a new life | in *South Africa. | ~In July 2026, | ~she turned | ~one hundred and five.",
    "b8": "I have lived my life | always believing | that *tomorrow | will be better | than *today, | and that I will | *never give up, | no matter what.",
    "n9": "This story is proof | that sometimes, | hope is just | *one more day.",
}
CC = "CLAIMS CONFERENCE &middot; #REMEMBERTHIS"
CREDIT = {"X": CC, "open": CC, "wait": CC, "smile": CC}
BITECREDIT = {"b0": CC, "b3": CC, "b5": CC, "b8": CC}
WC = " &middot; WIKIMEDIA COMMONS"
PC = {"warsaw_1.jpg": "WARSAW, 1930s &middot; WILLEM VAN DE POLL, CC0", "warsaw_2.jpg": "WARSAW, 1930s &middot; WILLEM VAN DE POLL, CC0", "ghetto_1.jpg": "WARSAW GHETTO WALL &middot; PUBLIC DOMAIN", "ghetto_2.jpg": "WARSAW GHETTO WALL &middot; ADRIAN GRYCUK, CC BY-SA",
      "fence_1.jpg": "AUSCHWITZ-BIRKENAU &middot; DUDVA, CC BY-SA", "fence_2.jpg": "AUSCHWITZ-BIRKENAU &middot; PUBLIC DOMAIN", "fence_3.jpg": "AUSCHWITZ-BIRKENAU &middot; PUBLIC DOMAIN", "majdanek_1.jpg": "MAJDANEK &middot; PUBLIC DOMAIN",
      "birkenau_gate_tracks_2019.jpg": "AUSCHWITZ-BIRKENAU" + WC, "birkenau_rails.jpg": "AUSCHWITZ-BIRKENAU" + WC, "capetown_1.jpg": "CAPE TOWN &middot; DANIEL CASE, CC BY-SA", "capetown_2.jpg": "CAPE TOWN &middot; DANIEL CASE, CC BY-SA", "telaviv_1.jpg": "TEL AVIV &middot; PUBLIC DOMAIN"}
PLAN = [
    ("b0", [(1, "V", "b_b0_0.mp4@0", "tall50", "glow arrow:540,700,2.0,330 title:my_name_is|ELLA|BLUMENTHAL")]),
    ("b3", [(-5.5, "V", "b_b3_0.mp4@0", "tall50", "whip"), (-3.6, "P", "birkenau_gate_tracks_2019.jpg", 50, ""), (1, "V", "b_b3_0.mp4@9.1", "tall50", "z1.15")]),
    ("n4", [(.5, "P", "fence_2.jpg", 50, "whip"), (.5, "P", "g_hands.jpg", 50, "")]),
    ("b5", [(-6.2, "V", "b_b5_0.mp4@0", "tall50", "whip"), (-3.4, "P", "g_tally.jpg", 50, ""), (-3.0, "P", "fence_1.jpg", 50, ""), (1, "V", "b_b5_0.mp4@12.6", "tall50", "z1.15")]),
    ("n2", [(.2, "P", "warsaw_2.jpg", 50, "whip"), (.3, "X2", "paper.jpg", 50, "count:#111111|the_youngest_of|7|CHILDREN"), (.17, "P", "ghetto_2.jpg", 50, ""), (.33, "X2", "paper.jpg", 50, "check:#efe8dc|Three_camps|Majdanek|Auschwitz|Bergen-Belsen")]),
    ("n6", [(.26, "P", "g_tally.jpg", 50, "whip"), (.24, "P", "g_gate.jpg", 50, ""), (.5, "X2", "paper.jpg", 50, "count:#111111|of_27_in_her_family|2|SURVIVED")]),
    ("n7", [(.25, "P", "capetown_1.jpg", 50, "whip"), (.25, "P", "g_cake.jpg", 50, ""), (.5, "X2", "paper.jpg", 50, "count:#111111|in_July_2026_she_turned|105")]),
    ("b8", [(-6.0, "V", "b_b8_0.mp4@0", "tall50", "whip"), (-3.4, "P", "g_sunrise.jpg", 50, ""), (-3.0, "P", "capetown_2.jpg", 50, ""), (1, "V", "b_b8_0.mp4@12.4", "tall50", "z1.15")]),
    ("n9", [(.5, "P", "g_sunrise.jpg", 50, "whip"), (.5, "smile", 0.6, "tall50", "shim")]),
    ("end", [(1, "P", "capetown_2.jpg", 50, "")]),
]
GEN = {"hands": "Two pairs of women's hands holding each other tightly, seen very close, worn striped sleeves, a wooden bunk behind. Hands only, no faces, no bodies",
       "tally": "Pencil tally marks scratched in rows on a rough wooden plank, one fresh mark at the end, a thin shaft of morning light across it, no people",
       "gate": "An open iron gate at dawn with a wide empty road beyond it and birds in a pale sky, barbed wire fence posts left behind at the edges, no people",
       "cake": "A birthday cake crowded with dozens of small lit candles on a lace tablecloth, flowers in a vase, warm window light, no people, no photographs",
       "sunrise": "Sunrise over the sea seen through an open window with a white curtain moving, a cup of tea on the sill, warm gold light, no people"}
GENSTYLE = "Mixed-media hand-cut paper collage, editorial zine style, vertical. Torn paper edges, scissor-cut borders, tape corners, halftone print dot patterns, paper drop shadows. Printed-texture cut-outs from vintage photography. NOT 3D, NOT CGI. Palette: pale grey paper, charcoal black, one warm gold accent, one soft red. No text, no letters, no faces. Subject: "

# Dr. Yehudah Pryce V1. Narrator: ElevenLabs Brian. His words: JLI studio interview (youtube gomU7uVqipg), credited on screen, NOT cleared.
# Facts: DOSSIER.md (24-year sentence, a little over 16 served, released 22 Oct 2018, converted 2020, doctorate in social work from Simmons University). Most of the pre-2018 story rests on his own account.
V = "../src/gomU7uVqipg.mp4"
VOICE = "nPczCjzI2devNBz1zQrb"          # Brian
L = [  # hook: "This man got twenty-four years in prison at nineteen. This is the story of Yehudah Pryce." (ig-reel hookscore 0)
     ("h1", "This man got twenty-four years in prison at nineteen."),
     ("h2", "He was a gang member."),
     ("h3", "Then, in prison, he met a rabbi."),
     ("h4", "This is the story of"),
     ("h5", "Doctor Yehudah Pryce."),
       # hook: "At 19 he got 24 years. You should not judge him." (ig-reel hookscore 100.0)
     ("n3", "Yehudah Pryce grew up in Orange County, California. He says he joined a gang to belong somewhere. Then one day, in the prison yard, he looked around."),
     ("n5", "He started to study. And a rabbi told him something he never forgot."),
     ("n7", "He served sixteen years. He walked out in 2018, became an Orthodox Jew, and earned a doctorate in social work."),
     ("n9", "This story is proof that no one is only their worst mistake.")]
ON = {"b2": (V, [(178.58, 180.52)], (178.58, 180.56)),
      "b4": (V, [(337.56, 340.74)], (337.56, 340.78)),
      "b6": (V, [(567.96, 569.82)], (567.96, 569.86)),
      "b8": (V, [(1471.88, 1476.92)], (1471.88, 1476.96))}
CLIPS = {"open": (V, 70.6, 74.6), "end": (V, 1739.9, 1742.6)}
VID = {k: f"src/{k}.mp4" for k in CLIPS}
SEQ = [("h1", 0), ("h2", 0), ("h3", 0), ("h4", 0), ("h5", 0.3), ("b2", 0.25), ("n3", 0.25), ("b4", 0.25), ("n5", 0.25), ("b6", 0.25), ("n7", 0.25), ("b8", 0.25), ("n9", 0.4)]
WHO = {"b2": "DR. YEHUDAH PRYCE"}
END = ("INMATE", "DOCTOR.")
TEXT = {
    "h1": "~This man got twenty-four years in prison at nineteen.", "h2": "~He was a gang member.", "h3": "~Then, in prison, he met a rabbi.", "h4": "~This is the story of", "h5": "~Doctor Yehudah Pryce.",
    "b2": "I robbed | drug dealers | *for a living.",
    "n3": "Yehudah Pryce | grew up in | Orange County, *California. | He says he joined a gang | to *belong | somewhere. | Then one day, | in the prison yard, | he *looked around.",
    "b4": "Hey, y&rsquo;all, | we&rsquo;re *losers. | Like, we lost | *at life.",
    "n5": "He started | to *study. | And a rabbi | told him something | he never *forgot.",
    "b6": "Just be | a *good person. | You don&rsquo;t have to | be a Jew.",
    "n7": "He served | *sixteen years. | He walked out | in 2018, | became an | *Orthodox Jew, | and earned | a *doctorate | in social work.",
    "b8": "I had a community | that *embraced me, | that didn&rsquo;t judge me, | that was willing | to give me | a *second chance.",
    "n9": "This story is proof | that no one | is only | their *worst mistake.",
}
JLI = "JLI &middot; ROHR JEWISH LEARNING INSTITUTE"
CREDIT = {"X": JLI, "open": JLI, "end": JLI}
WC = " &middot; WIKIMEDIA COMMONS"
PC = {"prison_pelicanbay_aerial.jpg": "PELICAN BAY STATE PRISON, CALIFORNIA" + WC, "prison_sanquentin_4.jpg": "SAN QUENTIN, CALIFORNIA" + WC, "oc_santaana.jpg": "SANTA ANA, ORANGE COUNTY" + WC, "jewish_torah_open.jpg": "WIKIMEDIA COMMONS",
      "prison_folsom_gate.jpg": "FOLSOM STATE PRISON, CALIFORNIA" + WC, "jewish_tefillin_head.jpg": "WIKIMEDIA COMMONS", "oc_irvine_aerial.jpg": "ORANGE COUNTY, CALIFORNIA" + WC, "jewish_siddur_koren.jpg": "WIKIMEDIA COMMONS", "grad_simmons_main.jpg": "SIMMONS UNIVERSITY, BOSTON" + WC}
PLAN = [
    ("h1", [(1, "open", 0.1, "tall18", "glow arrow:600,650,2.8,290 title:this_man_got|24_YEARS|AT_NINETEEN")]),
    ("h2", [(1, "P", "g_street.jpg", 50, "title:he_was_a|GANG|MEMBER")]),
    ("h3", [(1, "P", "jewish_torah_open.jpg", 50, "title:in_prison_he_met|A_RABBI")]),
    ("h4", [(1, "P", "prison_pelicanbay_aerial.jpg", 50, "title:this_is|THE_STORY|OF")]),
    ("h5", [(1, "end", 0.1, "tall18", "bigflash title:Dr.|YEHUDAH|PRYCE")]),
    ("b2", [(1, "V", "b_b2_0.mp4@0", "tall18", "whip")]),
    ("n3", [(.14, "P", "oc_santaana.jpg", 50, "whip"), (.14, "P", "oc_irvine_aerial.jpg", 50, ""), (.14, "P", "g_street.jpg", 50, "z1.3"), (.14, "P", "g_hands.jpg", 50, ""), (.14, "P", "prison_folsom_gate.jpg", 50, ""), (.15, "P", "g_yard.jpg", 50, ""), (.15, "P", "g_yard.jpg", 50, "z1.4")]),
    ("b4", [(-1.6, "V", "b_b4_0.mp4@0", "tall18", "whip"), (1, "V", "b_b4_0.mp4@1.6", "tall18", "z1.25")]),
    ("n5", [(.34, "P", "g_book.jpg", 50, "whip"), (.33, "P", "jewish_siddur_koren.jpg", 50, ""), (.33, "P", "g_visit.jpg", 50, "")]),
    ("b6", [(1, "V", "b_b6_0.mp4@0", "tall18", "whip z1.15")]),
    ("n7", [(.2, "X2", "paper.jpg", 50, "count:#111111|he_served|16|YEARS"), (.2, "P", "g_gate.jpg", 50, "whip"), (.2, "P", "g_tefillin.jpg", 50, ""), (.2, "P", "grad_simmons_main.jpg", 50, ""), (.2, "P", "g_diploma.jpg", 50, "")]),
    ("b8", [(-2.5, "V", "b_b8_0.mp4@0", "tall18", "whip"), (1, "V", "b_b8_0.mp4@2.5", "tall18", "z1.25")]),
    ("n9", [(.5, "P", "g_gate.jpg", 50, "whip"), (.5, "end", 0.1, "tall18", "shim")]),
    ("end", [(1, "P", "prison_pelicanbay_aerial.jpg", 50, "")]),
]
GEN = {"street": "An empty residential street in Orange County, California at dusk in the 1990s, low sun, palm trees, a parked old car, chain-link fence, no people",
       "cell": "An empty prison cell: steel bunk, thin mattress, small barred window with a shaft of daylight, concrete walls, no people",
       "hands": "Close-up of a teenage boy's hands gripping a chain-link fence at dusk, no face, shallow depth of field",
       "yard": "A wide concrete prison yard seen from behind through a chain-link fence, a few men in blue shirts in the far distance seen from behind, high walls and a guard tower, harsh midday sun, no faces",
       "book": "Close-up of a man's dark-skinned hands holding an open old book and a pencil on a small steel prison table, daylight through bars, no face",
       "visit": "A prison visiting room: two empty plastic chairs facing each other across a small table with a closed Hebrew book on it, institutional light, no people",
       "gate": "The pure black silhouette of a man seen from behind walking out through an open prison gate into blinding morning sunlight, carrying a cardboard box, long shadow toward the viewer, the figure completely dark with no visible skin or features",
       "tefillin": "Close-up of a dark-skinned man's forearm and hand wrapped in black leather tefillin straps, white shirt sleeve rolled up, soft window light, no face",
       "diploma": "Close-up of a dark-skinned man's hands holding a rolled doctoral diploma and a black velvet doctoral cap, graduation gown sleeve, no face",
       "table": "A long Shabbat dinner table in a warm home, lit candles, challah bread, many hands reaching to pass dishes, people of different skin tones, no faces visible"}

# The illustrations in the Vox paper-collage look (style block from skills/toolbox/vox-ai-motion-graphics-generator), made with Agnes.
GENSTYLE = "Mixed-media hand-cut paper collage, editorial zine style, vertical. Torn paper edges, scissor-cut borders, tape corners, halftone print dot patterns, paper drop shadows. Figures are printed-texture cut-outs from vintage photography. NOT 3D, NOT CGI. Palette: parchment cream, charcoal black, warm gold accent, one deep green. No text, no letters, no faces. Subject: "

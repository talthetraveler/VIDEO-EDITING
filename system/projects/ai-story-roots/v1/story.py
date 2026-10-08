# Ali Abu Awwad and Rabbi Hanan Schlesinger, founders of Roots / Shorashim / Judur. V1. Narrator: ElevenLabs George. Told in the PAST tense: Ali later left Roots to build Taghyeer (DOSSIER.md).
# Their words: Jewish Journal / TRIBE Media talk, Los Angeles, 28 May 2015 (youtube 7Wy7vnnv1VY). Credited on screen, NOT cleared. Stage light toned down.
J = "../src/7Wy7vnnv1VY.mp4"
FIX = "hue=s=0.5,eq=contrast=1.05"
VOICE = "JBFqnCBsd6RMkjVDRZzb"          # George
L = [  # hook: "This man lost his brother in the conflict. This is the story of Ali Abu Awwad and Rabbi Hanan Schlesinger." (ig-reel hookscore 0)
     ("h1", "This man lost his brother in the conflict."),
     ("h2", "His partner today"),
     ("h3", "is an Israeli settler rabbi."),
     ("h4", "This is the story of"),
     ("h5", "Ali Abu Awwad and Hanan Schlesinger."),
       # hook: "He lost his brother. You won't believe his Israeli partner." (ig-reel hookscore 100.0)
     ("n3", "Ali Abu Awwad spent four years in prison. Then he lost his brother, Yousef."),
     ("n5", "Ali chose non-violence. In 2014, on his family's land, he met Rabbi Hanan Schlesinger."),
     ("n7", "Together they started Roots, a place where Palestinians and Israeli settlers meet as neighbours."),
     ("n9", "This story is proof that enemies can become partners.")]
ON = {"b2": (J, [(584.42, 588.95)], (584.42, 589.0), FIX),
      "b4": (J, [(2318.42, 2323.85)], (2318.42, 2323.9), FIX),
      "b6": (J, [(2482.82, 2485.75)], (2482.82, 2485.8), FIX),
      "b8": (J, [(75.02, 79.98)], (75.02, 80.02), FIX)}
CLIPS = {"two": (J, 795.0, 799.0, 1.0, FIX), "two2": (J, 762.0, 765.0, 1.0, FIX), "ali": (J, 1964.6, 1967.4, 1.0, FIX)}
VID = {k: f"src/{k}.mp4" for k in CLIPS}
SEQ = [("h1", 0), ("h2", 0), ("h3", 0), ("h4", 0), ("h5", 0.3), ("b2", 0.25), ("n3", 0.25), ("b4", 0.25), ("n5", 0.25), ("b6", 0.25), ("n7", 0.25), ("b8", 0.25), ("n9", 0.4)]
WHO = {"b2": "RABBI HANAN SCHLESINGER", "b4": "ALI ABU AWWAD", "b6": "ALI ABU AWWAD", "b8": "RABBI HANAN SCHLESINGER"}
END = ("ENEMIES", "PARTNERS.")
TEXT = {
    "h1": "~This man lost his brother in the conflict.", "h2": "~His partner today", "h3": "~is an Israeli settler rabbi.", "h4": "~This is the story of", "h5": "~Ali Abu Awwad and Hanan Schlesinger.",
    "b2": "I never saw | the Palestinians. | They were | *invisible | to me.",
    "n3": "Ali Abu Awwad | spent four years | in *prison. | Then he lost | his brother, | *Yousef.",
    "b4": "When he died, | he took | the taste of my life | *with him.",
    "n5": "Ali chose | *non-violence. | In 2014, | on his family&rsquo;s land, | he met | Rabbi Hanan *Schlesinger.",
    "b6": "You realize | that there is | *no revenge.",
    "n7": "Together | they started *Roots, | a place where | Palestinians | and Israeli settlers | meet as *neighbours.",
    "b8": "It&rsquo;s a *miracle | that we know each other. | It&rsquo;s a miracle | that we&rsquo;re *friends | and colleagues.",
    "n9": "This story is proof | that enemies | can become | *partners.",
}
JJ = "JEWISH JOURNAL / TRIBE MEDIA, 2015"
CREDIT = {"X": JJ, "two": JJ, "two2": JJ, "ali": JJ}
WC = " &middot; WIKIMEDIA COMMONS"
PC = {"ali_portrait.jpg": "ALI ABU AWWAD" + WC, "hanan_portrait.jpg": "RABBI HANAN SCHLESINGER" + WC, "gush_lookout.jpg": "GUSH ETZION" + WC, "junction_b.jpg": "GUSH ETZION JUNCTION" + WC, "beitummar_a.jpg": "BEIT UMMAR" + WC,
      "beitummar_farm.jpg": "BEIT UMMAR" + WC, "olive_hebron_a.jpg": "HEBRON HILLS" + WC, "lone_oak_tree.jpg": "THE LONE OAK, GUSH ETZION" + WC, "halhul_sunset.jpg": "HALHUL" + WC, "gush_c.jpg": "GUSH ETZION" + WC, "olive_hebron_b.jpg": "HEBRON HILLS" + WC}
PLAN = [
    ("h1", [(1, "P", "ali_portrait.jpg", 50, "glow arrow:540,660,2.3,330 title:this_man|LOST_HIS|BROTHER")]),
    ("h2", [(1, "P", "gush_lookout.jpg", 50, "title:his|PARTNER|TODAY")]),
    ("h3", [(1, "P", "hanan_portrait.jpg", 82, "title:an_Israeli|SETTLER|RABBI")]),
    ("h4", [(1, "two", 0.0, "band", "title:this_is|THE_STORY|OF")]),
    ("h5", [(1, "P", "g_hands.jpg", 50, "bigflash title:|ALI_ABU_AWWAD|&amp;_HANAN|SCHLESINGER")]),
    ("b2", [(-2.2, "V", "b_b2_0.mp4@0", "tall50", "whip"), (1, "V", "b_b2_0.mp4@2.2", "tall50", "z1.25")]),
    ("n3", [(.25, "ali", 0.0, "tall50", "whip"), (.25, "P", "g_cell.jpg", 50, ""), (.25, "P", "beitummar_a.jpg", 50, ""), (.25, "P", "g_chair.jpg", 50, "")]),
    ("b4", [(-2.6, "V", "b_b4_0.mp4@0", "tall50", "whip"), (1, "V", "b_b4_0.mp4@2.6", "tall50", "z1.25")]),
    ("n5", [(.25, "P", "olive_hebron_a.jpg", 50, "whip"), (.25, "P", "olive_hebron_b.jpg", 50, ""), (.25, "P", "g_tea.jpg", 50, ""), (.25, "two2", 0.0, "band", "")]),
    ("b6", [(1, "V", "b_b6_0.mp4@0", "tall50", "whip z1.15")]),
    ("n7", [(.25, "P", "g_table.jpg", 50, "whip"), (.25, "P", "lone_oak_tree.jpg", 50, ""), (.25, "P", "g_hands.jpg", 50, ""), (.25, "P", "gush_c.jpg", 50, "")]),
    ("b8", [(-2.7, "V", "b_b8_0.mp4@0", "tall50", "whip"), (1, "V", "b_b8_0.mp4@2.7", "tall50", "z1.25")]),
    ("n9", [(.5, "P", "halhul_sunset.jpg", 50, "whip"), (.5, "two", 1.2, "band", "shim")]),
    ("end", [(1, "P", "olive_hebron_b.jpg", 50, "")]),
]
GEN = {"cell": "An empty prison cell with a steel bunk and a small barred window, a shaft of daylight on a concrete wall, no people",
       "chair": "An empty plastic chair under an old olive tree in a stone courtyard of a village house in the Hebron hills, late afternoon light, no people",
       "tea": "Close-up of two small glasses of mint tea on a low wooden table under an olive tree, two men's hands reaching for them from opposite sides, one sleeve of a white shirt, one of a checked shirt, no faces",
       "table": "A circle of mismatched plastic chairs under a simple wooden shelter on a terraced hillside farm in the Judean hills, olive trees, golden hour, no people",
       "hands": "Close-up of two men's hands shaking firmly over a rough wooden farm table, olive branches in the background, no faces"}

# The illustrations in the Vox paper-collage look (style block from skills/toolbox/vox-ai-motion-graphics-generator), made with Agnes.
GENSTYLE = "Mixed-media hand-cut paper collage, editorial zine style, vertical. Torn paper edges, scissor-cut borders, tape corners, halftone print dot patterns, paper drop shadows. Figures are printed-texture cut-outs from vintage photography. NOT 3D, NOT CGI. Palette: parchment cream, charcoal black, warm gold accent, one deep green. No text, no letters, no faces. Subject: "

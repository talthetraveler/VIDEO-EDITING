# Rawan Osman V1. Narrator: ElevenLabs Brian. Her own words from PragerU "Stories of Us" (youtube DruzFM253KA), credited on screen, NOT cleared.
# Facts: DOSSIER.md (her on-camera words + her Times of Israel blog + SA Jewish Report + Jewish Independent). Photos: Wikimedia Commons, raw/CREDITS.json.
V = "../src/DruzFM253KA.mp4"
VOICE = "nPczCjzI2devNBz1zQrb"          # Brian
L = [  # hook: "This woman was raised to hate Jews. This is the story of Rawan Osman." (ig-reel hookscore 0)
     ("h1", "This woman was raised to hate Jews."),
     ("h2", "Then a Jewish shopkeeper"),
     ("h3", "did one small thing."),
     ("h4", "This is the story of"),
     ("h5", "Rawan Osman."),
       # hook: "She hated Jews in Lebanon. You won't believe who stopped it." (ig-reel hookscore 100.0)
     ("n2", "Rawan Osman had never spoken to a Jew. In France, she heard Hebrew in a small shop. She dropped her shopping, ran upstairs, and locked her door."),
     ("n4", "But nothing had happened. So she went back for her bags."),
     ("n5", "The owner was Jewish. He asked where she was from, and helped her carry them."),
     ("n7", "Today, she answers questions from Arabs who are curious about Jews."),
     ("n9", "This story is proof that kindness can turn an enemy into a friend.")]

# quotes: sound ranges (word times, pauses over 0.6 s removed), picture range
ON = {"b3": (V, [(141.44, 147.86)], (141.44, 147.90)),
      "b6": (V, [(228.76, 231.38), (232.06, 237.05)], (232.06, 237.10)),
      "b8": (V, [(584.57, 588.12)], (584.57, 588.15))}
CLIPS = {"open": (V, 22.40, 25.60), "wide": (V, 228.76, 231.40), "sit": (V, 101.50, 103.60)}
VID = {"open": "src/open.mp4", "wide": "src/wide.mp4", "sit": "src/sit.mp4"}

SEQ = [("h1", 0), ("h2", 0), ("h3", 0), ("h4", 0), ("h5", 0.3), ("n2", 0.25), ("b3", 0.25), ("n4", 0.25), ("n5", 0.25), ("b6", 0.25), ("n7", 0.25), ("b8", 0.25), ("n9", 0.4)]
WHO = {"b3": "RAWAN OSMAN"}
END = ("ENEMY", "ALLY.")
TEXT = {
    "h1": "~This woman was raised to hate Jews.", "h2": "~Then a Jewish shopkeeper", "h3": "~did one small thing.", "h4": "~This is the story of", "h5": "~Rawan Osman.",
    "n2": "~Rawan Osman had never | ~spoken to a Jew. | In France, | she heard *Hebrew | in a small shop. | She dropped her shopping, | ran upstairs, | and *locked her door.",
    "b3": "I was sharing | the same space | with *the enemy | for the first time | *ever.",
    "n4": "But nothing | had happened. | So she *went back | for her bags.",
    "n5": "The owner | was *Jewish. | He asked where | she was from, | and helped her | *carry them.",
    "b6": "This man, | although he didn&rsquo;t mean to, | he converted me | from an *enemy | to an *ally | through *kindness.",
    "n7": "Today, | she answers questions | from Arabs | who are curious | about *Jews.",
    "b8": "And life, | as it always does, | will *prevail.",
    "n9": "This story is proof | that kindness | can turn an enemy | into *a friend.",
}
PRAGER = "PRAGERU &middot; STORIES OF US"
CREDIT = {"X": PRAGER, "open": PRAGER, "wide": PRAGER, "sit": PRAGER}
W = " &middot; WIKIMEDIA COMMONS, "
PC = {"bekaa_valley.jpg": "BEKAA VALLEY, LEBANON &middot; KARAN JAIN, CC BY-SA 2.0", "beirut_streets.jpg": "BEIRUT &middot; V. ARGENBERG, CC BY 4.0", "bekaa_fields.jpg": "BEKAA VALLEY &middot; DIANA SALLOUM, CC BY-SA 4.0",
      "stras_petite_france.jpg": "STRASBOURG &middot; DIETMAR RABICH, CC BY-SA 4.0", "stras_avenue_paix.jpg": "STRASBOURG &middot; GUILHEM VELLUT, CC BY 2.0", "stras_synagogue_2018.jpg": "SYNAGOGUE DE LA PAIX, STRASBOURG &middot; GUILHEM VELLUT, CC BY 2.0",
      "stras_avenue_paix_door.jpg": "STRASBOURG &middot; COYAU, CC BY-SA 3.0", "stras_contades_park.jpg": "STRASBOURG &middot; GUILHEM VELLUT, CC BY 2.0", "stras_synagogue_park.jpg": "STRASBOURG &middot; CLAUDE TRUONG-NGOC, CC BY-SA 3.0",
      "damascus_alley.jpg": "DAMASCUS &middot; V. ARGENBERG, CC BY 4.0", "damascus_street.jpg": "DAMASCUS &middot; V. ARGENBERG, CC BY 4.0", "damascus_oldcity.jpg": "DAMASCUS &middot; V. ARGENBERG, CC BY 4.0", "beirut_central.jpg": "BEIRUT &middot; V. ARGENBERG, CC BY 4.0"}
PLAN = [
    ("h1", [(1, "open", 0.1, "tall78", "glow arrow:690,600,2.0,235 title:this_woman_was_raised_to|HATE_JEWS")]),
    ("h2", [(1, "P", "g_counter.jpg", 50, "title:then_a|JEWISH|SHOPKEEPER")]),
    ("h3", [(1, "P", "g_bags.jpg", 50, "title:did|ONE_SMALL|THING")]),
    ("h4", [(1, "P", "stras_petite_france.jpg", 50, "title:this_is|THE_STORY|OF")]),
    ("h5", [(1, "open", 0.1, "tall78", "bigflash title:|RAWAN|OSMAN")]),
    ("n2", [(.34, "X2", "paper.jpg", 50, "map:LEBANON,35.8,33.9;FRANCE,7.75,48.58@-6,42,28,54"), (.2, "X2", "paper.jpg", 50, "card:#111111|she_had_never_spoken_to|A_JEW"), (.2, "P", "g_inside.jpg", 50, "whip"), (.2, "P", "g_drop.jpg", 50, "thud0"), (.2, "P", "g_stairs.jpg", 50, "run"), (.2, "P", "g_lock.jpg", 50, "door0")]),
    ("b3", [(-2.9, "V", "b_b3_0.mp4@0", "band", "whip"), (1, "V", "b_b3_0.mp4@2.9", "tall50", "")]),
    ("n4", [(.5, "P", "g_door.jpg", 50, "whip"), (.5, "P", "g_back.jpg", 50, "")]),
    ("n5", [(.34, "P", "g_counter.jpg", 50, "whip"), (.33, "P", "g_bags.jpg", 50, ""), (.33, "P", "g_bags.jpg", 50, "z1.35")]),
    ("b6", [(-2.55, "wide", 0.0, "band", "whip"), (-2.5, "V", "b_b6_0.mp4@0", "tall6", ""), (1, "V", "b_b6_0.mp4@2.5", "tall6", "z1.2")]),
    ("n7", [(.34, "P", "g_phone.jpg", 50, "whip"), (.33, "P", "beirut_central.jpg", 40, ""), (.33, "P", "bekaa_valley.jpg", 50, "")]),
    ("b8", [(1, "V", "b_b8_0.mp4@0", "tall50", "whip")]),
    ("n9", [(.5, "P", "stras_synagogue_park.jpg", 50, "whip"), (.5, "open", 0.1, "tall78", "shim")]),
    ("end", [(1, "P", "stras_petite_france.jpg", 50, "")]),
]

# V2 (Tal: "doesn't really make sense ... a picture of a small shop ... someone dropping her shopping, running upstairs, locking the door"): illustrations for the lines no real photo exists for. No faces.
GEN = {"shop": "A small old corner grocery shop on a quiet street in Strasbourg, France, crates of fruit and vegetables outside, warm evening light, no people",
       "inside": "Inside a tiny old neighbourhood grocery shop, narrow aisle, wooden shelves of jars and tins, seen from the doorway; two men in long black coats and black hats seen from behind at the counter, no faces visible",
       "drop": "Close-up on a shop floor: a dropped wire shopping basket tipped over, oranges, a baguette and a milk carton spilled across old tiles, a woman's shoes stepping away, no face",
       "stairs": "A woman's legs and shoes running up a narrow old wooden staircase in a French apartment building, motion blur, seen from below, no face",
       "lock": "Macro photograph: only a hand and a wrist turning an old brass key in the lock of a dark wooden door, the frame filled by the lock, key and fingers, nothing else, no person visible, no face",
       "door": "A closed wooden bedroom door in a dim small student room, an unpacked suitcase beside it, a line of light under the door, no people",
       "bags": "Close-up of an elderly shopkeeper's hands passing two paper grocery bags over a wooden shop counter to a young woman's hands, warm light, no faces visible",
       "back": "A young woman with dark shoulder-length hair seen from behind, standing in front of the open door of a small grocery shop on a French street at dusk, hesitating, face not visible",
       "counter": "Top-down close-up of an old wooden shop counter in a tiny grocery: a brass till, a bowl of sweets, a few coins, and only the two wrinkled hands of the shopkeeper resting on the wood, no head, no face, no body",
       "phone": "Close-up of a woman's hands typing on a smartphone at a desk at night, Arabic text messages blurred on the screen, warm lamp, no face"}

# The illustrations in the Vox paper-collage look (style block from skills/toolbox/vox-ai-motion-graphics-generator), made with Agnes.
GENSTYLE = "Mixed-media hand-cut paper collage, editorial zine style, vertical. Torn paper edges, scissor-cut borders, tape corners, halftone print dot patterns, paper drop shadows. Figures are printed-texture cut-outs from vintage photography. NOT 3D, NOT CGI. Palette: parchment cream, charcoal black, warm gold accent, one deep green. No text, no letters, no faces. Subject: "

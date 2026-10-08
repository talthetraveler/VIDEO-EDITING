# Nissim Black V1. Narrator: ElevenLabs Sarah. His words: JewView podcast, 14 Sept 2026 (youtube P6d8EpWhoLw), credited on screen, NOT cleared.
# Facts: DOSSIER.md. The feud and the night he prayed rest on his own account. He is not called "rabbi". Israel since 2016 (Beit Shemesh).
V = "../src/P6d8EpWhoLw.mp4"
VOICE = "EXAVITQu4vr4xnSDxMaL"          # Sarah
L = [  # hook: "He lost 8 friends in Seattle. You won't believe where he is." (ig-reel hookscore 100.0)
     ("h1", "He lost eight friends"),
     ("h2", "in Seattle."),
     ("h3", "He was selling drugs at twelve."),
     ("h4", "You won't believe"),
     ("h5", "where he is now."),
     ("n3", "Nissim Black grew up around gangs in Seattle. Both his parents were rappers. Drugs moved through his home."),
     ("n4", "He thought he would not survive it."),
     ("n6", "He left that life. He became an Orthodox Jew, and in 2016, he moved his family to Israel."),
     ("n8", "This story is proof that anyone can choose a new road.")]
ON = {"b2": (V, [(584.31, 588.15)], (584.31, 588.20)),
      "b4": (V, [(639.47, 642.72)], (639.47, 640.5)),
      "b5": (V, [(698.73, 701.12)], (698.73, 699.8)),
      "b7": (V, [(1687.93, 1692.30)], (1687.93, 1692.34))}
CLIPS = {"open": (V, 291.0, 293.4), "end": (V, 1329.4, 1332.6)}
VID = {k: f"src/{k}.mp4" for k in CLIPS}
SEQ = [("h1", 0), ("h2", 0), ("h3", 0), ("h4", 0), ("h5", 0.3), ("b2", 0.25), ("n3", 0.25), ("n4", 0.25), ("b4", 0.25), ("b5", 0.25), ("n6", 0.25), ("b7", 0.25), ("n8", 0.4)]
WHO = {"b2": "NISSIM BLACK", "b4": "NISSIM BLACK &middot; HIS VOICE", "b5": "NISSIM BLACK &middot; HIS VOICE"}
END = ("LOST", "FOUND.")
TEXT = {
    "h1": "~He lost eight friends", "h2": "~in Seattle.", "h3": "~He was selling drugs at twelve.", "h4": "~You won&rsquo;t believe", "h5": "~where he is now.",
    "b2": "I get into a | *kill or be killed | situation | with another rapper.",
    "n3": "Nissim Black | grew up around gangs | in *Seattle. | Both his parents | were *rappers. | Drugs moved | through *his home.",
    "n4": "He thought | he would not | *survive it.",
    "b4": "And so I fall | to *my knees, | and I start praying, | and I&rsquo;m just | *crying.",
    "b5": "That God was allowing me | to get | *another chance.",
    "n6": "He left | *that life. | He became | an Orthodox Jew, | and in 2016, | he moved his family | to *Israel.",
    "b7": "The more and more | I fell in love | with *Hashem, | the more and more | I fell in love | with the *Jewish people.",
    "n8": "This story is proof | that anyone | can choose | *a new road.",
}
JV = "JEWVIEW PODCAST, 2026"
CREDIT = {"X": JV, "open": JV, "end": JV}
WC = " &middot; WIKIMEDIA COMMONS"
PC = {"him_2013_portrait.jpg": "NISSIM BLACK, 2013" + WC, "him_2016.jpg": "NISSIM BLACK, 2016" + WC, "him_2026_stage.jpg": "NISSIM BLACK, 2026" + WC, "sea_rainier_1977.jpg": "SEATTLE, 1977" + WC, "sea_cd_grocery_1980.jpg": "SEATTLE, 1980" + WC,
      "sea_skyline_dusk.jpg": "SEATTLE" + WC, "sea_seward_rainier.jpg": "SEATTLE" + WC, "jer_kotel_night_portrait.jpg": "JERUSALEM" + WC, "jer_kotel_praying_portrait.jpg": "THE WESTERN WALL, JERUSALEM" + WC, "isr_beitshemesh.jpg": "BEIT SHEMESH, ISRAEL" + WC,
      "studio_mic_akg.jpg": "WIKIMEDIA COMMONS", "shabbat_table.jpg": "WIKIMEDIA COMMONS", "sea_synagogue_sbh_1.jpg": "SEATTLE" + WC, "jer_sunset_olives.jpg": "JERUSALEM" + WC, "sea_cd_downtown_1990.jpg": "SEATTLE, 1990" + WC}
PLAN = [
    ("h1", [(1, "P", "him_2013_portrait.jpg", 50, "glow title:he_lost|EIGHT|FRIENDS")]),
    ("h2", [(1, "P", "sea_rainier_1977.jpg", 50, "title:in|SEATTLE")]),
    ("h3", [(1, "P", "sea_cd_grocery_1980.jpg", 50, "title:selling_drugs_at|TWELVE")]),
    ("h4", [(1, "P", "g_knees.jpg", 50, "title:you_won&rsquo;t|BELIEVE")]),
    ("h5", [(1, "P", "jer_kotel_night_portrait.jpg", 50, "bigflash title:where_he_is|NOW")]),
    ("b2", [(-2.2, "V", "b_b2_0.mp4@0", "tall50", "whip"), (1, "V", "b_b2_0.mp4@2.2", "tall50", "z1.25")]),
    ("n3", [(.17, "P", "sea_skyline_dusk.jpg", 50, "whip"), (.17, "P", "sea_cd_downtown_1990.jpg", 50, ""), (.17, "P", "studio_mic_akg.jpg", 50, ""), (.17, "P", "g_tape.jpg", 50, ""), (.16, "P", "sea_seward_rainier.jpg", 50, ""), (.16, "P", "g_stoop.jpg", 50, "")]),
    ("n4", [(.5, "P", "g_street.jpg", 50, "whip"), (.5, "P", "g_street.jpg", 50, "z1.35")]),
    ("b4", [(.5, "P", "g_knees.jpg", 50, "whip"), (.5, "P", "g_knees.jpg", 50, "z1.4")]),
    ("b5", [(.5, "P", "g_window.jpg", 50, "whip"), (.5, "P", "him_2016.jpg", 50, "")]),
    ("n6", [(.2, "P", "sea_synagogue_sbh_1.jpg", 50, "whip"), (.2, "P", "shabbat_table.jpg", 50, ""), (.2, "P", "g_plane.jpg", 50, ""), (.2, "P", "isr_beitshemesh.jpg", 50, ""), (.2, "P", "jer_kotel_praying_portrait.jpg", 50, "")]),
    ("b7", [(-2.2, "V", "b_b7_0.mp4@0", "tall50", "whip"), (1, "V", "b_b7_0.mp4@2.2", "tall50", "z1.25")]),
    ("n8", [(.5, "P", "jer_sunset_olives.jpg", 50, "whip"), (.5, "P", "him_2026_stage.jpg", 50, "shim")]),
    ("end", [(1, "P", "jer_kotel_night_portrait.jpg", 50, "")]),
]
GEN = {"knees": "A pure black silhouette of a man kneeling on a bedroom floor with his head bowed, seen from behind against a window with closed blinds glowing with orange streetlight, the figure completely dark with no visible features, night",
       "window": "Dawn light coming through half-open blinds onto an empty unmade bed and a wooden floor in a small bedroom, dust in the light, no people",
       "plane": "View through an airliner window at sunrise over the Mediterranean coast of Israel, wing in frame, no people",
       "tape": "Close-up of a boy's hands holding an old cassette tape with a handwritten label beside a boombox on a kitchen table, 1990s, no face",
       "stoop": "An empty front stoop of a wooden house on a rainy Seattle street at dusk in the 1990s, a basketball left on the steps, wet pavement, streetlight, no people",
       "street": "An empty rain-soaked street at night in a 1990s American neighbourhood, a single streetlight, police lights reflected far away on the wet asphalt, no people"}

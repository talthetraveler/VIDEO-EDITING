# Yahya ben Yosef, one of the last Jews in Yemen, buried by his Muslim neighbours (June 2024). V1. Narrator: ElevenLabs George.
# Asked for by Tal 2026-10-12 from the Jerusalem Post article of 16 June 2024. Facts: ../DOSSIER.md.
# Kept out because the sources disagree or stand alone: his age (81 vs "over 100"), the cause of death, any prayer said at the grave.
# Footage of him and of the funeral: posted by a Yemeni Jews Facebook page, as broadcast by i24NEWS (youtube Tr8lTSDBQdQ). NOT cleared.
V = "src/Tr8lTSDBQdQ.mp4"
BOX = "crop=760:449:400:47"        # the footage window inside the i24 studio frame, without the page's logo at the right edge
VOICE = "JBFqnCBsd6RMkjVDRZzb"     # George
L = [("h1", "This man was one of the last six Jews in Yemen."),
     ("h2", "When he died, there was no one left to bury him."),
     ("h3", "So his Muslim neighbours did."),
     ("h4", "This is the story of"),
     ("h5", "Yahya ben Yosef."),
     ("n2", "Jews have lived in Yemen for more than two thousand years. In 1949, about forty-nine thousand of them were flown to Israel."),
     ("n3", "Yahya stayed. He lived in Madar, a small village north of Sana'a, and he would not leave his home."),
     ("n4", "In June 2024, he died. There were not enough Jews left in Yemen to bury him, or to say the mourner's prayer."),
     ("n5", "So the men of his village came. They wrapped him in a Jewish prayer shawl, and carried him up the hill to his grave."),
     ("n7", "One man from the area told reporters: Yahya was beloved by his village. He was a good man."),
     ("n8", "A year later, his wife, Badra, reached Israel."),
     ("n9", "This story is proof that a good neighbour never asks what you believe.")]
ON = {"b6": (V, [(158.66, 160.95), (161.45, 167.95)], (64.6, 73.4), BOX)}
CLIPS = {"yahya": (V, 205.0, 212.6, 1.0, BOX), "yahya2": (V, 162.7, 166.0, 1.5, BOX), "slope": (V, 57.2, 61.2, 1.6, BOX), "lift": (V, 152.7, 158.4, 1.3, BOX),
         "crowd": (V, 85.2, 90.2, 1.5, BOX), "hill": (V, 196.4, 201.0, 1.5, BOX)}
VID = {k: f"src/{k}.mp4" for k in CLIPS}
SEQ = [("h1", 0), ("h2", 0), ("h3", 0), ("h4", 0), ("h5", .30), ("n2", .25), ("n3", .25), ("n4", .25), ("n5", .25), ("b6", .25), ("n7", .25), ("n8", .25), ("n9", .40)]
WHO = {"b6": "YIRMIYAHU DANZIG &middot; i24NEWS, 2024"}
END = ("STRANGERS", "NEIGHBOURS.")
TEXT = {
    "h1": "~This man was one of the last six Jews in Yemen.", "h2": "~When he died, there was no one left to bury him.", "h3": "~So his Muslim neighbours did.", "h4": "~This is the story of", "h5": "~Yahya ben Yosef.",
    "n2": "~Jews have lived | ~in Yemen | ~for more than | ~two thousand years. | In 1949, | about *forty-nine thousand | of them | were flown | to *Israel.",
    "n3": "Yahya *stayed. | He lived in Madar, | a small village | north of *Sana&rsquo;a, | and he would not | leave *his home.",
    "n4": "~In June 2024, | ~he died. | There were | not enough Jews | left in Yemen | to *bury him, | or to say | the mourner&rsquo;s *prayer.",
    "n5": "So the men | of his village | *came. | They wrapped him | in a Jewish | *prayer shawl, | and carried him | up the hill | to *his grave.",
    "b6": "The men | of his village, | *non-Jews, | carrying his body | wrapped in | a prayer shawl, | and giving him | a *respectful burial.",
    "n7": "One man | from the area | told reporters: | Yahya was *beloved | by his village. | He was | a *good man.",
    "n8": "A year later, | his wife, | *Badra, | reached *Israel.",
    "n9": "This story is proof | that a good neighbour | never asks | what you *believe.",
}
FB = "YEMENI JEWS FACEBOOK PAGE, VIA i24NEWS"
CREDIT = {"X": FB, "yahya": FB, "yahya2": FB, "slope": FB, "lift": FB, "crowd": FB, "hill": FB}
BITECREDIT = {"b6": FB}
PC = {"jew_2.jpg": "SANA&rsquo;A, BEFORE 1909 &middot; HERMANN BURCHARDT", "synagogue_1.jpg": "SANA&rsquo;A, 1907 &middot; HERMANN BURCHARDT", "exodus_1.jpg": "YEMEN, 1949 &middot; ZOLTAN KLUGER, GPO",
      "village_3.jpg": "NORTH OF SANA&rsquo;A &middot; AYAH ALAKWAA, CC BY-SA", "village_4.jpg": "AMRAN, YEMEN &middot; AYAH ALAKWAA, CC BY-SA", "amran_1.jpg": "AMRAN, YEMEN, 1986 &middot; BERNARD GAGNON, CC BY-SA",
      "highlands_1.jpg": "YEMEN &middot; ROD WADDINGTON, CC BY-SA", "street_1.jpg": "YEMEN &middot; ROD WADDINGTON, CC BY-SA", "street_2.jpg": "YEMEN &middot; ROD WADDINGTON, CC BY-SA",
      "door_1.jpg": "YEMEN &middot; ROD WADDINGTON, CC BY-SA", "door_2.jpg": "YEMEN &middot; ROD WADDINGTON, CC BY-SA", "sanaa_2.jpg": "SANA&rsquo;A &middot; JULIAN-G. ALBERT, CC BY",
      "siddur_1.jpg": "YEMENITE PRAYER BOOK &middot; DAVIDBENA, CC BY-SA", "torah_1.jpg": "YEMENITE TORAH SCROLLS &middot; DAVIDBENA, CC BY-SA", "village_2.jpg": "YEMEN &middot; ROD WADDINGTON, CC BY-SA"}
PLAN = [
    ("h1", [(1, "yahya", 0.1, "wide", "glow arrow:690,810,2.2,200 title:this_man_was_one_of_the|LAST_SIX_JEWS|IN_YEMEN")]),
    ("h2", [(1, "P", "door_1.jpg", 50, "title:no_one_was_left|TO_BURY|HIM")]),
    ("h3", [(1, "lift", 0.1, "wide", "title:so_his|MUSLIM|NEIGHBOURS_DID")]),
    ("h4", [(1, "P", "village_3.jpg", 50, "title:this_is|THE_STORY|OF")]),
    ("h5", [(1, "yahya2", 0.1, "wide", "bigflash title:|YAHYA|BEN_YOSEF")]),
    ("n2", [(.3, "X2", "paper.jpg", 50, "map:YEMEN,44.2,15.4;ISRAEL,35.0,31.5@26,54,8,36"), (.18, "P", "jew_2.jpg", 40, "whip"), (.17, "P", "synagogue_1.jpg", 50, ""), (.18, "P", "exodus_1.jpg", 50, ""), (.17, "X2", "paper.jpg", 50, "count:#111111|flown_to_Israel|49|THOUSAND")]),
    ("n3", [(.26, "yahya", 2.6, "wide", "whip"), (.24, "P", "village_4.jpg", 50, ""), (.25, "P", "amran_1.jpg", 50, ""), (.25, "P", "door_2.jpg", 40, "")]),
    ("n4", [(.3, "X2", "paper.jpg", 50, "card:#111111|in_June_2024|HE_DIED"), (.24, "P", "siddur_1.jpg", 50, "whip"), (.23, "P", "g_shawl.jpg", 50, ""), (.23, "P", "street_1.jpg", 60, "")]),
    ("n5", [(.3, "slope", 0.1, "wide", "whip"), (.4, "lift", 0.1, "wide", ""), (.3, "crowd", 0.1, "wide", "")]),
    ("b6", [(1, "V", "b_b6_0.mp4@0", "wide", "whip")]),
    ("n7", [(.34, "P", "street_2.jpg", 50, "whip"), (.33, "P", "village_2.jpg", 30, ""), (.33, "yahya", 4.6, "wide", "")]),
    ("n8", [(.5, "P", "g_window.jpg", 50, "whip"), (.5, "P", "g_candles.jpg", 50, "")]),
    ("n9", [(.5, "hill", 0.1, "wide", "whip"), (.5, "P", "g_stones.jpg", 50, "shim")]),
    ("end", [(1, "P", "highlands_1.jpg", 50, "")]),
]
GEN = {"shawl": "A folded white Jewish prayer shawl with black stripes and knotted fringes lying on a simple wooden table beside an old prayer book, soft window light, no people",
       "window": "The view through an airplane window at sunrise: a wing and the coastline of Israel below, a small cloth bundle on the seat by the window, no people",
       "candles": "Two Sabbath candles burning in brass candlesticks on a white tablecloth by a window in a small home, a braided bread under an embroidered cloth, no people",
       "stones": "A simple grave on a bare rocky hilltop in the Yemeni highlands at sunset, small stones placed on top of it in the Jewish custom, terraced mountains behind, no people"}
GENSTYLE = "Mixed-media hand-cut paper collage, editorial zine style, vertical. Torn paper edges, scissor-cut borders, tape corners, halftone print dot patterns, paper drop shadows. Printed-texture cut-outs from vintage photography. NOT 3D, NOT CGI. Palette: parchment cream, charcoal black, warm gold accent, one terracotta red. No text, no letters, no faces. Subject: "

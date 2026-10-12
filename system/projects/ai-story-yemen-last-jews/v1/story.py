# Levi Marhabi and the last Jews of Yemen. V1. Narrator: ElevenLabs George. Template: "This man ... This is the story of ..." with an arrow on him.
# Asked for by Tal 2026-10-12 from the Times of Israel article of 8 March 2024 (an unnamed Arab country helped the last families out to Cairo).
# Facts: ../DOSSIER.md. Wording kept to what two sources carry: "one of the last Jews" (others remained in 2024), "centuries old" (500 vs 800 years),
# 13 people left in March 2021, the Arab-country part is attributed to the Times of Israel, his status is USCIRF's (September 2024, still "not released").
# His mother's words: Insaf Center for Defending Freedoms and Minorities (youtube z9M5tGMFGCA), Arabic, my translation, NOT cleared.
I = "src/z9M5tGMFGCA.mp4"          # Insaf: his mother Saida Yousef and his brother, filmed in Cairo
AP = "src/GOnOzzwMWhM.mp4"         # AP Archive, March 2016: the 17 arrive in Israel with the scroll
J = "src/yzedwHUGgWM.mp4"          # JDC Archives, 1949: Aden, the airlift
NOSUB = "crop=1920:960:0:0"        # the interview has English subtitles burned in at the bottom
VOICE = "JBFqnCBsd6RMkjVDRZzb"     # George
L = [("h1", "This man is one of the last Jews in Yemen."),
     ("h2", "He has been in prison for ten years."),
     ("h3", "A court ordered him freed. He is still there."),
     ("h4", "This is the story of"),
     ("h5", "Levi Marhabi."),
     ("n2", "Jews have lived in Yemen for more than two thousand years. In 1949, about forty-nine thousand of them were flown to Israel."),
     ("n3", "A few families stayed. Then war came, and the Houthis took the capital."),
     ("n4", "In 2016, seventeen Jews escaped to Israel, carrying a Torah scroll that was centuries old. Days later, Levi was arrested. He was accused of helping the scroll leave Yemen."),
     ("n5", "In 2019, a court ordered his release. It never happened."),
     ("n6", "In 2021, his family was told: leave Yemen, and he goes free. Thirteen people left for Cairo. His mother was one of them."),
     ("n8", "The Times of Israel reported that an Arab country with no ties to Israel helped get the last families out. Today, they work in Cairo as silversmiths."),
     ("n9", "But Levi is still in a cell. He is reported to be in solitary confinement, and in poor health."),
     ("n11", "Share this, so the world knows his name.")]
ON = {"b7": (I, [(4.92, 10.55)], (4.92, 10.6), NOSUB),
      "b10": (I, [(212.05, 213.90), (214.90, 218.70)], (212.05, 218.2), "crop=1920:640:0:10")}          # the crop also drops her name caption, which is burned in lower down
BITELANG = {"b7": "ar", "b10": "ar"}
CLIPS = {"kids": (AP, 3.6, 9.6, 1.25), "scroll": (AP, 35.6, 43.6, 1.2), "plane": (J, 66.5, 71.5, 1.5), "board": (J, 85.5, 92.0, 1.3), "walk": (J, 30.5, 37.0, 1.3),
         "mom": (I, 105.6, 112.4, 1.0, NOSUB), "pan": (I, 91.4, 95.6, 1.3, "crop=1100:800:520:95")}
VID = {k: f"src/{k}.mp4" for k in CLIPS}
SEQ = [("h1", 0), ("h2", 0), ("h3", 0), ("h4", 0), ("h5", .30), ("n2", .25), ("n3", .25), ("n4", .25), ("n5", .25), ("n6", .25), ("b7", .25), ("n8", .25), ("n9", .25), ("b10", .30), ("n11", .40)]
WHO = {"b7": "SAIDA YOUSEF &middot; LEVI&rsquo;S MOTHER", "b10": "SAIDA YOUSEF &middot; LEVI&rsquo;S MOTHER"}
END = ("FORGOTTEN", "FREE LEVI.")
TEXT = {
    "h1": "~This man is one of the last Jews in Yemen.", "h2": "~He has been in prison for ten years.", "h3": "~A court ordered him freed. He is still there.", "h4": "~This is the story of", "h5": "~Levi Marhabi.",
    "n2": "~Jews have lived | ~in Yemen | ~for more than | ~two thousand years. | In 1949, | about *forty-nine thousand | of them | were flown | to *Israel.",
    "n3": "A few families | *stayed. | Then war came, | and the Houthis | took *the capital.",
    "n4": "In 2016, | *seventeen Jews | escaped to Israel, | carrying a *Torah scroll | that was | centuries old. | Days later, | Levi was *arrested. | He was accused | of helping the scroll | *leave Yemen.",
    "n5": "~In 2019, | ~a court ordered | ~his release. | It *never happened.",
    "n6": "In 2021, | his family was told: | leave Yemen, | and he *goes free. | ~Thirteen people | ~left for Cairo. | His *mother | was one of them.",
    "b7": "They said | they would release | *our son | after we left. | We left Yemen. | They did *not | release our son.",
    "n8": "~The Times of Israel | ~reported | ~that an Arab country | ~with no ties to Israel | helped get | the last families *out. | Today, | they work in Cairo | as *silversmiths.",
    "n9": "But Levi | is still | in *a cell. | He is reported | to be in | *solitary confinement, | and in | poor health.",
    "b10": "I want them | to release | *my son. | There is nothing | in my heart | but *my son.",
    "n11": "Share this, | so the world | knows *his name.",
}
INS = "INSAF CENTER &middot; TRANSLATED FROM ARABIC"
CREDIT = {"X": INS, "mom": "INSAF CENTER", "pan": "FAMILY PHOTO VIA INSAF CENTER", "kids": "AP ARCHIVE, 2016", "scroll": "AP ARCHIVE, 2016", "plane": "JDC ARCHIVES, 1949", "board": "JDC ARCHIVES, 1949", "walk": "JDC ARCHIVES, 1949"}
BITECREDIT = {"b7": INS, "b10": INS}
WC = " &middot; WIKIMEDIA COMMONS"
PC = {"levi_portrait.jpg": "LEVI MARHABI &middot; FAMILY PHOTO VIA INSAF CENTER", "levi_asf.jpg": "LEVI MARHABI &middot; AMERICAN SEPHARDI FEDERATION",
      "prison_door_1.jpg": "CAPVIDEO, CC BY-SA", "prison_window_1.jpg": "BENO&Icirc;T PRIEUR, CC0", "prison_cell_2.jpg": "DQFN13, CC BY-SA",
      "sanaa_skyline_1.jpg": "SANA&rsquo;A, YEMEN &middot; MATT MAY, CC BY", "sanaa_skyline_2.jpg": "SANA&rsquo;A, YEMEN &middot; ROD WADDINGTON, CC BY-SA", "sanaa_street_1.jpg": "SANA&rsquo;A, YEMEN &middot; ROD WADDINGTON, CC BY-SA",
      "sanaa_street_2.jpg": "SANA&rsquo;A, YEMEN &middot; ROD WADDINGTON, CC BY-SA", "sanaa_towers_sunset.jpg": "SANA&rsquo;A, YEMEN &middot; AYAH ALAKWAA, CC BY-SA",
      "jews_maswar_1902.jpg": "YEMEN, 1902 &middot; HERMANN BURCHARDT", "jews_study_sanaa.jpg": "SANA&rsquo;A, BEFORE 1909 &middot; HERMANN BURCHARDT", "jews_sadah_1986.jpg": "SA&rsquo;DAH, YEMEN, 1986 &middot; BERNARD GAGNON, CC BY-SA",
      "magic_carpet_plane.jpg": "ISRAEL, 1950 &middot; FRITZ COHEN, GPO", "magic_carpet_airport.jpg": "ADEN, 1949 &middot; ZOLTAN KLUGER, GPO", "magic_carpet_walk.jpg": "YEMEN, 1949 &middot; ZOLTAN KLUGER, GPO",
      "torah_scrolls_1.jpg": "YEMENITE TORAH SCROLLS &middot; DAVIDBENA, CC BY-SA", "torah_case_1.jpg": "YEMENITE TORAH CASE &middot; OVEDC, CC BY-SA",
      "cairo_skyline_1.jpg": "CAIRO &middot; JORGE L&Aacute;SCAR, CC BY", "cairo_synagogue_1.jpg": "CAIRO &middot; WARREN LEMAY, CC0", "cairo_benezra_interior.jpg": "CAIRO &middot; SCHLANGER, CC BY-SA",
      "silversmith_bareket_1956b.jpg": "YEMENITE SILVERSMITH, 1956 &middot; BORIS CARMI, CC BY", "silver_amulets_2.jpg": "YEMENITE JEWISH SILVER &middot; DAVIDBENA, CC BY-SA", "silver_patterns_3.jpg": "YEMENITE JEWISH SILVER &middot; DAVIDBENA, CC BY-SA"}
PLAN = [
    ("h1", [(1, "P", "levi_portrait.jpg", 50, "glow still arrow:560,560,2.2,300 title:this_man_is_one_of_the|LAST_JEWS|IN_YEMEN")]),
    ("h2", [(1, "P", "prison_door_1.jpg", 50, "title:in_prison_for|TEN|YEARS")]),
    ("h3", [(1, "P", "g_gavel.jpg", 50, "title:a_court_ordered|HIM|FREED")]),
    ("h4", [(1, "P", "sanaa_skyline_2.jpg", 50, "title:this_is|THE_STORY|OF")]),
    ("h5", [(1, "P", "levi_asf.jpg", 50, "bigflash title:|LEVI|MARHABI")]),
    ("n2", [(.28, "X2", "paper.jpg", 50, "map:YEMEN,44.2,15.4;ISRAEL,35.0,31.5@26,54,8,36"), (.14, "P", "jews_maswar_1902.jpg", 50, "whip"), (.14, "P", "jews_study_sanaa.jpg", 50, ""),
            (.16, "plane", 0.1, "wide", ""), (.14, "board", 0.1, "wide", ""), (.14, "P", "magic_carpet_plane.jpg", 60, "")]),
    ("n3", [(.34, "P", "jews_sadah_1986.jpg", 50, "whip"), (.33, "P", "sanaa_street_1.jpg", 50, ""), (.33, "P", "sanaa_towers_sunset.jpg", 40, "")]),
    ("n4", [(.2, "kids", 0.1, "wide", "whip"), (.24, "scroll", 0.1, "wide", ""), (.14, "P", "torah_scrolls_1.jpg", 60, ""), (.2, "pan", 2.6, "wide", "tag:ARRESTED, MARCH 2016"), (.22, "P", "g_cell.jpg", 50, "")]),
    ("n5", [(.6, "X2", "paper.jpg", 50, "card:#7a1010|in_2019_a_court_ordered|HIS|RELEASE"), (.4, "P", "prison_window_1.jpg", 50, "whip")]),
    ("n6", [(.3, "P", "g_suitcases.jpg", 50, "whip"), (.2, "P", "sanaa_skyline_1.jpg", 40, ""), (.25, "X2", "paper.jpg", 50, "count:#111111|left_for_Cairo|13|PEOPLE"), (.25, "mom", 0.1, "tall68", "")]),
    ("b7", [(1, "V", "b_b7_0.mp4@0", "tall68", "whip")]),
    ("n8", [(.36, "X2", "paper.jpg", 50, "map:YEMEN,44.2,15.4;CAIRO,31.2,30.0@24,52,8,36"), (.16, "P", "cairo_skyline_1.jpg", 50, "whip"), (.16, "P", "cairo_synagogue_1.jpg", 60, ""), (.16, "P", "silversmith_bareket_1956b.jpg", 60, ""), (.16, "P", "silver_amulets_2.jpg", 50, "")]),
    ("n9", [(.34, "P", "prison_cell_2.jpg", 50, "whip"), (.33, "P", "g_cell.jpg", 50, ""), (.33, "P", "levi_asf.jpg", 50, "")]),
    ("b10", [(1, "V", "b_b10_0.mp4@0", "wide", "whip")]),
    ("n11", [(.5, "P", "g_chair.jpg", 50, "whip"), (.5, "P", "levi_portrait.jpg", 50, "shim")]),
    ("end", [(1, "P", "sanaa_skyline_1.jpg", 40, "")]),
]
GEN = {"gavel": "A judge's wooden gavel resting on a stamped court document on a dark desk, a shaft of light from a high window, no people",
       "cell": "An empty prison cell seen from inside: a narrow iron bed, a bare wall, one small barred window high up letting in a beam of light. Completely empty, absolutely no people, no figures",
       "suitcases": "Three old suitcases and a cloth bundle standing by an open carved wooden door of a stone house in Yemen, early morning light, no people",
       "chair": "An empty wooden chair at a set family table, one place setting untouched, warm lamp light, a window behind. No people, no photographs of people"}
GENSTYLE = "Mixed-media hand-cut paper collage, editorial zine style, vertical. Torn paper edges, scissor-cut borders, tape corners, halftone print dot patterns, paper drop shadows. Printed-texture cut-outs from vintage photography. NOT 3D, NOT CGI. Palette: parchment cream, charcoal black, warm gold accent, one deep blue. No text, no letters, no faces. Subject: "

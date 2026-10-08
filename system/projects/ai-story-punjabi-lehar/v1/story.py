# Nasir Dhillon and Bhupinder Singh Lovely, "Punjabi Lehar". V1. Narrator: ElevenLabs Sarah.
# Footage: AFP News Agency 2022 (youtube nOKnBFNqKdA, English subtitles are AFP's own) and BBC News Punjabi 2022 (ChBg5RFNshU). Credited on screen, NOT cleared.
# Facts: DOSSIER.md (AFP, PTI, NPR, Anadolu). The count of families is their own ("over 200" Jan 2022, "about 300" Aug 2022).
A = "../src/nOKnBFNqKdA.mp4"
B = "../src/ChBg5RFNshU.mp4"
VOICE = "EXAVITQu4vr4xnSDxMaL"          # Sarah
L = [  # hook: "These two friends are a Muslim and a Sikh. This is the story of Nasir Dhillon and Bhupinder Singh Lovely." (ig-reel hookscore 0)
     ("h1", "These two friends are a Muslim and a Sikh."),
     ("h2", "With one phone, they reunite families"),
     ("h3", "that India and Pakistan split in 1947."),
     ("h4", "This is the story of"),
     ("h5", "Nasir Dhillon and Bhupinder Singh Lovely."),
       # hook: "They lost each other for 74 years. You should see this." (ig-reel hookscore 100.0)
     ("n2", "When India and Pakistan were divided, millions fled across the new border. Brothers and sisters lost each other for a lifetime."),
     ("n3", "Nasir Dhillon and Bhupinder Singh Lovely film their stories, post them online, and wait for someone to recognise a face."),
     ("n4", "In 2022, two brothers met again, after seventy-four years."),
     ("n6", "By their count, they have reunited hundreds of families."),
     ("n8", "This story is proof that a border cannot divide a family forever.")]
ON = {"b5": (A, [(15.0, 19.4)], (15.0, 19.45)),
      "b7": (A, [(41.45, 47.68)], (41.45, 47.72))}
CLIPS = {"duo": (B, 82.1, 85.4, 1.25), "film": (B, 86.1, 88.0), "selfie": (B, 92.2, 95.0), "call": (B, 128.3, 133.8), "walk": (A, 1.2, 5.6), "hug2": (A, 17.6, 21.5, 1.4), "phone": (A, 175.2, 179.8), "nasir": (A, 181.2, 185.8),
         "sis": (A, 255.2, 257.6, 1.0, "crop=iw:ih*0.80:0:0")}
VID = {k: f"src/{k}.mp4" for k in CLIPS}
SEQ = [("h1", 0), ("h2", 0), ("h3", 0), ("h4", 0), ("h5", 0.3), ("n2", 0.25), ("n3", 0.25), ("n4", 0.25), ("b5", 0.25), ("n6", 0.25), ("b7", 0.25), ("n8", 0.4)]
WHO = {"b7": "SIKKA KHAN"}
END = ("DIVIDED", "REUNITED.")
TEXT = {
    "h1": "~These two friends are a Muslim and a Sikh.", "h2": "~With one phone, they reunite families", "h3": "~that India and Pakistan split in 1947.", "h4": "~This is the story of", "h5": "~Nasir Dhillon and Bhupinder Singh Lovely.",
    "n2": "When India and Pakistan | were *divided, | millions fled | across the new border. | Brothers and sisters | lost each other | for *a lifetime.",
    "n3": "Nasir Dhillon | and Bhupinder Singh Lovely | film their stories, | post them *online, | and wait for someone | to recognise | *a face.",
    "n4": "~In 2022, | two brothers | met again, | ~after | ~seventy-four years.",
    "b5": "~.",
    "n6": "By their count, | they have reunited | *hundreds | of families.",
    "b7": "~.",
    "n8": "This story is proof | that a border | cannot divide a family | *forever.",
}
AFP = "AFP NEWS AGENCY, 2022"
BBC = "BBC NEWS PUNJABI, 2022"
CREDIT = {"X": AFP, "walk": AFP, "hug2": AFP, "phone": AFP, "nasir": AFP, "sis": AFP, "duo": BBC + " &middot; PUNJABI LEHAR", "film": BBC + " &middot; PUNJABI LEHAR", "selfie": BBC + " &middot; PUNJABI LEHAR", "call": BBC}
PD = "1947 &middot; PUBLIC DOMAIN, WIKIMEDIA COMMONS"
PC = {"p1947_columns.jpg": PD, "p1947_convoy.jpg": PD, "p1947_delhi_station.jpg": PD, "p1947_luggage.jpg": PD, "p1947_kingsway.jpg": PD, "faisalabad_clock.jpg": "FAISALABAD, PAKISTAN &middot; WIKIMEDIA COMMONS",
      "kartarpur_a.jpg": "KARTARPUR SAHIB, PAKISTAN &middot; WIKIMEDIA COMMONS", "kartarpur_07.jpg": "KARTARPUR SAHIB, PAKISTAN &middot; WIKIMEDIA COMMONS", "wagah_gate.jpg": "WAGAH BORDER &middot; WIKIMEDIA COMMONS", "corridor_zero_line.jpg": "KARTARPUR CORRIDOR &middot; WIKIMEDIA COMMONS"}
PLAN = [
    ("h1", [(1, "duo", 0.0, "band", "glow arrow:820,690,2.4,185 title:these_two_friends_are_a|MUSLIM_AND|A_SIKH")]),
    ("h2", [(1, "call", 0.2, "band", "title:they_reunite|FAMILIES")]),
    ("h3", [(1, "P", "p1947_columns.jpg", 50, "title:split_in|1947")]),
    ("h4", [(1, "P", "kartarpur_a.jpg", 50, "title:this_is|THE_STORY|OF")]),
    ("h5", [(1, "call", 0.2, "band", "bigflash title:|NASIR_DHILLON|&amp;_LOVELY_SINGH")]),
    ("n2", [(.34, "X2", "paper.jpg", 50, "map:PAKISTAN,71.5,30.2;INDIA,78.5,24.5@58,92,14,40"), (.2, "P", "p1947_convoy.jpg", 50, "whip"), (.2, "P", "p1947_delhi_station.jpg", 50, ""), (.2, "P", "p1947_luggage.jpg", 50, ""), (.2, "P", "wagah_gate.jpg", 50, ""), (.2, "P", "p1947_kingsway.jpg", 50, "")]),
    ("n3", [(.2, "nasir", 0.0, "tall50", "whip tag:NASIR DHILLON"), (.2, "duo", 1.2, "band", "tag:BHUPINDER SINGH LOVELY"), (.2, "selfie", 0.0, "band", ""), (.2, "phone", 0.0, "band", ""), (.2, "call", 2.4, "band", "")]),
    ("n4", [(.3, "P", "kartarpur_a.jpg", 50, "whip"), (.34, "walk", 0.0, "band", ""), (.36, "X2", "paper.jpg", 50, "count:#7a1010|they_met_again_after|74|YEARS")]),
    ("b5", [(-2.2, "V", "b_b5_0.mp4@0", "band", "bigflash"), (1, "V", "b_b5_0.mp4@2.2", "band", "z1.25")]),
    ("n6", [(.34, "hug2", 0.0, "band", "whip"), (.33, "sis", 0.0, "band", ""), (.33, "call", 3.6, "band", "")]),
    ("b7", [(-3.0, "V", "b_b7_0.mp4@0", "wide", "whip"), (1, "V", "b_b7_0.mp4@3.0", "wide", "")]),
    ("n8", [(.5, "P", "corridor_zero_line.jpg", 50, "whip"), (.5, "hug2", 0.3, "band", "shim")]),
    ("end", [(1, "P", "kartarpur_07.jpg", 50, "")]),
]

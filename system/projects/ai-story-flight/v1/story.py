# Flydubai FZ1073, 30 Sept 2026: Captain Smit Machchhar and the passengers who helped. V1. Narrator: ElevenLabs Brian.
# His voice: phone call released by the Israeli Government Press Office, 3 Oct 2026 (youtube hLPZ1NJav4o), AUDIO ONLY (the picture of that call is never shown).
# His face: PM Modi's call, source PMO India (a CC BY 4.0 copy exists on Commons). NOT cleared beyond that.
# Facts: DOSSIER.md. The event is days old: no motive stated, the attacker is not named, "about 180 people" (sources give 174-182),
# and the plumber's role is told as passengers and AP tell it.
G = "../src/hLPZ1NJav4o.mp4"
M = "../src/REmnuDhRZuE.mp4"
VOICE = "nPczCjzI2devNBz1zQrb"          # Brian
L = [("h1", "An Indian pilot"),
     ("h2", "was attacked in his own cockpit."),
     ("h3", "About one hundred and eighty people were on board."),
     ("h4", "The plane began to fall."),
     ("h5", "Then strangers ran to help."),
     ("n2", "Captain Smit Machchhar was flying from Dubai to Tel Aviv. He was struck from behind, and fell to the cockpit floor."),
     ("n4", "The cockpit door was locked. So he got up."),
     ("n5", "Passengers rushed in. An Israeli plumber pulled back on the controls. An Israeli dentist stopped the captain's bleeding. Two off-duty pilots landed the plane in Saudi Arabia."),
     ("n7", "Everyone on board survived."),
     ("n8", "This story is proof that in the worst moment, strangers become one crew.")]
ON = {"b3": (G, [(157.84, 158.30), (159.62, 163.62)], (157.84, 158.9)),
      "b4": (G, [(181.30, 183.14), (187.00, 191.62)], (181.3, 182.3)),
      "b6": (G, [(343.95, 346.00)], (343.95, 344.9))}
LEFT = "crop=iw/2:ih:0:0"
CLIPS = {"smit": (M, 149.0, 152.0, 1.0, LEFT), "smit2": (M, 435.6, 440.4, 1.0, LEFT)}
VID = {k: f"src/{k}.mp4" for k in CLIPS}
SEQ = [("h1", .04), ("h2", .06), ("h3", .05), ("h4", .05), ("h5", .14), ("n2", .10), ("b3", .12), ("n4", .10), ("b4", .12), ("n5", .12), ("b6", .12), ("n7", .10), ("n8", .40)]
WHO = {"b3": "CAPTAIN SMIT MACHCHHAR &middot; HIS VOICE", "b4": "CAPTAIN SMIT MACHCHHAR &middot; HIS VOICE", "b6": "CAPTAIN SMIT MACHCHHAR &middot; HIS VOICE"}
END = ("STRANGERS", "ONE CREW.")
TEXT = {
    "h1": "~An Indian pilot", "h2": "~was attacked in his own cockpit.", "h3": "~About one hundred and eighty people were on board.", "h4": "~The plane began to fall.", "h5": "~Then strangers ran to help.",
    "n2": "Captain Smit Machchhar | was flying from Dubai | to *Tel Aviv. | He was struck | from behind, | and fell to the | *cockpit floor.",
    "b3": "I felt the aircraft, | and the whooshing sound, | and people | *screaming.",
    "n4": "The cockpit door | was *locked. | So he | *got up.",
    "b4": "If I don&rsquo;t do it, | I&rsquo;m going to *die. | I gave everything | that I had, | and just went for the door, | and *opened the door.",
    "n5": "Passengers | *rushed in. | An Israeli plumber | pulled back | on *the controls. | An Israeli dentist | stopped the captain&rsquo;s | *bleeding. | Two off-duty pilots | landed the plane | in *Saudi Arabia.",
    "b6": "He saved my life, | to be *honest.",
    "n7": "Everyone on board | *survived.",
    "n8": "This story is proof | that in the worst moment, | strangers become | *one crew.",
}
PMO = "CAPTAIN SMIT MACHCHHAR &middot; SOURCE: PMO INDIA"
CREDIT = {"smit": PMO, "smit2": PMO}
WC = " &middot; WIKIMEDIA COMMONS"
PC = {"cockpit_max_1.jpg": "BOEING 737 MAX COCKPIT" + WC, "cabin_flydubai_max.jpg": "FLYDUBAI 737 MAX CABIN" + WC, "fz1073_altitude_chart.jpg": "FLIGHT FZ1073 ALTITUDE" + WC, "plane_a6fkf_dxb.jpg": "THE AIRCRAFT, A6-FKF" + WC,
      "dxb_t2_ramp.jpg": "DUBAI" + WC, "tabuk_airport.jpg": "TABUK AIRPORT, SAUDI ARABIA" + WC, "tabuk_desert.jpg": "TABUK, SAUDI ARABIA" + WC, "window_flydubai.jpg": "WIKIMEDIA COMMONS", "plane_a6fmn_takeoff.jpg": "WIKIMEDIA COMMONS", "tlv_aerial.jpg": "TEL AVIV" + WC}
PLAN = [
    ("h1", [(1, "smit", 0.1, "tall50", "glow title:an|INDIAN|PILOT")]),
    ("h2", [(1, "P", "cockpit_max_1.jpg", 50, "title:attacked_in_his|OWN|COCKPIT")]),
    ("h3", [(1, "P", "cabin_flydubai_max.jpg", 50, "title:on_board_about|180|PEOPLE")]),
    ("h4", [(1, "P", "g_dive.jpg", 50, "title:the_plane|BEGAN|TO_FALL")]),
    ("h5", [(1, "P", "g_aisle.jpg", 50, "bigflash title:then|STRANGERS|RAN_TO_HELP")]),
    ("n2", [(.2, "P", "plane_a6fkf_dxb.jpg", 50, "whip"), (.2, "P", "dxb_t2_ramp.jpg", 50, ""), (.2, "P", "plane_a6fmn_takeoff.jpg", 50, ""), (.2, "P", "cockpit_max_1.jpg", 50, "z1.4"), (.2, "P", "g_floor.jpg", 50, "thud0")]),
    ("b3", [(.34, "P", "g_dive.jpg", 50, "whip z1.2"), (.33, "P", "fz1073_altitude_chart.jpg", 50, ""), (.33, "P", "window_flydubai.jpg", 50, "")]),
    ("n4", [(.5, "P", "g_door.jpg", 50, "whip"), (.5, "P", "g_floor.jpg", 50, "z1.3")]),
    ("b4", [(.34, "P", "g_handle.jpg", 50, "whip"), (.33, "P", "g_door.jpg", 50, "z1.3"), (.33, "P", "g_handle.jpg", 50, "z1.5 door0")]),
    ("n5", [(.17, "P", "g_aisle.jpg", 50, "whip run"), (.17, "P", "g_yoke.jpg", 50, ""), (.17, "P", "g_yoke.jpg", 50, "z1.4"), (.17, "P", "g_cloth.jpg", 50, ""), (.16, "P", "plane_a6fmn_takeoff.jpg", 50, ""), (.16, "P", "tabuk_airport.jpg", 50, "")]),
    ("b6", [(1, "smit2", 0.1, "tall50", "whip")]),
    ("n7", [(.5, "P", "tabuk_desert.jpg", 50, "whip"), (.5, "P", "g_exit.jpg", 50, "")]),
    ("n8", [(.5, "P", "g_hands.jpg", 50, "whip"), (.5, "smit2", 1.4, "tall50", "shim")]),
    ("end", [(1, "P", "plane_a6fkf_dxb.jpg", 50, "")]),
]
GEN = {"dive": "View from inside an airliner cockpit through the windscreen, the horizon tilted steeply and clouds rushing up, instrument panel in the foreground, empty seats, no people",
       "aisle": "Several airline passengers seen from behind rushing up the narrow aisle of a modern airliner cabin toward the front, motion blur, overhead bins, no faces visible",
       "floor": "Low angle from the floor of an airliner cockpit: rudder pedals, the base of the pilot seats and the centre console above, dim light, no people",
       "door": "A closed reinforced cockpit door at the front of an airliner cabin seen from the aisle, a keypad beside it, galley light, no people",
       "handle": "Extreme close-up of a man's hand in a white pilot shirt sleeve with four gold stripes gripping and turning a metal door knob on a grey aircraft door, no face",
       "yoke": "Close-up of a man's hands in a plain grey T-shirt gripping an airliner control yoke and pulling it back, cockpit windscreen with sky behind, no face",
       "cloth": "Close-up of two pairs of hands pressing a folded white towel together in an aircraft galley, a first-aid kit open beside them, no faces, no blood",
       "landing": "A white and blue twin-engine airliner touching down on a runway in a rocky desert, tyre smoke, heat haze, mountains behind, telephoto",
       "exit": "Passengers seen from behind walking down aircraft stairs onto a sunny desert airport apron, some with arms around each other, an airport building ahead, no faces",
       "hands": "Close-up of many different hands of different skin tones stacked together in a circle inside an airport terminal, no faces"}

# Abanoub Samaan V1. Narrator: ElevenLabs George. His words: Stand Tall Israel interview, 14 Sept 2026 (youtube FtyLuBH3RnQ), his first public interview, credited on screen, NOT cleared, and he has not been asked.
# Facts: DOSSIER.md, all his own account. American-born Coptic Christian, California; six months in Egypt in 2024. The interview's political passages are NOT used: this is only the story of a man who questioned his own anger.
V = "../src/abanoub-samaan_stand-tall-israel_FtyLuBH3RnQ.mp4"
VOICE = "JBFqnCBsd6RMkjVDRZzb"          # George
L = [("h1", "A young Coptic Christian"),
     ("h2", "learned who to hate from his phone."),
     ("h3", "He was angry at the world."),
     ("h4", "Then he asked himself"),
     ("h5", "one question."),
     ("n3", "Abanoub Samaan grew up in America. He says social media taught him who the enemy was, and he never checked."),
     ("n5", "Then he spent six months in Egypt, and started reading for himself."),
     ("n7", "This year, he said it out loud for the first time. He says it frightened him."),
     ("n9", "This story is proof that doubting your own anger can be the beginning of love.")]
ON = {"b2": (V, [(409.50, 412.95)], (409.50, 413.0)),
      "b4": (V, [(980.38, 982.95)], (980.38, 983.0)),
      "b6": (V, [(1418.22, 1420.75)], (1418.22, 1420.8)),
      "b8": (V, [(2939.52, 2942.65)], (2939.52, 2942.7))}
CLIPS = {"open": (V, 409.6, 413.0)}
VID = {k: f"src/{k}.mp4" for k in CLIPS}
SEQ = [("h1", .04), ("h2", .06), ("h3", .05), ("h4", .04), ("h5", .14), ("b2", .12), ("n3", .10), ("b4", .12), ("n5", .10), ("b6", .12), ("n7", .12), ("b8", .14), ("n9", .40)]
WHO = {"b2": "ABANOUB SAMAAN"}
END = ("ANGER", "LOVE.")
TEXT = {
    "h1": "~A young Coptic Christian", "h2": "~learned who to hate from his phone.", "h3": "~He was angry at the world.", "h4": "~Then he asked himself", "h5": "~one question.",
    "b2": "Why don&rsquo;t you | *doubt | your own beliefs, | and check | the *other side?",
    "n3": "Abanoub Samaan | grew up in *America. | He says social media | taught him | who *the enemy was, | and he never | *checked.",
    "b4": "I was *wrong | about that type | of thinking.",
    "n5": "Then he spent | six months | in *Egypt, | and started reading | *for himself.",
    "b6": "We should, you know, | have a heart, | and *love everyone.",
    "n7": "This year, | he said it out loud | for the *first time. | He says | it *frightened him.",
    "b8": "The goal | is to convince others | *with love.",
    "n9": "This story is proof | that doubting | your own anger | can be the beginning | of *love.",
}
ST = "STAND TALL ISRAEL, 2026"
CREDIT = {"X": ST, "open": ST}
WC = " &middot; WIKIMEDIA COMMONS"
PC = {"coptic_stmark_a.jpg": "COPTIC CATHEDRAL, CAIRO" + WC, "coptic_hanging_a.jpg": "THE HANGING CHURCH, CAIRO" + WC, "coptic_cross_philae.jpg": "COPTIC CROSS, EGYPT" + WC, "cairo_muizz.jpg": "CAIRO" + WC, "cairo_talaat_harb.jpg": "CAIRO" + WC,
      "coptic_cave_church.jpg": "CAVE CHURCH, CAIRO" + WC, "coptic_service.jpg": "COPTIC SERVICE" + WC, "coptic_stgeorge_in_a.jpg": "COPTIC CAIRO" + WC, "cairo_shopping.jpg": "CAIRO" + WC, "coptic_hanging_b.jpg": "THE HANGING CHURCH, CAIRO" + WC}
PLAN = [
    ("h1", [(1, "open", 0.1, "tall50", "glow title:a_young|COPTIC|CHRISTIAN")]),
    ("h2", [(1, "P", "g_phone.jpg", 50, "title:learned_who_to_hate_from|HIS_PHONE")]),
    ("h3", [(1, "P", "g_room.jpg", 50, "title:he_was|ANGRY_AT|THE_WORLD")]),
    ("h4", [(1, "P", "coptic_cross_philae.jpg", 50, "title:then_he_asked|HIMSELF")]),
    ("h5", [(1, "P", "g_mirror.jpg", 50, "bigflash title:just|ONE|QUESTION")]),
    ("b2", [(-1.8, "V", "b_b2_0.mp4@0", "tall50", "whip"), (1, "V", "b_b2_0.mp4@1.8", "tall50", "z1.25")]),
    ("n3", [(.2, "P", "g_street.jpg", 50, "whip"), (.2, "P", "g_phone.jpg", 50, "z1.3"), (.2, "P", "coptic_service.jpg", 50, ""), (.2, "P", "g_room.jpg", 50, "z1.2"), (.2, "P", "coptic_stmark_a.jpg", 50, "")]),
    ("b4", [(1, "V", "b_b4_0.mp4@0", "tall50", "whip z1.1")]),
    ("n5", [(.25, "P", "cairo_talaat_harb.jpg", 50, "whip"), (.25, "P", "coptic_hanging_a.jpg", 50, ""), (.25, "P", "cairo_muizz.jpg", 50, ""), (.25, "P", "g_books.jpg", 50, "")]),
    ("b6", [(1, "V", "b_b6_0.mp4@0", "tall50", "whip z1.15")]),
    ("n7", [(.5, "open", 0.1, "tall50", "whip"), (.5, "P", "coptic_cave_church.jpg", 50, "")]),
    ("b8", [(1, "V", "b_b8_0.mp4@0", "tall50", "whip z1.15")]),
    ("n9", [(.5, "P", "coptic_hanging_b.jpg", 50, "whip"), (.5, "P", "g_books.jpg", 50, "shim")]),
    ("end", [(1, "P", "coptic_stmark_a.jpg", 50, "")]),
]
GEN = {"phone": "Close-up of a young man's hands holding a smartphone in a dark bedroom at night, his thumbs scrolling, the cold glow of the screen on his hands, the screen content blurred, no face",
       "room": "A dark bedroom at night lit only by a laptop and a phone on the bed, a hoodie over a chair, blinds closed, no people",
       "mirror": "A bathroom mirror fogged with steam with a question mark drawn in it by a finger, a single bulb, no people, no reflection of a person",
       "street": "A quiet sunny suburban street in California with palm trees and parked cars, a small church with a cross at the end of the road, no people",
       "feed": "Extreme close-up of a phone screen showing a blurred endless social media feed of angry red headlines and comment bubbles, text unreadable, a thumb scrolling",
       "books": "A wooden desk by a window with a stack of history books, an open notebook with handwriting, a cup of tea and a small wooden cross, morning light, no people",
       "mic": "A simple desk with a laptop, a webcam and a small microphone ready for an online interview, a chair pulled back, nervous hands of a young man clasped on the desk, no face"}

# Abanoub Samaan V1. Narrator: ElevenLabs George. His words: Stand Tall Israel interview, 14 Sept 2026 (youtube FtyLuBH3RnQ), his first public interview, credited on screen, NOT cleared, and he has not been asked.
# Facts: DOSSIER.md, all his own account. American-born Coptic Christian, California; six months in Egypt in 2024. The interview's political passages are NOT used: this is only the story of a man who questioned his own anger.
V = "../src/abanoub-samaan_stand-tall-israel_FtyLuBH3RnQ.mp4"
VOICE = "JBFqnCBsd6RMkjVDRZzb"          # George
L = [  # hook: "This guy hated Israel, until he asked himself one question. This is the story of Abanoub Samaan." (ig-reel hookscore 0)
     ("h1", "This guy hated Israel,"),
     ("h2", "until he asked himself"),
     ("h3", "one question."),
     ("h4", "This is the story of"),
     ("h5", "Abanoub Samaan."),
       # hook: "He hated Israel until he doubted himself. You should try it." (ig-reel hookscore 100.0)
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
SEQ = [("h1", 0), ("h2", 0), ("h3", 0), ("h4", 0), ("h5", 0.3), ("b2", 0.25), ("n3", 0.25), ("b4", 0.25), ("n5", 0.25), ("b6", 0.25), ("n7", 0.25), ("b8", 0.25), ("n9", 0.4)]
WHO = {"b2": "ABANOUB SAMAAN"}
END = ("ANGER", "LOVE.")
TEXT = {
    "h1": "~This guy hated Israel,", "h2": "~until he asked himself", "h3": "~one question.", "h4": "~This is the story of", "h5": "~Abanoub Samaan.",
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
    ("h1", [(1, "open", 0.1, "tall50", "glow arrow:540,790,1.5,300 title:this_guy|HATED|ISRAEL")]),
    ("h2", [(1, "P", "g_phone.jpg", 50, "title:until_he_asked|HIMSELF")]),
    ("h3", [(1, "P", "g_mirror.jpg", 50, "title:|ONE|QUESTION")]),
    ("h4", [(1, "P", "coptic_cross_philae.jpg", 50, "title:this_is|THE_STORY|OF")]),
    ("h5", [(1, "open", 1.4, "tall50", "bigflash title:|ABANOUB|SAMAAN")]),
    ("b2", [(-1.8, "V", "b_b2_0.mp4@0", "tall50", "whip"), (1, "V", "b_b2_0.mp4@1.8", "tall50", "z1.25")]),
    ("n3", [(.2, "P", "g_street.jpg", 50, "whip"), (.2, "P", "g_phone.jpg", 50, "z1.3"), (.2, "P", "g_room.jpg", 50, "z1.2"), (.2, "P", "coptic_stmark_a.jpg", 50, "")]),
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

# The illustrations in the Vox paper-collage look (style block from skills/toolbox/vox-ai-motion-graphics-generator), made with Agnes.
GENSTYLE = "Mixed-media hand-cut paper collage, editorial zine style, vertical. Torn paper edges, scissor-cut borders, tape corners, halftone print dot patterns, paper drop shadows. Figures are printed-texture cut-outs from vintage photography. NOT 3D, NOT CGI. Palette: parchment cream, charcoal black, warm gold accent, one deep green. No text, no letters, no faces. Subject: "

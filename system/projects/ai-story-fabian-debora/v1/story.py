# Fabian Debora V1. Narrator: ElevenLabs Matilda.
# His words and pictures: National Endowment for the Arts tribute film, 2024 (youtube isUTwa1JEqY) and PBS NewsHour, 10 Dec 2024 (Y4_IBcgUIIw). Credited on screen, NOT cleared.
# Facts: DOSSIER.md. He teaches young people "actively involved in gangs" (the "former enemies paint together" angle is NOT sourced and is not said). No student's face is shown.
N = "../src/isUTwa1JEqY.mp4"
P_ = "../src/Y4_IBcgUIIw.mp4"
VOICE = "XrExE9yKIg1WjnnlVkGX"          # Matilda
L = [  # hook: "This man joined a gang at twelve. This is the story of Fabian Debora." (ig-reel hookscore 0)
     ("h1", "This man joined a gang at twelve."),
     ("h2", "Today, he teaches kids like him"),
     ("h3", "to paint."),
     ("h4", "This is the story of"),
     ("h5", "Fabian Debora."),
       # hook: "At 12 he made his worst mistake. You should see him now." (ig-reel hookscore 100.0)
     ("n3", "Fabian Debora grew up in Boyle Heights. He was in and out of prison, and lost in addiction."),
     ("n5", "Father Greg Boyle runs Homeboy Industries, where people leaving gangs get a second chance."),
     ("n7", "Today, Fabian runs the Homeboy Art Academy. His students are young people still caught up in gangs."),
     ("n9", "This story is proof that your past can become your gift.")]
ON = {"b2": (N, [(124.48, 126.30), (126.82, 128.98)], (142.2, 146.4)),
      "b4": (P_, [(95.94, 102.62)], (95.94, 102.66)),
      "b6": (N, [(209.36, 212.90)], (209.36, 211.9)),
      "b8": (N, [(291.72, 294.82)], (292.0, 294.3), "crop=iw*0.5:ih:0:0,tpad=start_mode=clone:start_duration=0.28")}
CLIPS = {"mural": (N, 0.2, 3.0), "brush": (N, 9.6, 13.4), "prof": (N, 14.6, 17.4), "circle": (N, 253.6, 256.4), "eye": (N, 334.5, 339.5), "sketch": (N, 146.5, 150.5),
         "teach": (N, 292.0, 294.2, 1.3, "crop=iw*0.5:ih:0:0")}
VID = {k: f"src/{k}.mp4" for k in CLIPS}
SEQ = [("h1", 0), ("h2", 0), ("h3", 0), ("h4", 0), ("h5", 0.3), ("b2", 0.25), ("n3", 0.25), ("b4", 0.25), ("n5", 0.25), ("b6", 0.25), ("n7", 0.25), ("b8", 0.25), ("n9", 0.4)]
WHO = {"b2": "FABIAN DEBORA", "b4": "FABIAN DEBORA"}
END = ("PRISONER", "TEACHER.")
TEXT = {
    "h1": "~This man joined a gang at twelve.", "h2": "~Today, he teaches kids like him", "h3": "~to paint.", "h4": "~This is the story of", "h5": "~Fabian Debora.",
    "b2": "I joined a gang | at the age of *12. | It was the | *worst mistake | I ever made.",
    "n3": "Fabian Debora | grew up in | *Boyle Heights. | He was in and out | of *prison, | and lost in | *addiction.",
    "b4": "Father Greg | just kept *accepting, | embracing, | and receiving me, | regardless of | where I was at | *in my life.",
    "n5": "Father Greg Boyle | runs Homeboy Industries, | where people | leaving gangs | get a | *second chance.",
    "b6": "I made a decision | to just start | *creating | bodies of work.",
    "n7": "Today, | Fabian runs the | Homeboy *Art Academy. | His students | are young people | still caught up | in *gangs.",
    "b8": "So don&rsquo;t be ashamed | of *your past. | *Embrace | your past.",
    "n9": "This story is proof | that your past | can become | *your gift.",
}
NEA = "NATIONAL ENDOWMENT FOR THE ARTS, 2024"
PBS = "PBS NEWSHOUR, 2024"
CREDIT = {"X": NEA}
CREDIT.update({k: NEA for k in CLIPS})
BITECREDIT = {"b4": PBS}
WC = " &middot; WIKIMEDIA COMMONS"
PC = {"bh_street_2012.jpg": "BOYLE HEIGHTS, LOS ANGELES" + WC, "bh_ramona1.jpg": "BOYLE HEIGHTS, LOS ANGELES" + WC, "boyle_medal.jpg": "FATHER GREG BOYLE" + WC, "boyle_durfee.jpg": "FATHER GREG BOYLE" + WC, "bh_house.jpg": "BOYLE HEIGHTS" + WC,
      "la_freeway.jpg": "LOS ANGELES" + WC, "la_101_night.jpg": "LOS ANGELES" + WC, "homeboy_bakery_cafe.jpg": "HOMEBOY INDUSTRIES, LOS ANGELES" + WC, "homeboy_goldline.jpg": "HOMEBOY INDUSTRIES, LOS ANGELES" + WC,
      "bh_mural_religious.jpg": "BOYLE HEIGHTS" + WC, "la_6th_bridge.jpg": "LOS ANGELES" + WC, "ela_mural_blanquita1.jpg": "EAST LOS ANGELES" + WC, "bh_cesar_chavez.jpg": "BOYLE HEIGHTS" + WC}
PLAN = [
    ("h1", [(1, "prof", 0.1, "tall50", "glow arrow:260,680,2.0,345 title:this_man_joined|A_GANG|AT_TWELVE")]),
    ("h2", [(1, "teach", 0.0, "tall50", "title:today_he_teaches|KIDS|LIKE_HIM")]),
    ("h3", [(1, "mural", 0.0, "band", "title:to|PAINT")]),
    ("h4", [(1, "P", "bh_street_2012.jpg", 50, "title:this_is|THE_STORY|OF")]),
    ("h5", [(1, "sketch", 0.0, "band", "bigflash title:|FABIAN|DEBORA")]),
    ("b2", [(-1.9, "P", "bh_ramona1.jpg", 50, "whip"), (1, "V", "b_b2_0.mp4@0", "band", "")]),
    ("n3", [(.2, "P", "bh_house.jpg", 50, "whip"), (.2, "P", "bh_cesar_chavez.jpg", 50, ""), (.2, "P", "g_cell.jpg", 50, ""), (.2, "P", "la_101_night.jpg", 50, ""), (.2, "P", "la_freeway.jpg", 50, "")]),
    ("b4", [(-2.3, "V", "b_b4_0.mp4@0", "tall68", "whip"), (-2.2, "V", "b_b4_0.mp4@2.3", "tall68", "z1.2"), (1, "V", "b_b4_0.mp4@4.5", "tall68", "")]),
    ("n5", [(.25, "P", "boyle_durfee.jpg", 50, "whip"), (.25, "P", "homeboy_bakery_cafe.jpg", 50, ""), (.25, "P", "homeboy_goldline.jpg", 50, ""), (.25, "P", "bh_mural_religious.jpg", 50, "")]),
    ("b6", [(-2.5, "V", "b_b6_0.mp4@0", "tall60", "whip"), (1, "sketch", 0.0, "band", "")]),
    ("n7", [(.2, "circle", 0.0, "band", "whip"), (.2, "brush", 0.0, "band", ""), (.2, "eye", 0.0, "band", ""), (.2, "sketch", 1.4, "band", ""), (.2, "eye", 2.0, "band", "z1.2")]),
    ("b8", [(-2.0, "V", "b_b8_0.mp4@0", "tall50", "whip"), (1, "brush", 1.2, "band", "")]),
    ("n9", [(.5, "P", "ela_mural_blanquita1.jpg", 50, "whip"), (.5, "prof", 0.3, "tall50", "shim")]),
    ("end", [(1, "P", "la_6th_bridge.jpg", 50, "")]),
]
GEN = {"cell": "An empty juvenile detention cell: narrow steel bed, small high window, a pencil drawing of a face taped to the concrete wall, no people"}

# The illustrations in the Vox paper-collage look (style block from skills/toolbox/vox-ai-motion-graphics-generator), made with Agnes.
GENSTYLE = "Mixed-media hand-cut paper collage, editorial zine style, vertical. Torn paper edges, scissor-cut borders, tape corners, halftone print dot patterns, paper drop shadows. Figures are printed-texture cut-outs from vintage photography. NOT 3D, NOT CGI. Palette: parchment cream, charcoal black, warm gold accent, one deep green. No text, no letters, no faces. Subject: "

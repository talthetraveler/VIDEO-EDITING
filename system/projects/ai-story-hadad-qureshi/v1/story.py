# Amir Hadad (Israel) and Aisam-ul-Haq Qureshi (Pakistan), Wimbledon and US Open 2002. V1. Narrator: ElevenLabs George.
# No footage of the pair and no free photo of Amir Hadad exists (DOSSIER.md): Qureshi is shown in real photos, Hadad only as illustration (backs and hands, no face).
# Facts: DOSSIER.md (AP, Reuters, Dawn, AFP, ATP). He was never banned: the Pakistan Sports Board said he "may face a ban"; the federation dropped it by Sept 2002.
VOICE = "JBFqnCBsd6RMkjVDRZzb"          # George
L = [  # hook template (Tal, 2026-10-08): "This man [what happened]. This is the story of NAME", an arrow on the real person
     ("h1", "This man"),
     ("h2", "was told to stop playing tennis"),
     ("h3", "with an Israeli."),
     ("h4", "He refused."),
     ("h5", "This is the story of Aisam Qureshi."),
     ("n2", "In 2002, Aisam Qureshi of Pakistan and Amir Hadad of Israel both needed a partner. They chose each other, and fought their way into Wimbledon."),
     ("n3", "They beat the eleventh seeds, and reached the last sixteen."),
     ("n4", "Back home, officials condemned it. They warned Qureshi that he could be banned from the national team."),
     ("n5", "Two months later, he walked onto court at the US Open, with Hadad beside him."),
     ("n6", "No ban ever came. They shared the Arthur Ashe Humanitarian Award. And today, Qureshi is president of the federation that once threatened him."),
     ("n7", "This story is proof that a friendship can be stronger than a border.")]
SEQ = [("h1", 0), ("h2", 0), ("h3", 0), ("h4", 0), ("h5", 0.3), ("n2", 0.25), ("n3", 0.25), ("n4", 0.25), ("n5", 0.25), ("n6", 0.25), ("n7", 0.4)]
END = ("ENEMIES", "TEAMMATES.")
TEXT = {
    "h1": "~This man", "h2": "~was told to stop playing tennis", "h3": "~with an Israeli.", "h4": "~He refused.", "h5": "~This is the story of Aisam Qureshi.",
    "n2": "In 2002, | Aisam Qureshi | of *Pakistan | and Amir Hadad | of *Israel | both needed | a partner. | They chose | *each other, | and fought their way | into *Wimbledon.",
    "n3": "They beat | the eleventh seeds, | ~and reached | ~the last sixteen.",
    "n4": "Back home, | officials | *condemned it. | They warned Qureshi | that he could be | *banned | from the national team.",
    "n5": "Two months later, | he walked onto court | at the *US Open, | with Hadad | *beside him.",
    "n6": "No ban | ever came. | They shared the | Arthur Ashe | *Humanitarian Award. | And today, | Qureshi is *president | of the federation | that once | *threatened him.",
    "n7": "This story is proof | that a friendship | can be stronger | than *a border.",
}
WC = " &middot; WIKIMEDIA COMMONS"
Q = "AISAM-UL-HAQ QURESHI" + WC
PC = {"q_early_a.jpg": Q, "q_early_b.jpg": Q, "q_usopen2009.jpg": Q, "q_wim2013.jpg": Q, "q_wim2019.jpg": Q, "q_usopen2016.jpg": Q, "q_wim2017.jpg": Q, "wim_centre2005.jpg": "WIMBLEDON" + WC, "wim_court18.jpg": "WIMBLEDON" + WC,
      "wim_qualifying2016.jpg": "WIMBLEDON QUALIFYING" + WC, "net_grass2012.jpg": "WIKIMEDIA COMMONS", "lahore_minar_flags.jpg": "LAHORE, PAKISTAN" + WC, "lahore_badshahi.jpg": "LAHORE, PAKISTAN" + WC, "lahore_fort_flag.jpg": "LAHORE, PAKISTAN" + WC,
      "usopen_outer2009.jpg": "US OPEN, NEW YORK" + WC, "ashe_top.jpg": "ARTHUR ASHE STADIUM" + WC, "ramla_white_tower.jpg": "RAMLA, ISRAEL" + WC, "telaviv_skyline2018.jpg": "TEL AVIV" + WC, "ball_grass.jpg": "WIKIMEDIA COMMONS", "wim_outside2013.jpg": "WIMBLEDON" + WC}
PLAN = [
    ("h1", [(1, "P", "q_early_a.jpg", 50, "glow still arrow:790,730,2.15 title:this|MAN")]),
    ("h2", [(1, "P", "q_early_a.jpg", 50, "still z1.12 title:was_told_to|STOP|PLAYING")]),
    ("h3", [(1, "P", "g_shake.jpg", 50, "title:with_an|ISRAELI")]),
    ("h4", [(1, "P", "g_tunnel.jpg", 50, "title:he|REFUSED")]),
    ("h5", [(1, "P", "q_usopen2009.jpg", 50, "bigflash title:this_is_the_story_of|AISAM|QURESHI")]),
    ("n2", [(.3, "X2", "paper.jpg", 50, "map:LAHORE,74.34,31.55;RAMLA,34.87,31.93@20,90,8,48"), (.14, "P", "q_early_b.jpg", 50, "whip tag:PAKISTAN"), (.14, "P", "g_back.jpg", 50, "tag:ISRAEL"), (.14, "P", "g_rackets.jpg", 50, ""), (.14, "P", "wim_qualifying2016.jpg", 50, ""), (.14, "P", "wim_outside2013.jpg", 50, "")]),
    ("n3", [(.3, "P", "g_pair.jpg", 50, "whip"), (.3, "P", "wim_court18.jpg", 50, ""), (.4, "X2", "paper.jpg", 50, "count:#0f3d2e|they_reached_the_last|16|AT_WIMBLEDON")]),
    ("n4", [(.25, "P", "lahore_fort_flag.jpg", 50, "whip"), (.25, "P", "g_letter.jpg", 50, ""), (.25, "X2", "paper.jpg", 50, "card:#7a1010|he|MAY_FACE|A_BAN"), (.25, "P", "q_usopen2009.jpg", 50, "")]),
    ("n5", [(.25, "P", "usopen_outer2009.jpg", 50, "whip"), (.25, "P", "g_tunnel.jpg", 50, ""), (.25, "P", "ashe_top.jpg", 50, ""), (.25, "P", "g_pair.jpg", 50, "z1.3")]),
    ("n6", [(1, "X2", "paper.jpg", 50, "check:#efe8dc|What_happened_next|No_ban_ever_came|They_shared_a_humanitarian_award|He_now_leads_the_federation")]),
    ("n7", [(.5, "P", "net_grass2012.jpg", 50, "whip"), (.5, "P", "g_rackets.jpg", 50, "shim")]),
    ("end", [(1, "P", "wim_centre2005.jpg", 50, "")]),
]
GEN = {"back": "A tennis player in white clothes seen from behind standing on a grass court holding a racket, looking toward the net and an empty stand, early 2000s, face not visible",
       "shake": "Close-up of two tennis players' hands shaking firmly over a white-topped net on a grass court, white wristbands, no faces",
       "rackets": "Two tennis rackets lying crossed on a grass court with one yellow ball between them, white line, low sun, no people",
       "pair": "Two male tennis players, both men in white polo shirts and white shorts, seen from behind standing side by side at the baseline of a grass court, ready to receive serve, a full stand out of focus ahead, faces not visible",
       "letter": "An official typed letter with a round ink stamp lying on a wooden office desk beside a tennis ball and a pen, the text too blurred to read, no people",
       "tunnel": "A tennis player in a dark tracksuit seen from behind walking with a racket bag through a stadium tunnel toward a bright blue hard court, face not visible",
       "award": "Close-up of two different men's hands holding one glass trophy together in front of a dark curtain, suit sleeves, no faces"}

# V5: the illustrations in the Vox paper-collage look (style block from skills/toolbox/vox-ai-motion-graphics-generator/references/prompt-guide.md), made with Agnes.
GENSTYLE = "Mixed-media hand-cut paper collage, editorial zine style, vertical. Torn paper edges, scissor-cut borders, tape corners, halftone print dot patterns, paper drop shadows. Figures are printed-texture cut-outs from vintage photography. NOT 3D, NOT CGI. Palette: parchment cream, charcoal black, warm gold accent, one deep green. No text, no letters, no faces. Subject: "

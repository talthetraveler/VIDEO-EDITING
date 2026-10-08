# Hyun Jung-hwa (South Korea) and Ri Bun-hui (North Korea), the unified Korean team of 1991. V1. Narrator: ElevenLabs George.
# Archive: ITTF / World Table Tennis film "Peace. Passion. Pride. Unified Korea!" 2019 (youtube VK8rR-Z37dw) and JTBC "30&70" 2020 (SXaxBnn2g0E). Credited on screen, NOT cleared.
# Facts: DOSSIER.md (AP 2012, ESPN 2018, Hyun on camera). No quote is used: the Korean translation was not checked by a speaker.
J = "../src/SXaxBnn2g0E.mp4"
W_ = "../src/VK8rR-Z37dw.mp4"
VOICE = "JBFqnCBsd6RMkjVDRZzb"          # George
L = [  # hook: "Korea is still at war. You won't believe these 2 friends." (ig-reel hookscore 100.0)
     ("h1", "Korea is still at war."),
     ("h2", "You won't believe"),
     ("h3", "these two friends."),
     ("h4", "One from the North,"),
     ("h5", "one from the South."),
     ("n2", "In 1991, two rivals, Hyun Jung-hwa and Ri Bun-hui, were put on one Korean team. They lived and trained together for more than a month."),
     ("n3", "In Japan, their unified Korean team beat China, and became world champions."),
     ("n4", "Then they had to say goodbye. Hyun gave Ri a gold ring, so she would remember her."),
     ("n5", "They have never been allowed a real reunion. Twenty years later, Ri told a reporter she still keeps the ring."),
     ("n7", "This story is proof that a border cannot end a friendship.")]
CUTB = "crop=iw*0.75:ih*0.70:iw*0.125:0"          # removes the Korean caption at the bottom and the blurred side panels
CLIPS = {"hyun": (J, 3.3, 6.3), "ring": (J, 8.6, 12.8, 1.0, "crop=iw:ih*0.66:0:ih*0.04"), "bye1": (J, 53.4, 55.6, 1.0, CUTB), "bye2": (J, 56.0, 58.3, 1.0, CUTB),
         "duo": (J, 93.2, 95.6, 1.0, "crop=iw:ih*0.74:0:0"), "bed": (J, 108.4, 111.6, 1.0, "crop=iw:ih*0.72:0:0"), "react": (J, 36.0, 39.6, 1.0, "crop=iw:ih*0.80:0:0"),
         "hall": (W_, 86.2, 89.6), "serve": (W_, 89.7, 91.5), "rally": (W_, 91.6, 96.6), "rally2": (W_, 103.2, 107.0), "crowd": (W_, 108.1, 110.0)}
VID = {k: f"src/{k}.mp4" for k in CLIPS}
SEQ = [("h1", 0), ("h2", 0), ("h3", 0), ("h4", 0), ("h5", 0.3), ("n2", 0.25), ("n3", 0.25), ("n4", 0.25), ("n5", 0.25), ("n7", 0.4)]
END = ("RIVALS", "FRIENDS.")
TEXT = {
    "h1": "~Korea is still at war.", "h2": "~You won&rsquo;t believe", "h3": "~these two friends.", "h4": "~One from the North,", "h5": "~one from the South.",
    "n2": "In 1991, | two *rivals, | Hyun Jung-hwa | and Ri Bun-hui, | were put on | *one Korean team. | They lived | and trained *together | for more than a month.",
    "n3": "In Japan, | their unified | Korean team | beat *China, | and became | *world champions.",
    "n4": "Then they had to | say *goodbye. | Hyun gave Ri | a *gold ring, | so she would | *remember her.",
    "n5": "They have never | been allowed | a real *reunion. | Twenty years later, | Ri told a reporter | she still keeps | *the ring.",
    "n7": "This story is proof | that a border | cannot end | *a friendship.",
}
JT = "JTBC, 2020"
IT = "ITTF ARCHIVE &middot; CHIBA, 1991"
CREDIT = {"hyun": "HYUN JUNG-HWA &middot; " + JT, "ring": "AS SHOWN BY " + JT, "bye1": "1991 &middot; VIA " + JT, "bye2": "1991 &middot; VIA " + JT, "duo": "1991 &middot; VIA " + JT, "bed": "1991 &middot; VIA " + JT, "react": "HYUN JUNG-HWA &middot; " + JT,
          "hall": IT, "serve": IT, "rally": IT, "rally2": IT, "crowd": IT}
PC = {"pyongyang_skyline2019.jpg": "PYONGYANG &middot; WIKIMEDIA COMMONS", "seoul_night2018.jpg": "SEOUL &middot; WIKIMEDIA COMMONS", "flag_unification.jpg": "KOREAN UNIFICATION FLAG &middot; WIKIMEDIA COMMONS, CC BY-SA 3.0",
      "jsa_looking_north.jpg": "PANMUNJOM &middot; TRAVIS WISE, CC BY 2.0", "dmz_eulji_fence2.jpg": "THE DMZ &middot; WIKIMEDIA COMMONS, CC BY 2.0", "dmz_eulji_fence.jpg": "THE DMZ &middot; WIKIMEDIA COMMONS, CC BY 2.0",
      "imjingak_prayer.jpg": "IMJINGAK, SOUTH KOREA &middot; WIKIMEDIA COMMONS", "flag_stadium2005.jpg": "SEOUL, 2005 &middot; TIMOTHY FRIESEN, CC BY 2.0", "bridge_no_return.jpg": "BRIDGE OF NO RETURN &middot; WIKIMEDIA COMMONS, CC BY-SA 3.0"}
PLAN = [
    ("h1", [(1, "P", "jsa_looking_north.jpg", 50, "glow title:Korea_is|STILL|AT_WAR")]),
    ("h2", [(1, "P", "flag_unification.jpg", 50, "title:you_won&rsquo;t|BELIEVE")]),
    ("h3", [(1, "bed", 0.4, "band", "title:these_two|FRIENDS")]),
    ("h4", [(1, "P", "pyongyang_skyline2019.jpg", 50, "title:one_from|THE_NORTH")]),
    ("h5", [(1, "P", "seoul_night2018.jpg", 50, "bigflash title:one_from|THE_SOUTH")]),
    ("n2", [(.2, "duo", 0.0, "band", "whip"), (.2, "hall", 0.0, "band", ""), (.2, "rally", 0.2, "band", ""), (.2, "bed", 0.0, "band", ""), (.2, "serve", 0.0, "band", "")]),
    ("n3", [(.26, "rally", 1.8, "band", "whip"), (.24, "rally2", 0.0, "band", ""), (.22, "crowd", 0.0, "band", ""), (.28, "X2", "paper.jpg", 50, "card:#0b2a55|unified_Korea_became|WORLD|CHAMPIONS")]),
    ("n4", [(.24, "bye1", 0.0, "band", "whip"), (.24, "bye2", 0.0, "band", ""), (.22, "hyun", 0.0, "tall50", ""), (.30, "ring", 0.0, "band", "shim")]),
    ("n5", [(.2, "P", "jsa_looking_north.jpg", 50, "whip"), (.17, "P", "dmz_eulji_fence2.jpg", 50, ""), (.17, "P", "bridge_no_return.jpg", 50, ""), (.23, "react", 0.0, "tall50", ""), (.23, "ring", 1.6, "band", "z1.2")]),
    ("n7", [(.5, "P", "imjingak_prayer.jpg", 50, "whip"), (.5, "bed", 0.4, "band", "shim")]),
    ("end", [(1, "P", "flag_stadium2005.jpg", 50, "")]),
]

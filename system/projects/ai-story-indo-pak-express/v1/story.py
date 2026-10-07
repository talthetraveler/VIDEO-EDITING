# Rohan Bopanna and Aisam-ul-Haq Qureshi, the "Indo-Pak Express" V1. Narrator: ElevenLabs Sarah.
# Footage: IOC film for the International Day of Sport for Development and Peace 2016 (youtube vrSm_w0joSI) and the 2010 US Open trophy ceremony broadcast (fmE8TjObof8). Credited on screen, NOT cleared.
# Facts: DOSSIER.md (AP, Al Jazeera/AFP, Dawn, their own words). Photos: Wikimedia Commons, raw/CREDITS.json.
O = "../src/idsdp2016_olympic_vrSm_w0joSI.mp4"
C = "../src/usopen2010_ceremony_fmE8TjObof8.mp4"
VOICE = "EXAVITQu4vr4xnSDxMaL"          # Sarah
L = [("h1", "An Indian and a Pakistani"),          # V2 (Tal: "start it with the hook, this Indian and Pakistani players"; the story must flow in order)
     ("h2", "were supposed to be enemies."),
     ("h3", "Their countries have fought three wars."),
     ("h4", "But these two"),
     ("h5", "became best friends."),
     ("n3", "Rohan Bopanna is from India. Aisam Qureshi is from Pakistan. They met as teenagers, and became doubles partners."),
     ("n4", "In 2010, they reached the US Open final. In the stands, the ambassadors of India and Pakistan sat side by side."),
     ("n5", "After the match, Aisam took the microphone."),
     ("n6", "Their dream is one match at the border, with the gate as the net."),
     ("n8", "This story is proof that people are not their borders.")]
ON = {"b2": (O, [(46.20, 52.42)], (46.20, 52.45)),
      "b5": (C, [(240.72, 246.93)], (240.72, 246.98)),
      "b7": (O, [(206.93, 211.88)], (206.93, 211.92))}
CLIPS = {"bop": (O, 30.2, 32.4), "qur": (O, 132.6, 135.2), "walk": (O, 0.3, 3.6), "net": (O, 51.2, 56.0), "wag": (O, 162.2, 165.6),
         "shake": (O, 216.4, 220.9), "hug": (O, 221.5, 224.2, 1.0, "crop=iw:ih*0.74:0:0"), "serve": (O, 114.2, 116.6)}
VID = {k: f"src/{k}.mp4" for k in CLIPS}
SEQ = [("h1", .04), ("h2", .06), ("h3", .06), ("h4", .04), ("h5", .14), ("n3", .10), ("b2", .12), ("n4", .10), ("n5", .10), ("b5", .14), ("n6", .12), ("b7", .14), ("n8", .40)]
WHO = {"b2": "ROHAN BOPANNA", "b5": "AISAM-UL-HAQ QURESHI &middot; US OPEN FINAL, 2010", "b7": "ROHAN BOPANNA"}
END = ("ENEMIES", "PARTNERS.")
TEXT = {
    "h1": "~An Indian and a Pakistani", "h2": "~were supposed to be enemies.", "h3": "~Their countries have fought three wars.", "h4": "~But these two", "h5": "~became best friends.",
    "n3": "Rohan Bopanna | is from *India. | Aisam Qureshi | is from *Pakistan. | They met | as teenagers, | and became | *doubles partners.",
    "b2": "Everybody needs | to understand | that even though | our countries | are *at war, | it&rsquo;s not | *the people.",
    "n4": "~In 2010, | ~they reached | ~the US Open final. | In the stands, | the ambassadors | of India and Pakistan | sat *side by side.",
    "n5": "After the match, | Aisam took | the *microphone.",
    "b5": "We are very friendly, | loving | and caring people, | and we want *peace | in this world | as much as | *you guys want.",
    "n6": "Their dream | is one match | at *the border, | with the gate | as *the net.",
    "b7": "Aisam and me | have shown *the way, | the fact that | we can get along | *so well.",
    "n8": "This story is proof | that people | are not | *their borders.",
}
IOC = "IOC &middot; INTERNATIONAL DAY OF SPORT FOR DEVELOPMENT AND PEACE, 2016"
CREDIT = {"X": IOC}
CREDIT.update({k: IOC for k in CLIPS})
BITECREDIT = {"b5": "2010 US OPEN TROPHY CEREMONY &middot; BROADCAST"}
PC = {"wagah_cer3.jpg": "WAGAH BORDER &middot; GUILHEM VELLUT, CC BY 2.0", "flags.jpg": "TORE URNES, CC BY 2.0", "wagah_flagsdown.jpg": "WAGAH BORDER &middot; DANIEL HAUPTSTEIN, CC BY-SA 3.0",
      "b_usopen2010.jpg": "ROHAN BOPANNA, US OPEN 2010 &middot; WIKIMEDIA COMMONS, CC BY-SA", "q_usopen2010.jpg": "AISAM-UL-HAQ QURESHI, US OPEN 2010 &middot; WIKIMEDIA COMMONS, CC BY-SA",
      "ashe_2010_final_day.jpg": "ARTHUR ASHE STADIUM, 10 SEPT 2010 &middot; MANALAHMADKHAN, CC BY 2.0", "ashe_top.jpg": "ARTHUR ASHE STADIUM &middot; SLGCKGC, CC BY 2.0", "wagah_gate.jpg": "ATTARI-WAGAH &middot; TAMJEED AHMED, CC BY-SA 4.0", "wagah_cer4.jpg": "WAGAH BORDER &middot; GUILHEM VELLUT, CC BY 2.0"}
PLAN = [
    ("h1", [(1, "walk", 0.0, "band", "glow title:an|INDIAN_AND_A|PAKISTANI")]),
    ("h2", [(1, "P", "flags.jpg", 50, "title:supposed_to_be|ENEMIES")]),
    ("h3", [(1, "P", "wagah_cer3.jpg", 50, "title:their_countries_fought|THREE|WARS")]),
    ("h4", [(1, "shake", 0.0, "band", "title:but|THESE_TWO")]),
    ("h5", [(1, "hug", 0.0, "band", "bigflash title:became|BEST|FRIENDS")]),
    ("n3", [(.2, "bop", 0.1, "tall50", "whip tag:INDIA"), (.2, "qur", 0.1, "tall50", "tag:PAKISTAN"), (.2, "P", "b_usopen2010.jpg", 50, ""), (.2, "P", "q_usopen2010.jpg", 50, ""), (.2, "net", 0.0, "band", "")]),
    ("b2", [(-2.3, "V", "b_b2_0.mp4@0", "tall50", "whip"), (-2.0, "V", "b_b2_0.mp4@2.3", "tall50", "z1.2"), (1, "V", "b_b2_0.mp4@4.3", "band", "")]),
    ("n4", [(.3, "X2", "paper.jpg", 50, "card:#0f3d2e|in_2010_they_reached_the|US_OPEN|FINAL"), (.2, "P", "ashe_2010_final_day.jpg", 50, "whip"), (.2, "P", "wagah_flagsdown.jpg", 50, ""), (.3, "P", "ashe_top.jpg", 50, "")]),
    ("n5", [(.5, "net", 2.4, "band", "whip"), (.5, "P", "q_usopen2010.jpg", 50, "z1.3")]),
    ("b5", [(-2.0, "V", "b_b5_0.mp4@0", "tall55", "whip"), (-2.1, "V", "b_b5_0.mp4@2.0", "tall55", "z1.2"), (1, "V", "b_b5_0.mp4@4.1", "tall55", "")]),
    ("n6", [(.4, "wag", 0.0, "band", "whip"), (.3, "P", "wagah_gate.jpg", 50, ""), (.3, "P", "wagah_cer4.jpg", 50, "")]),
    ("b7", [(-2.4, "V", "b_b7_0.mp4@0", "tall50", "whip"), (1, "shake", 0.0, "band", "")]),
    ("n8", [(.45, "shake", 2.4, "band", "whip"), (.55, "hug", 0.0, "band", "shim")]),
    ("end", [(1, "P", "wagah_flagsdown.jpg", 50, "")]),
]

// Seeds the tracker's Shoot ideas board (db collection "ideas") from Tal's 2026-10-11 idea list.
// Writes one JSON file per idea to tracker/seed/ideas/ - they are sent with ArtifactData, not from here.
// stage: idea | outreach | soon | filmed | editing | dropped     out: "" | sent | noreply | replied
import fs from "node:fs";
import path from "node:path";
const out = path.resolve("system/projects/_metricool-upload/tracker/seed/ideas");
fs.mkdirSync(out, { recursive: true });

const Q = "Street questions", LA = "Stories: Los Angeles", IR = "Stories: Iran", IL = "Stories: Israel", GL = "Stories: Global",
  ORG = "Organisations: Israel", KI = "Kindness: Israel", KLA = "Kindness: Los Angeles";
// [group, title, stage, who, ok, out, contact, story, how, note, when, refNote]
const I = [
  [Q, "Tell me where you're from without telling me where you're from", "idea", "Tal", "", "", "", "Strangers describe home through food, a sound, a habit, anything but the name.", "Street, one question, quick answers back to back.", "", "", "Reference link needed"],
  [Q, "What's the hardest thing you've been through?", "idea", "Tal", "", "", "", "One deep question to a stranger, and you stay with the answer.", "Close on the face, let them finish, no cutaways.", "", "", "Dose of Society. Reference link needed"],
  [Q, "Who was your greatest love, and why did you fall in love with them?", "idea", "Tal", "", "", "", "\"My greatest love was...\" One stranger, one story.", "Portrait framing, one person per video.", "", "", "Hunter Prosper, Stories from a Stranger. Reference link needed"],
  [Q, "What makes you happy?", "filmed", "Tal", "yes", "", "", "Tal asks strangers the same simple question in Hebrew, Arabic and English.", "Same question, answers cut together.", "Filmed.", "", ""],
  [Q, "Tell me your good news, with Tal", "editing", "Tal", "yes", "", "", "Strangers share one piece of good news.", "Sign on the street, people walk up.", "In editing.", "", ""],
  [Q, "Tell me your good news, with Gabe", "editing", "Gabe", "yes", "", "", "Same format with Gabe.", "Sign on the street, people walk up.", "In editing.", "", ""],
  [Q, "Two gay Black women from Uganda: why they moved to Israel", "filmed", "Tal", "", "", "", "Tal asks a couple from Uganda why they chose Israel.", "Street conversation, POV.", "Filmed.", "", ""],
  [Q, "A Muslim woman and a Christian woman who are married", "filmed", "Tal", "", "", "", "A married couple from two faiths.", "Street conversation, POV.", "Filmed. Wording to confirm with Tal.", "", ""],

  [LA, "Michael Shahidi: the Coptic Christian who opposed Israel for 20 years", "soon", "Montana", "", "", "", "A Coptic Christian who was against Israel for 20 years.", "Montana films with him.", "Montana to message him. Spelling of his name to confirm.", "Mon 12 Oct", ""],
  [LA, "Tim Zaal + Matthew Boger: former neo-Nazi and the gay teen he left for dead", "outreach", "Montana", "yes", "sent", "@timothy_zaal · Museum of Tolerance", "Tim's skinhead group beat 14-year-old Matthew unconscious. 25 years later they met by chance at the Museum of Tolerance, and now speak together as Hate 2 Hope.", "Both on camera. Tie in Montana as the granddaughter of Holocaust survivors.", "", "", ""],
  [LA, "Adnan Jaber + Michal Greenfield: Palestinian and Jewish couple", "outreach", "Montana", "yes", "sent", "@michalgreenfield · likely @adnan_jaber · NewGround", "A Muslim Palestinian from Jerusalem and a Jewish-American artist met through Tech2Peace, married, and live in LA.", "Both shown and both talk, with a strong script.", "", "", ""],
  [LA, "Aqeela Sherrills + Calvin Hodges: a Crip and a Blood choosing peace", "outreach", "Montana", "yes", "sent", "@aqeelasherrills · Calvin through Aqeela", "Opposite sides of the Watts gang war. They met at the 1992 truce talks and chose peace.", "Only with both of them, plus photos or video from their past.", "Calvin's side comes from one source. Ask Aqeela to connect.", "", ""],
  [LA, "Frank Meeink: the neo-Nazi who became an observant Jew", "outreach", "Montana", "yes", "sent", "likely @fmeeink · LinkedIn · speakers bureau +1-800-698-2536", "A Philadelphia skinhead, one inspiration for American History X. A Jewish furniture dealer hired him anyway. A DNA test later showed Jewish ancestry.", "Montana's idea: a public table with a sign, \"I used to be a neo-Nazi. Ask me anything.\" Strangers sit down.", "Married Allison Mack in 2025, expect tabloid attention.", "", ""],
  [LA, "Dr. Yehudah Pryce: 16 years in prison to Orthodox Jew with a doctorate", "outreach", "", "yes", "sent", "@yehudahpryce", "After 16 years in prison he converted, earned a doctorate and helps others rebuild.", "NAS Daily style story.", "", "", ""],
  [LA, "Aziza Hasan + Andrea Hodos: Muslim-Jewish friendship", "idea", "", "maybe", "", "info@muslimjewishnewground.org", "A friendship built on staying in conversation through painful disagreement.", "Both together.", "", "", ""],
  [LA, "Fabian Debora: former gang member turned artist and mentor", "idea", "", "maybe", "", "fabianspadedebora@gmail.com", "Addiction and prison, then art, and mentoring young people.", "Film him making art with a young person he mentors.", "", "", ""],
  [LA, "Dr. Kwane Stewart: the street vet", "outreach", "Montana", "yes", "sent", "Project Street Vet, website media team", "A vet who treats the pets of people living on the street.", "Montana joins a real outreach visit and helps a homeless person's dog.", "Emailed.", "", ""],
  [LA, "Juan Naula: Clean LA With Me", "outreach", "", "yes", "sent", "support@cleanlawithme.org · his Linktree", "One man with a trash bag who got a whole community cleaning with him.", "Join an upcoming cleanup.", "", "", ""],

  [IR, "Liraz Charhi: the Israeli singer who made albums with musicians inside Iran", "outreach", "Montana", "yes", "sent", "@liraz_naz · management", "Daughter of Iranian Jews. Four Persian albums recorded in secret with musicians in Iran. Also acts in Tehran.", "Her first. Then ask Noor Pahlavi about a collab.", "In DMs. Never show or name her collaborators inside Iran.", "", ""],

  [IL, "Aziz Abu Sarah + Maoz Inon: both lost family to the conflict", "outreach", "", "yes", "sent", "@azizabusarah · @maozinon", "Aziz lost his brother, Maoz lost both parents on October 7. Aziz reached out three days later. They wrote The Future Is Peace together.", "Both together.", "Already in contact, no new message needed. Not in Israel right now.", "", ""],
  [IL, "Mira Awad + Noa: Arab and Jewish singers who kept singing together", "outreach", "", "yes", "sent", "@miraawadofficial · @noa_nini · miraawad.co/contact", "They sang \"There Must Be Another Way\" for Israel at Eurovision 2009 and never stopped.", "Both together, ideally singing.", "", "", ""],
  [IL, "Younes Alkarnawi + the Nova survivors: \"there are no Jews here\"", "outreach", "", "yes", "sent", "@shalevb10 (WhatsApp) · Younes through Shalev", "A Bedouin farmer hid eight Jewish Israelis and 24 Thai workers, and told Hamas gunmen for seven minutes that no Jews were there.", "Angle: Righteous Among the Nations. Standing up for people.", "A Younes video is already posted (153K). His name is spelled several ways.", "", ""],
  [IL, "Tachlowini Gabriyesos: refugee Olympic marathon runner", "idea", "Tal", "yes", "", "@tachlowini_g_official", "Fled Eritrea at 12, reached Israel, ran for the Refugee Olympic Team.", "Interview plus a training shoot.", "", "", ""],
  [IL, "Nissim Black: Seattle rapper to Orthodox Jew in Israel", "idea", "Montana", "yes", "", "Montana's contact first · agent@nissimblack.com · @nissimofficial", "From D. Black to Orthodox Judaism and a new life in Israel.", "", "", "", ""],
  [IL, "Mulugeta Tsegay: Eritrean bakery worker who saved an Israeli officer", "idea", "", "maybe", "", "editor@jns.org, ask for reporter Etgar Lefkovits", "He stayed during the October 7 attacks to save a badly wounded officer. They are still friends.", "Both together.", "", "", ""],
  [IL, "Ashriel Moore: Village of Peace, Dimona", "idea", "Montana", "yes", "", "Montana's contact first · info@villageofpeacedimona.com · @villageofpeacedimona", "The African Hebrew Israelite community, through Ashriel and one family.", "A day in the village.", "", "", ""],
  [IL, "Shalva, and Yossi + Haya's marathon", "idea", "Montana", "yes", "", "Montana's Shalva contact first · info@shalva.org · +972-2-651-9555 · @yossi__hamani", "A father pushes his daughter across marathon finish lines in a running chair.", "Definitely do Shalva. The Yossi and Haya story is a maybe.", "", "", ""],
  [IL, "Avi Gold: Orthodox Jew travelling Muslim countries", "idea", "", "maybe", "", "@avigold100", "Unexpected hospitality and friendship across Muslim-majority countries.", "One specific friendship, not a summary.", "", "", ""],
  [IL, "Fabian Maamari Hay + Avi: Lebanese-Israeli love story", "outreach", "", "yes", "sent", "@fabian_maamari", "A Lebanese-born man and his Israeli partner: food, language, family, how they met.", "Ordinary details, both on camera.", "Fabian's first video did 406K and was the most shared.", "", ""],

  [GL, "Daryl Davis: the Black musician with a closet of KKK robes", "outreach", "", "yes", "sent", "@realdaryldavis · his website", "He sat down with Klan members and asked how they could hate him without knowing him. Many left and gave him their robes.", "", "", "", ""],
  [GL, "Suresh Kothari + A.G. Shakir: best friends split by Partition", "dropped", "", "yes", "sent", "granddaughter, likely @megankothari", "An Indian and a Pakistani boy separated in 1947 who found each other again in America.", "", "Passed away.", "", ""],
  [GL, "Randall Odell + his wife's grandmother: \"I was very, very wrong\"", "outreach", "", "yes", "sent", "@615coach", "A 90-year-old white grandmother told him on camera she had been wrong to disapprove. 15M+ views.", "", "", "", ""],
  [GL, "Arno Michaelis + Pardeep Singh Kaleka", "outreach", "", "yes", "sent", "@arnomichaelis", "A former white supremacist and a Sikh man whose father was murdered in the Wisconsin temple shooting became friends.", "Both together.", "Emailed.", "", ""],
  [GL, "Aisam-ul-Haq Qureshi + Amir Hadad: Pakistani and Israeli doubles partners", "outreach", "", "yes", "sent", "@aisamqureshi", "A Pakistani Muslim and an Israeli Jew played Wimbledon and the US Open together.", "A reunion on a tennis court.", "", "", ""],
  [GL, "Nasir Dhillon + Bhupinder Singh Lovely: reuniting Partition families", "outreach", "", "yes", "sent", "@nasirdhillon6", "Creators who reunite families split between India and Pakistan.", "Follow a new reunion from start to finish.", "", "", ""],
  [GL, "Sheryl Olitzky + Atiya Aftab: Sisterhood of Salaam Shalom", "idea", "", "maybe", "", "Sisterhood of Salaam Shalom contact page", "A Jewish and a Muslim woman whose friendship became a wider sisterhood.", "Both together.", "", "", ""],
  [GL, "Susan Retik + Patti Quigley: 9/11 widows helping Afghan widows", "idea", "", "yes", "", "Beyond the 11th +1-781-248-5051", "Two women who lost their husbands on September 11 answered by helping widows in Afghanistan.", "", "Also research individual Afghan women's stories as their own pipeline.", "", ""],
  [GL, "Said Bensellam + Rabbi Lody van de Kamp", "idea", "", "maybe", "", "info@saidenlody.nl · +31-6-2907-0387", "A Muslim former kickboxer and a rabbi who fight discrimination together.", "", "", "", ""],
  [GL, "Naima Ali Farah + Feisal Abdi Sugal + their Jewish friends", "idea", "", "maybe", "", "info@refugeesponsorship.org.au", "Somali refugees resettled in Melbourne, welcomed by Jewish volunteers who became like family.", "", "", "", ""],

  [ORG, "Neve Shalom / Wahat al-Salam: the Oasis of Peace village", "outreach", "Tal", "yes", "sent", "info@wasns.info · @was_ns", "A village built so Jewish and Palestinian-Arab Israeli families could live together as equals.", "", "Potential.", "", ""],
  [ORG, "Hand in Hand: bilingual schools", "outreach", "", "yes", "sent", "info@handinhandk12.org · 02-673-5356 · adelia@handinhand.org.il · @handinhandschools", "Jewish and Arab children learn together in Hebrew and Arabic.", "", "Called and emailed.", "", ""],
  [ORG, "Jerusalem Youth Chorus", "idea", "", "yes", "", "info@jerusalemyouthchorus.org", "Palestinian and Israeli teenagers from East and West Jerusalem sing together.", "Ask for a filmed social collaboration.", "", "", ""],
  [ORG, "United Hatzalah", "idea", "", "yes", "", "Media team via press page · +972-2-500-2020", "Jewish, Muslim and Christian volunteer EMTs race to whoever calls.", "", "Only if they pay.", "", ""],
  [ORG, "Yad Ezra V'Shulamit / Aryeh Lurie", "soon", "", "yes", "replied", "feedisrael@yadezra.net · +972-2-585-6002, ask for Aryeh Lurie", "Aryeh grew up hungry and now feeds struggling families.", "", "Filming Thursday.", "Thursday", ""],

  [KI, "100 Flowers, Given Together", "idea", "Montana", "yes", "", "Local florist + an Arabic-speaking creator", "Montana and an Arabic-speaking creator give 100 flowers across communities.", "End by asking people to pass it on.", "Giving Flowers to Strangers already did 230K.", "", ""],
  [KI, "Free Hugs in Hebrew, Arabic and English", "editing", "Tal", "yes", "", "", "A Free Hugs sign in three languages.", "Sign on the street.", "Tal's version is in editing.", "", ""],
  [KI, "Call Someone You Love", "editing", "Tal", "yes", "", "", "Strangers call someone they love and say what they've been meaning to say.", "Phone table on the street.", "Tal's version is in editing.", "", ""],
  [KI, "Sit down if you're sad", "editing", "Tal", "", "", "", "Tal with Yoav Beatbox.", "Sit-down sign.", "Filmed 10 October. In editing.", "", ""],
  [KI, "100 shekels: you cannot spend it on yourself", "idea", "", "yes", "", "", "A stranger gets 100 shekels and must use it for someone else.", "Follow what they do with it.", "", "", ""],
  [KI, "A Jew and a Muslim support each other's businesses", "idea", "", "maybe", "", "One Jewish-owned and one Arab-owned shop", "Each takes the other to a favourite business in their community.", "", "", "", ""],
  [KI, "Kids choose the kindness", "idea", "", "yes", "", "Families from the creator network", "A child gets a flower or gift and decides who deserves it.", "Parent involved from the start.", "", "", ""],
  [KI, "Free toy shop for hospitalised children", "idea", "", "yes", "", "sach@saveachildsheart.org · +972-3-558-9656", "A free toy shop in or near a hospital.", "", "A hospital toys video is already in the trial queue.", "", ""],
  [KI, "Buy lunch for the people keeping the city moving", "idea", "", "yes", "", "", "Lunch for cleaners, drivers, builders, guards.", "", "", "", ""],
  [KI, "Shalom / Salam swap", "idea", "", "maybe", "", "Arabic-speaking creator", "A Hebrew speaker and an Arabic speaker greet strangers with each other's greeting.", "", "", "", ""],
  [KI, "Teach me one word", "idea", "", "maybe", "", "", "Hebrew and Arabic speakers teach each other one word about friendship or home.", "", "", "", ""],
  [KI, "Phone to the Middle East: a message and a reply", "idea", "", "yes", "", "Ronny Edry, Peacefactory2012@gmail.com", "People in Israel record messages for people across the region, and creators there film the replies.", "", "", "", ""],

  [KLA, "100 Flowers Across LA", "idea", "Montana", "yes", "", "LA florist", "100 flowers across LA neighbourhoods.", "", "", "", ""],
  [KLA, "Muslim + Jewish Free Hugs", "idea", "", "yes", "", "Two creators · NewGround can introduce", "A Muslim and a Jewish creator offer free hugs together.", "", "", "", ""],
  [KLA, "Dance With Me If You Need a Smile", "idea", "Montana", "yes", "", "", "A sign inviting anyone who needs a smile to dance.", "Sign on the street.", "", "", ""],
  [KLA, "Teach Montana Your Culture's Dance", "editing", "Montana", "yes", "", "", "Strangers teach Montana a move from their culture.", "", "Filmed in LA. In editing.", "", ""],
  [KLA, "Buy out a street vendor, then give the food away together", "idea", "Montana", "yes", "", "Scout one vendor first", "Buy everything, then the vendor helps hand it out.", "", "", "", ""],
  [KLA, "Call Someone You Love, LA", "idea", "Montana", "yes", "", "", "The phone table in LA.", "Phone table on the street.", "", "", ""],
];
const ids = [];
I.forEach((r, k) => {
  const [group, title, stage, who, ok, o, contact, story, how, note, when, refNote] = r;
  const id = "n" + String(k + 1).padStart(2, "0");
  fs.writeFileSync(path.join(out, id + ".json"), JSON.stringify({ at: 100 + k, group, title, stage, who, ok, out: o, contact, story, how, note, when, ref: "", refNote }, null, 1));
  ids.push(id);
});
const w = ids.map(id => ({ op: "set", collection: "ideas", doc_id: id, file_path: path.join(out, id + ".json") }));
fs.writeFileSync(path.join(out, "_batch1.json"), JSON.stringify(w.slice(0, 50)));
fs.writeFileSync(path.join(out, "_batch2.json"), JSON.stringify(w.slice(50)));
console.log(ids.length, "ideas");

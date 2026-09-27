export const meta = {
  name: 'footage-intelligence',
  description: 'Deep per-clip analysis of a prepped footage drop — one Claude-vision agent per clip reads the contact sheet + speech + face tags into a structured record, then junks all records into one intelligence doc.',
  phases: [
    { title: 'Analyze', detail: 'one vision agent per clip → structured record' },
    { title: 'Assemble', detail: 'junk records into FOOTAGE-INTELLIGENCE-<drop>.md' },
  ],
}

// args: { manifest, workDir, recordsOut, docOut, drop, source, date, scope }
// manifest = path to Phase-2 manifest.json ; one analysis agent per clip record.

const A = args || {}

// may15 drop clip stems (114) — baked in because args/agent-mediated loading proved
// unreliable in this runtime. For a NEW drop, replace this list (or pass args.clipNames).
const MAY15 = ["IMG_3809","IMG_3810","IMG_3811","IMG_3814","IMG_3815","IMG_3816","IMG_3817","IMG_3818","IMG_3819","IMG_3820","IMG_3821","IMG_3822","IMG_3823","IMG_3824","IMG_3828","IMG_3829","IMG_3830","IMG_3832","IMG_3833","IMG_3834","IMG_3836","IMG_3837","IMG_3838","IMG_3841","IMG_3842","IMG_3845","IMG_3847","IMG_3848","IMG_3849","IMG_3850","IMG_3851","IMG_3852","IMG_3855","IMG_3861","IMG_3862","IMG_3864","IMG_3865","IMG_3866","IMG_3867","IMG_3868","IMG_3869","IMG_3873","IMG_3875","IMG_3876","IMG_3877","IMG_3878","IMG_3880","IMG_3881","IMG_3883","IMG_3884","IMG_3885","IMG_3886","IMG_3887","IMG_3888","IMG_3889","IMG_3890","IMG_3891","IMG_3893","IMG_3894","IMG_3899","IMG_3900","IMG_3901","IMG_3907","IMG_3908","IMG_3912","IMG_3913","IMG_3914","IMG_3915","IMG_3916","IMG_3917","IMG_3918","IMG_3919","IMG_3921","IMG_3922","IMG_3923","IMG_3925","IMG_3926","IMG_3932","IMG_3933","IMG_3934","IMG_3935","IMG_3938","IMG_3940","IMG_3941","IMG_3943","IMG_3945","IMG_3946","IMG_3948","IMG_3949","IMG_3950","IMG_3952","IMG_3953","IMG_3954","IMG_3958","IMG_3960","IMG_3961","IMG_3962","IMG_3963","IMG_3964","IMG_3965","IMG_3966","IMG_3967","IMG_3968","IMG_3970","IMG_3971","IMG_3976","IMG_3977","IMG_3981","IMG_3983","IMG_3984","IMG_3985","IMG_3986","IMG_3987","IMG_3989"]

const RECORD_SCHEMA = {
  type: 'object',
  required: ['clip', 'scene', 'action', 'is_broll', 'broll_quality', 'orientation'],
  properties: {
    clip: { type: 'string' },
    people: { type: 'array', items: { type: 'string' } },
    scene: { type: 'string', description: 'one-line setting + composition' },
    action: { type: 'string', description: 'what is physically happening' },
    setting: { type: 'string' },
    is_broll: { type: 'boolean', description: 'usable as cutaway b-roll over a reel?' },
    broll_quality: { type: 'integer', minimum: 0, maximum: 10 },
    broll_tags: { type: 'array', items: { type: 'string' } },
    subject_isolation: { type: 'string', description: 'is the named person alone or with others' },
    orientation: { type: 'string', enum: ['portrait', 'landscape'] },
    has_speech: { type: 'boolean' },
    speakers: { type: 'integer' },
    quotable: {
      type: 'array',
      items: {
        type: 'object',
        properties: { speaker: { type: 'string' }, text: { type: 'string' },
          t: { type: 'array', items: { type: 'number' } } },
      },
    },
    notes: { type: 'string' },
  },
}

phase('Analyze')

// Defaults baked in so the run works even if args don't propagate in this runtime.
const WD = A.workDir || 'your project'
const FACES = A.facesCatalog || `${WD}/faces-catalog.json`
const RECORDS_OUT = A.recordsOut || `${WD}/records.json`
const DOC_OUT = A.docOut || 'your project'
const SCRIPT_DIR = A.scriptDir || 'your project'
const DROP = A.drop || 'may15'
const SOURCE = A.source || 'a client may15 (cache: your project)'
const DATE = A.date || '2026-05-30'

const clips = (Array.isArray(A.clipNames) && A.clipNames.length) ? A.clipNames : MAY15
log(`Footage intelligence: ${clips.length} clips — one vision agent each`)

const records = await parallel(clips.map((clip) => () =>
  agent(
    [
      `You are analyzing ONE footage clip for a content-intelligence catalog. Be precise and honest.`,
      ``,
      `Clip: ${clip}`,
      `Face match: read ${FACES} and find the "${clip}" entry — its people[] + scores + is_interview.`,
      `  (InsightFace, may be imperfect. NOTE: a person tagged "Speaker D" in this drop is actually the female`,
      `   COACH, not a player — if you see a coach in team kit, label people as ["Coach"].)`,
      ``,
      `1. View the contact sheet image at: ${WD}/${clip}.sheet.jpg`,
      `   (6 timestamped frames, left→right, top→bottom). Use the Read tool on that exact path to SEE it.`,
      `2. Read the speech JSON at: ${WD}/${clip}.speech.json (has_speech, speakers, utterances).`,
      ``,
      `Then return a structured record:`,
      `- people: confirm/correct the face list using what you SEE. If the sheet clearly contradicts the face match, trust your eyes and say so in notes.`,
      `- scene / action / setting: what is happening (e.g. "1-on-1 cone drill, golden hour, turf field" / "dribbling through cones, change of pace").`,
      `- is_broll + broll_quality (0-10): is this usable as a cutaway over a reel? Rate sharpness, framing, action interest. Interviews and shaky/empty clips score low as b-roll.`,
      `- broll_tags: short tags (ball-control, footwork, scrimmage, juggling, celebration, etc).`,
      `- subject_isolation: is the named person ALONE in frame, or with others? (Critical — only solo clips are safe "that person's b-roll".)`,
      `- orientation: portrait if the footage is taller than wide, else landscape (judge from the frames).`,
      `- has_speech / speakers: from the speech JSON.`,
      `- quotable: if there are utterances, pick the 1-3 most usable complete-sentence lines (speaker, text, t=[start,end]). Empty if none.`,
      `- notes: anything a builder needs (reframe-friendliness, who else is in frame, quality caveats).`,
      ``,
      `FINALLY: write your record as JSON to ${WD}/rec/${clip}.json (use the Write tool — create the rec/ dir if needed; the file is just this one record object), THEN return the same record as structured output.`,
    ].join('\n'),
    { label: `clip:${clip}`, phase: 'Analyze', schema: RECORD_SCHEMA }
  ).then((r) => r ? { ...r, clip: clip } : null)
))

const good = records.filter(Boolean)
log(`${good.length}/${clips.length} clips analyzed`)

phase('Assemble')
// Deterministic: each analysis agent already wrote WD/rec/<clip>.json. Merge that dir into
// one array, then run assemble_doc.py. The agent only runs bash (reliable) — no giant payload.
const summary = await agent(
  [
    `Run these bash commands in order and report the result.`,
    ``,
    `1. Merge the per-clip records into one array:`,
    `   python -c "import json,glob,os; recs=[json.load(open(f)) for f in glob.glob(r'${WD}/rec/*.json')]; json.dump(recs, open(r'${RECORDS_OUT}','w'), indent=1); print(len(recs),'records merged')"`,
    ``,
    `2. Junk them into the intelligence document:`,
    `   python "${SCRIPT_DIR}/assemble_doc.py" "${RECORDS_OUT}" "${DOC_OUT}" --drop "${DROP}" --source "${SOURCE}" --date "${DATE}"`,
    ``,
    `3. Read ${DOC_OUT} and return a 5-7 line summary: total clips analyzed, usable b-roll count, per-person CLEAN SOLO b-roll counts (call out anyone with zero), how many clips had quotable speech, and any honest gaps. Note that "Speaker D" in the face catalog is actually the coach.`,
  ].join('\n'),
  { label: 'assemble-doc', phase: 'Assemble',
    schema: { type: 'object', required: ['summary', 'records_merged'],
      properties: { summary: { type: 'string' }, records_merged: { type: 'integer' },
        people_without_broll: { type: 'array', items: { type: 'string' } } } } }
)

return { doc: DOC_OUT, records: RECORDS_OUT, analyzed: good.length, summary }

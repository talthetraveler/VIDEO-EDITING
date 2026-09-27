# Half-second RMS of a mono 16k wav, in dBFS, comma separated.
#
# Used by scripts/qa-look.mjs to find the two audio failures that shipped:
# level slams at the cuts (adjacent windows 25-30 dB apart) and a ridden-up
# noise floor (the quietest window still at -25 dBFS, i.e. no silence left).
import sys, wave, array, math

w = wave.open(sys.argv[1])
a = array.array("h")
a.frombytes(w.readframes(w.getnframes()))
sr = w.getframerate()
win = int(sr * 0.5)
out = []
for i in range(0, max(0, len(a) - win), win):
    s = a[i:i + win]
    m = sum(x * x for x in s) / len(s)
    out.append(20 * math.log10(math.sqrt(m) / 32768 + 1e-9))
print(",".join(f"{v:.1f}" for v in out))

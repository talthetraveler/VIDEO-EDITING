"""Read a raw Insta360 .insv: factory calibration, gyro, frame clock, and stitching.

The file format, the lens pose and the orientation filter are ported from
bubo-squared/GyroView (MIT), docs/FORMAT.md and docs/adr 0008, 0009, 0025.
That project had no X4 file; the X4 facts here were measured on Tal's Mauritania
clips (see skills/tal-video-editor/REPOS.md).

Directions use GyroView's body frame: x right, y down, z along lens 0.
"""
import math
import struct
import subprocess

import numpy as np

MAGIC = b"8db42d694ccc418790edff439fe026bf"
LEGACY_RADIUS_DEG = 96.0
FEATHER_DEG = 3.0

# Measured on one X4 (serial IBMLA2404D8YM5), clip VID_20250316_075047_00_296:
# window side = the canvas square the frames show, by seam correlation (peak 0.63 at 5890,
# 0.05 at the canvas height of 6000). IMU axes = the 24-way world-stillness ranking
# (11.93 against 14.4 unstabilised, runner-up 14.73). The X5's x, z, -y scored worse.
CAMERAS = {
    "Insta360 X4": {"side": 5890, "axes": ("x", "-z", "y")},
}


def proto_fields(buf):
    """field number -> list of values; bytes for length-delimited, int or raw for the rest."""
    out, i = {}, 0

    def varint():
        nonlocal i
        shift = val = 0
        while True:
            b = buf[i]
            i += 1
            val |= (b & 0x7F) << shift
            if not b & 0x80:
                return val
            shift += 7

    while i < len(buf):
        key = varint()
        num, wire = key >> 3, key & 7
        if wire == 0:
            val = varint()
        elif wire == 1:
            val = buf[i:i + 8]
            i += 8
        elif wire == 2:
            n = varint()
            val = buf[i:i + n]
            i += n
        elif wire == 5:
            val = buf[i:i + 4]
            i += 4
        else:
            raise ValueError(f"protobuf wire type {wire} at {i}")
        out.setdefault(num, []).append(val)
    return out


def rot_x(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]], float)


def rot_y(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]], float)


def rot_z(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]], float)


def axes_matrix(body_axes):
    """IMU vector -> body vector, each body axis named as a signed IMU axis."""
    unit = {"x": (1, 0, 0), "y": (0, 1, 0), "z": (0, 0, 1)}
    rows = [[-c for c in unit[a[1]]] if a[0] == "-" else list(unit[a]) for a in body_axes]
    return np.array(rows, float)


def quat_between(a, b):
    """Quaternion (w, x, y, z) turning unit vector a onto unit vector b."""
    v = np.cross(a, b)
    w = 1 + float(np.dot(a, b))
    q = np.array([w, *v])
    return q / np.linalg.norm(q)


def quat_matrix(q):
    """Rotation matrices of quaternions (..., 4)."""
    w, x, y, z = q[..., 0], q[..., 1], q[..., 2], q[..., 3]
    return np.stack([
        1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y),
        2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x),
        2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y),
    ], -1).reshape(q.shape[:-1] + (3, 3))


class Lens:
    """Equidistant lens from the legacy `offset` string, which Insta360's stitch agrees with."""

    def __init__(self, index, r, cx, cy, yaw, pitch, roll, canvas_w, frame_size, window):
        self.index = index
        win_x, win_y, win_size = window
        scale = frame_size / win_size
        self.f = r * scale / math.radians(LEGACY_RADIUS_DEG)
        self.cx = (cx - index * canvas_w - win_x) * scale
        self.cy = (cy - win_y) * scale
        mounting = round(roll / 90.0) * 90.0
        mirrored = 2 * mounting - roll
        self.R = (rot_z(math.radians(mirrored)) @ rot_x(math.radians(180.0 * index))
                  @ rot_x(math.radians(pitch)) @ rot_y(math.radians(yaw)))

    def project(self, dirs):
        """Body directions (..., 3) -> pixel x, pixel y, angle from the optical axis."""
        d = dirs @ self.R.T
        lateral = np.sqrt(d[..., 0] ** 2 + d[..., 1] ** 2)
        theta = np.arctan2(lateral, d[..., 2])
        k = np.where(lateral > 1e-9, self.f * theta / np.maximum(lateral, 1e-9), 0.0)
        return (self.cx + k * d[..., 0]).astype(np.float32), (self.cy + k * d[..., 1]).astype(np.float32), theta


class Insv:
    def __init__(self, path):
        self.path = str(path)
        with open(self.path, "rb") as f:
            f.seek(0, 2)
            size = f.tell()
            f.seek(size - 40)
            tail = f.read(40)
            if tail[8:40] != MAGIC:
                raise ValueError("no Insta360 trailer")
            trailer = struct.unpack("<I", tail[:4])[0]
            f.seek(size - trailer)
            t = f.read(trailer)
        self.records = self._records(t)
        info = proto_fields(self.records[1])
        self.serial = info[1][0].decode()
        self.model = info[2][0].decode()
        self.firmware = info[3][0].decode()
        self.offset = info[5][0].decode()
        self.first_frame_ts = info[24][0] if 24 in info else None
        self.gyro_offset_ms = struct.unpack("<d", info[28][0])[0] if 28 in info else 0.0
        self.rolling_ms = struct.unpack("<d", info[25][0])[0] if 25 in info else 0.0
        self.raw_gyro = bool(info.get(62, [0])[0])
        cfg = proto_fields(info[65][0]) if 65 in info else {}
        self.acc_range = cfg.get(1, [16])[0]
        self.gyro_range = cfg.get(2, [2000])[0]
        crop = proto_fields(info[27][0]) if 27 in info else {}
        self.window_crop = {k: v[0] for k, v in crop.items()}
        self.info = info
        self.width, self.height, self.fps, self.nframes, self.duration = self._probe()
        self.lenses = self._lenses()

    @staticmethod
    def _records(t):
        """Index layout: record 0 holds slots of (id, format, size, offset); else walk backwards."""
        pos = len(t) - 72
        fmt, rid, n = struct.unpack("<BBI", t[pos - 6:pos])
        recs = {}
        if rid == 0 and n % 10 == 0:
            idx = t[pos - 6 - n:pos - 6]
            for k in range(0, n, 10):
                sid, sfmt, ssize, soff = struct.unpack("<BBII", idx[k:k + 10])
                if ssize:
                    recs[sid] = t[soff:soff + ssize]
            return recs
        while pos > 6:
            fmt, rid, n = struct.unpack("<BBI", t[pos - 6:pos])
            if n == 0 or n > pos - 6:
                break
            recs[rid] = t[pos - 6 - n:pos - 6]
            pos -= 6 + n
        return recs

    def _probe(self):
        out = subprocess.check_output([
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height,r_frame_rate,nb_frames:format=duration",
            "-of", "csv=p=0", self.path], text=True).split()
        w, h, rate, nb = out[0].rstrip(",").split(",")[:4]
        a, b = rate.split("/")
        return int(w), int(h), int(a) / int(b), int(nb), float(out[1])

    def _lenses(self, side=None):
        tok = [float(x) for x in self.offset.split("_")]
        n = int(tok[0])
        canvas_w, canvas_h = tok[1 + 6 * n], tok[2 + 6 * n]
        per_w = canvas_w / n
        # the frames are the middle square of a 4:3 canvas
        side = side or CAMERAS.get(self.model, {}).get("side", canvas_h)
        window = ((per_w - side) / 2, (canvas_h - side) / 2, side)
        lenses = []
        for i in range(n):
            b = tok[1 + 6 * i:7 + 6 * i]
            lenses.append(Lens(i, b[0], b[1], b[2], b[3], b[4], b[5], per_w, self.width, window))
        return lenses

    def gyro(self):
        """(t_seconds_on_capture_clock, accel_g[n,3], gyro_rad_s[n,3]) in the IMU's axes."""
        r = self.records[3]
        if self.raw_gyro:
            a = np.frombuffer(r, dtype=np.dtype([("t", "<u8"), ("a", "<u2", 3), ("g", "<u2", 3)]))
            acc = (a["a"].astype(float) - 32768) * self.acc_range / 32768
            rate = np.radians((a["g"].astype(float) - 32768) * self.gyro_range / 32768)
            return a["t"].astype(float) / 1e6, acc, rate
        a = np.frombuffer(r, dtype=np.dtype([("t", "<u8"), ("a", "<f8", 3), ("g", "<f8", 3)]))
        return a["t"].astype(float) / 1e3, a["a"].copy(), a["g"].copy()

    def frame_times(self):
        """Video time of each frame's middle row, on the gyro's clock (seconds from frame 0)."""
        e = np.frombuffer(self.records[4], dtype=np.dtype([("t", "<u8"), ("x", "<f8")]))
        first = int(np.searchsorted(e["t"], self.first_frame_ts))
        ts = e["t"][first:first + self.nframes].astype(float)
        return (ts - self.first_frame_ts) / 1e6

    def orientation(self, body_axes=None, gain=0.2):
        """(video times, rotation body->world per sample). World: y down, heading of the first
        half second. Mahony filter as GyroView's OrientationTrack: gyro rules, gravity pulls."""
        body_axes = body_axes or CAMERAS[self.model]["axes"]
        t, acc, rate = self.gyro()
        t = (t * 1e6 - self.first_frame_ts) / 1e6 + self.gyro_offset_ms / 1e3
        F = axes_matrix(body_axes)
        acc = acc @ F.T
        rate = rate @ F.T
        mag = np.linalg.norm(acc, axis=1)
        rest = (mag > 0.9) & (mag < 1.1)

        # bias from the stillest half second, only if the camera really rested
        n = max(1, int(0.5 / np.median(np.diff(t))))
        speed = np.convolve(np.linalg.norm(rate, axis=1), np.ones(n) / n, "valid")
        i = int(np.argmin(speed))
        bias = rate[i:i + n].mean(0) if speed[i] < math.radians(1) else np.zeros(3)

        g0 = -acc[:n][rest[:n]].mean(0)
        g0 /= np.linalg.norm(g0)
        q = quat_between(g0, np.array([0.0, 1.0, 0.0]))
        out = np.zeros((len(t), 4))
        w, x, y, z = q
        prev = t[0]
        step_rate = (0.0, 0.0, 0.0)
        ax, ay, az = (-acc / np.maximum(mag[:, None], 1e-6)).T
        rx, ry, rz = (rate - bias).T
        for k in range(len(t)):
            dt = min(max(t[k] - prev, 0.0), 0.05)
            prev = t[k]
            ox, oy, oz = step_rate
            if rest[k]:
                # estimated down in the body: third of R's second row
                vx = 2 * (x * y + w * z)
                vy = 1 - 2 * (x * x + z * z)
                vz = 2 * (y * z - w * x)
                ox += gain * (ay[k] * vz - az[k] * vy)
                oy += gain * (az[k] * vx - ax[k] * vz)
                oz += gain * (ax[k] * vy - ay[k] * vx)
            hx, hy, hz = 0.5 * dt * ox, 0.5 * dt * oy, 0.5 * dt * oz
            w, x, y, z = (w - x * hx - y * hy - z * hz, x + w * hx + y * hz - z * hy,
                          y + w * hy + z * hx - x * hz, z + w * hz + x * hy - y * hx)
            s = 1 / math.sqrt(w * w + x * x + y * y + z * z)
            w, x, y, z = w * s, x * s, y * s, z * s
            out[k] = w, x, y, z
            step_rate = (rx[k], ry[k], rz[k])
        return t, out

    def blend_map(self, dirs):
        """One per lens: (map_x, map_y), plus lens 0's weight, for body directions."""
        x0, y0, t0 = self.lenses[0].project(dirs)
        x1, y1, t1 = self.lenses[1].project(dirs)
        w0 = np.clip(0.5 + (t1 - t0) / math.radians(2 * FEATHER_DEG), 0, 1).astype(np.float32)
        return (x0, y0), (x1, y1), w0


def decode(path, side, start=0.0, dur=None, rate=None):
    """Yield (lens0, lens1) BGR frames, each scaled to side x side, from `start`."""
    f = f"[0:v:0]scale={side}:{side}[a];[0:v:1]scale={side}:{side}[b];[a][b]hstack"
    if rate:
        f += f",fps={rate}"
    f += ",scale=in_color_matrix=bt709:in_range=pc:out_range=pc,format=bgr24"
    cmd = ["ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-i", path]
    if dur:
        cmd += ["-t", f"{dur:.3f}"]
    cmd += ["-filter_complex", f, "-f", "rawvideo", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=10 ** 8)
    size = 2 * side * side * 3
    try:
        while True:
            raw = p.stdout.read(size)
            if len(raw) < size:
                return
            im = np.frombuffer(raw, np.uint8).reshape(side, 2 * side, 3)
            yield im[:, :side], im[:, side:]
    finally:
        p.stdout.close()
        p.wait()


def equirect_dirs(w, h):
    lon = (np.arange(w) + 0.5) / w * 2 * np.pi - np.pi
    lat = np.pi / 2 - (np.arange(h) + 0.5) / h * np.pi
    lon, lat = np.meshgrid(lon, lat)
    return np.stack([np.cos(lat) * np.sin(lon), -np.sin(lat), np.cos(lat) * np.cos(lon)], -1)


if __name__ == "__main__":
    import sys
    v = Insv(sys.argv[1])
    print(v.model, v.serial, v.firmware, f"{v.width}x{v.height} {v.fps:.3f}fps {v.nframes}f {v.duration:.2f}s")
    print("records", {hex(k): len(x) for k, x in sorted(v.records.items())})
    print("first frame ts", v.first_frame_ts, "gyro offset ms", v.gyro_offset_ms, "rolling ms", v.rolling_ms)
    print("raw gyro", v.raw_gyro, "acc range", v.acc_range, "gyro range", v.gyro_range, "window", v.window_crop)
    for l in v.lenses:
        print("lens", l.index, "f", round(l.f, 2), "c", round(l.cx, 2), round(l.cy, 2))

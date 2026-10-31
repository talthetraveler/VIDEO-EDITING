"""Talk to the Concat editor from a script, over its built-in MCP server.

Concat (jub0t/Concat, AGPL, installed per user) edits headless: no window, no Claude config.

    from importlib import import_module
    c = import_module("concat-mcp").Concat()
    c.call("project_create", {...})

Run directly to list its tools, or `<tool>` to see one tool's arguments.
"""
import json
import os
import subprocess
import sys
from pathlib import Path

EXE = Path(os.environ["LOCALAPPDATA"]) / "Programs/Concat/concat.exe"


class Concat:
    def __init__(self, roots=None):
        env = dict(os.environ)
        if roots:
            env["CONCAT_MCP_ROOTS"] = ";".join(str(r) for r in roots)
        self.p = subprocess.Popen([str(EXE), "--mcp", "headless"], stdin=subprocess.PIPE,
                                  stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, env=env,
                                  text=True, encoding="utf-8", bufsize=1)
        self.n = 0
        self.rpc("initialize", {"protocolVersion": "2025-06-18", "capabilities": {},
                                "clientInfo": {"name": "tal-pipeline", "version": "1"}})
        self.send({"jsonrpc": "2.0", "method": "notifications/initialized"})

    def send(self, msg):
        self.p.stdin.write(json.dumps(msg) + "\n")
        self.p.stdin.flush()

    def rpc(self, method, params=None):
        self.n += 1
        self.send({"jsonrpc": "2.0", "id": self.n, "method": method, "params": params or {}})
        while True:
            line = self.p.stdout.readline()
            if not line:
                raise RuntimeError("concat closed the connection")
            msg = json.loads(line)
            if msg.get("id") == self.n:
                if "error" in msg:
                    raise RuntimeError(json.dumps(msg["error"])[:600])
                return msg["result"]

    def tools(self):
        return self.rpc("tools/list")["tools"]

    def call(self, name, args=None):
        """The tool's result: parsed JSON where it is JSON, else its raw content list."""
        r = self.rpc("tools/call", {"name": name, "arguments": args or {}})
        if r.get("isError"):
            raise RuntimeError(f"{name}: " + json.dumps(r.get("content"))[:800])
        if "structuredContent" in r:
            return r["structuredContent"]
        texts = [c["text"] for c in r.get("content", []) if c.get("type") == "text"]
        if len(texts) == 1:
            try:
                return json.loads(texts[0])
            except ValueError:
                return texts[0]
        return r.get("content")

    def close(self):
        self.p.stdin.close()
        self.p.wait(timeout=20)


if __name__ == "__main__":
    c = Concat()
    tools = c.tools()
    want = sys.argv[1:]
    for t in tools:
        if not want:
            print(t["name"])
        elif t["name"] in want:
            print(t["name"], t.get("description", "")[:500])
            print(json.dumps(t["inputSchema"])[:2500])
            print()
    print(len(tools), "tools", c.call("concat_version"))
    c.close()

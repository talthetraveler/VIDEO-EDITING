# python agnes_batch.py jobs.json   jobs = [{"out": path, "prompt": str, "seconds": 5}]  (three at a time, skips files that exist)
import sys, json, os
from concurrent.futures import ThreadPoolExecutor
from agnes import make
jobs = [j for j in json.load(open(sys.argv[1], encoding="utf-8")) if not os.path.exists(j["out"])]
with ThreadPoolExecutor(3) as ex:
    list(ex.map(lambda j: make(j["prompt"], j["out"], j.get("seconds", 5), j.get("aspect", "9:16")), jobs))

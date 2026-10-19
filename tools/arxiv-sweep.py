#!/usr/bin/env python3
"""arxiv-sweep.py — trend-sweep helper for the graph's industry catch-up sweeps.

Uses arXiv's HTML advanced search, not the Atom API: export.arxiv.org refused
this client on four attempts across three days (2026-09-11 → 09-18), while the
website's search served the same corpus without throttling.

Totals are read from the result headline ("Showing 1–50 of 187 results"), so a
size-capped page still reports the true count.

METHOD WARNING — announcement lag. Submission date is not announcement date, so
a window ending near the run date is still filling in: the same query over the
same window returned 29 → 37 an hour apart on 2026-09-18. For volume
comparisons, end the window at least 4 days before the run date (`--settle`).

METHOD WARNING — settled counts still drift, and weekdays differ. Re-measuring the
settled 09-12→09-15 window on 2026-09-27 returned 3–4 fewer papers per large
cluster than on 09-18. Treat differences under ~10% as noise, and compare windows
with the same weekday count (the tool prints it).

Usage:
  tools/arxiv-sweep.py volume   FROM TO [--settle N]
  tools/arxiv-sweep.py list     FROM TO [--exclude-cited]   # listings, minus ids already in the graph
  tools/arxiv-sweep.py abstract ID [ID ...]                 # title, authors, dateline, venue, abstract
"""
import argparse, datetime as dt, html, json, pathlib, re, sys, time
import urllib.parse, urllib.request

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/128.0 Safari/537.36"}
REPO = pathlib.Path(__file__).resolve().parent.parent

# Verbatim cluster definitions. Kept in the repo so every sweep's counts are
# reproducible — the 09-11 sweep lost its query strings and had to reconstruct them.
CLUSTERS = [
    ("LLM agent + benchmark/evaluation", [("AND", "abstract", '"LLM agent"'), ("OR", "abstract", '"language agent"'), ("AND", "abstract", "evaluation")]),
    ("tool use / MCP / tool calling",    [("AND", "abstract", '"tool calling"'), ("OR", "abstract", '"tool use"'), ("OR", "abstract", '"Model Context Protocol"')]),
    ("prompt injection / agent security", [("AND", "abstract", '"prompt injection"'), ("OR", "abstract", '"agent security"')]),
    ("multi-turn dialogue / conv agent", [("AND", "abstract", '"multi-turn"')]),
    ("agent skills / skill library",     [("AND", "abstract", '"agent skills"'), ("OR", "abstract", '"skill library"'), ("OR", "abstract", '"skill learning"')]),
    ("agent memory / long-term memory",  [("AND", "abstract", '"agent memory"'), ("OR", "abstract", '"long-term memory"')]),
    ("prompt optimization",              [("AND", "abstract", '"prompt optimization"'), ("OR", "abstract", '"prompt optimisation"')]),
    ("LLM-as-judge / evaluator",         [("AND", "abstract", '"LLM-as-a-judge"'), ("OR", "abstract", '"LLM judge"'), ("OR", "abstract", '"LLM-as-judge"')]),
]


def _get(url, tries=4):
    delay = 6
    for _ in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:  # noqa: BLE001 — report and back off, whatever it was
            print(f"      retry ({e})", file=sys.stderr, flush=True)
            time.sleep(delay)
            delay *= 2
    return None


def search(terms, d_from, d_to, size=200):
    p = [("advanced", "")]
    for i, (op, field, term) in enumerate(terms):
        p += [(f"terms-{i}-operator", op), (f"terms-{i}-term", term), (f"terms-{i}-field", field)]
    p += [("classification-computer_science", "y"), ("start", "0"),
          ("date-filter_by", "date_range"), ("date-from_date", d_from), ("date-to_date", d_to),
          ("date-date_type", "submitted_date"), ("size", str(size)), ("order", "-announced_date_first")]
    s = _get("https://arxiv.org/search/advanced?" + urllib.parse.urlencode(p))
    if s is None:
        return None, []
    m = re.search(r'<h1 class="title is-clearfix">(.*?)</h1>', s, re.S)
    head = " ".join(html.unescape(m.group(1)).split()) if m else ""
    if "No results" in head:
        total = 0
    else:
        mm = re.search(r"of\s+([\d,]+)\s+results", head)
        total = int(mm.group(1).replace(",", "")) if mm else None
    entries = []
    for blk in re.split(r'<li class="arxiv-result">', s)[1:]:
        aid = re.search(r"arxiv\.org/abs/(\d{4}\.\d{4,5})", blk)
        ti = re.search(r'<p class="title is-5 mathjax">(.*?)</p>', blk, re.S)
        if aid and ti:
            entries.append({"id": aid.group(1),
                            "title": " ".join(html.unescape(re.sub(r"<[^>]+>", "", ti.group(1))).split())})
    return total, entries


def cited_ids():
    ids = set()
    for p in (REPO / "nodes").rglob("*.md"):
        ids.update(re.findall(r"arxiv\.org/abs/(\d{4}\.\d{4,5})", p.read_text(encoding="utf-8")))
    return ids


def abstract(aid):
    s = _get(f"https://arxiv.org/abs/{aid}")
    if s is None:
        return None
    def grab(pat):
        m = re.search(pat, s, re.S)
        return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", m.group(1))).split()) if m else None
    rec = {"id": aid,
           "title": grab(r'<h1 class="title mathjax">(.*?)</h1>'),
           "authors": grab(r'<div class="authors">(.*?)</div>'),
           "dateline": grab(r'<div class="dateline">(.*?)</div>'),
           "comments": grab(r'<td class="tablecell comments[^"]*">(.*?)</td>'),
           "abstract": grab(r'<blockquote class="abstract mathjax">(.*?)</blockquote>')}
    for k, lbl in (("title", "Title:"), ("authors", "Authors:"), ("abstract", "Abstract:")):
        if rec[k] and rec[k].startswith(lbl):
            rec[k] = rec[k][len(lbl):].strip()
    return rec


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    v = sub.add_parser("volume"); v.add_argument("frm"); v.add_argument("to")
    v.add_argument("--settle", type=int, default=4, help="warn if TO is within N days of today")
    l = sub.add_parser("list"); l.add_argument("frm"); l.add_argument("to")
    l.add_argument("--exclude-cited", action="store_true")
    a = sub.add_parser("abstract"); a.add_argument("ids", nargs="+")
    args = ap.parse_args()

    if args.cmd == "volume":
        lag = (dt.date.today() - dt.date.fromisoformat(args.to)).days
        if lag < args.settle:
            print(f"WARNING: window ends {lag} day(s) before today; counts will be biased low "
                  f"(announcement lag). Use a TO at least {args.settle} days back.", file=sys.stderr)
        d0, d1 = dt.date.fromisoformat(args.frm), dt.date.fromisoformat(args.to)
        wk = sum((d0 + dt.timedelta(i)).weekday() < 5 for i in range((d1 - d0).days + 1))
        print(f"window has {wk} weekday(s) of {(d1 - d0).days + 1}; compare windows with equal "
              f"weekday counts, or per weekday — submissions dip on weekends", file=sys.stderr)
        for label, terms in CLUSTERS:
            n, _ = search(terms, args.frm, args.to, size=25)
            print(f"{('FAIL' if n is None else n):>6}  {label}", flush=True)
            time.sleep(3)

    elif args.cmd == "list":
        skip = cited_ids() if args.exclude_cited else set()
        seen = set()
        for label, terms in CLUSTERS:
            n, es = search(terms, args.frm, args.to)
            fresh = [e for e in es if e["id"] not in skip and e["id"] not in seen]
            seen.update(e["id"] for e in es)
            print(f"\n--- {label}: total={n}, listed={len(es)}, new={len(fresh)}", flush=True)
            for e in fresh:
                print(f"    {e['id']}  {e['title'][:110]}", flush=True)
            time.sleep(3)

    elif args.cmd == "abstract":
        for aid in args.ids:
            r = abstract(aid)
            if r is None:
                print(f"### {aid} FETCH FAILED\n", flush=True)
            else:
                print(json.dumps(r, ensure_ascii=False, indent=1), flush=True)
            time.sleep(3)


if __name__ == "__main__":
    main()

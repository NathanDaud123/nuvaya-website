"""
Ekstrak seluruh tabel TKPI 2017 (PDF Kemenkes) menjadi data/tkpi_2017.json.

Kenapa dari PDF, bukan dari spreadsheet spesifikasi: sheet "Food Database" di
MOCHI_Programmer_Specification_v1.1_TKPI.xlsx hanya memuat 787 dari 1.146 baris TKPI
(buah segar, daging/unggas mentah, minyak, sebagian serealia olahan, dll. tidak ikut).

Cara kerja: tiap angka dipetakan ke kolom berdasarkan posisi x baris satuan "(g) (Kal) ...",
sehingga sel kosong tetap kosong (null) dan tidak menggeser angka di sebelahnya.
Sesuai spesifikasi: nilai kosong TKPI TIDAK diubah menjadi 0.

Pemakaian:
    python scripts/build_tkpi.py [--xlsx doc/MOCHI_...xlsx]
Dengan --xlsx, hasil ekstraksi juga dibandingkan dengan baris spreadsheet (validasi impor).
"""

import argparse
import json
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "doc" / "TKPI 2017 Tabel komposisi pangan Indonesia 2017 Kemenkes.pdf"
OUT = ROOT / "data" / "tkpi_2017.json"

NUTRIENTS = [
    "water", "energy", "protein", "fat", "carbs", "fiber", "ash",
    "calcium", "phosphorus", "iron", "sodium", "potassium", "copper", "zinc",
    "retinol", "betaCarotene", "totalCarotene", "thiamin", "riboflavin", "niacin", "vitC",
]
UNITS = {"(g)", "(Kal)", "(mg)", "(mcg)"}
CODE_RE = re.compile(r"^[A-Z]{2}\d{3}$")
NUM_RE = re.compile(r"^-?\d+(?:[.,]\d*)?$")
BLANK_MARKS = {"-", "–"}
MAX_ROW_HEIGHT = 30  # baris terakhir di halaman: jangan sampai menelan nomor halaman/footer


def page_layout(words):
    """
    Posisi kolom per halaman (tiap halaman PDF bergeser beberapa pt):
    pusat x tiap kolom gizi dari baris satuan + BDD (%), dan batas kiri kolom nama/sumber/angka.
    """
    unit_words = [w for w in words if w[4] in UNITS]
    if len(unit_words) < len(NUTRIENTS):
        return None
    # Baris satuan = y yang paling banyak memuat kata satuan
    ys = {}
    for w in unit_words:
        ys.setdefault(round(w[1]), []).append(w)
    row = max(ys.values(), key=len)
    if len(row) != len(NUTRIENTS):
        return None
    row = sorted(row, key=lambda w: w[0])
    centers = [(w[0] + w[2]) / 2 for w in row]
    bdd = [w for w in words if w[4] == "(%)"]
    centers.append((bdd[0][0] + bdd[0][2]) / 2 if bdd else centers[-1] + 25)
    head = {w[4]: w[0] for w in words if w[4] in ("KODE", "SUMBER")}
    if len(head) < 2:
        return None
    return {
        "centers": centers,
        "unit_y": round(row[0][1]),
        "name_x0": head["KODE"] + 22,
        "source_x0": head["SUMBER"] - 8,
        "data_x0": row[0][0] - 8,
    }


def parse_number(s):
    s = s.replace(",", ".")
    return float(s.rstrip(".")) if NUM_RE.match(s) else None


def merge_wrapped(words):
    """
    Angka yang terlalu lebar untuk selnya dicetak dua baris ("11." di atas "0"),
    tepat di tengah baris pemiliknya. Sambung kembali jadi satu kata dengan y rata-rata.
    """
    words = sorted(words, key=lambda w: ((w[0] + w[2]) / 2, w[1]))
    out, used = [], set()
    for i, a in enumerate(words):
        if i in used:
            continue
        merged = a
        for j in range(i + 1, len(words)):
            b = words[j]
            if j in used or abs((a[0] + a[2]) / 2 - (b[0] + b[2]) / 2) > 6:
                continue
            top, bottom = (a, b) if a[1] <= b[1] else (b, a)
            dy = bottom[1] - top[1]
            # Potongan satu sel berjarak ~10 pt; dua baris data terpisah minimal ~15 pt.
            if 7 < dy < 12.5 and parse_number(top[4] + bottom[4]) is not None:
                merged = (min(a[0], b[0]), (a[1] + b[1]) / 2, max(a[2], b[2]), (a[3] + b[3]) / 2, top[4] + bottom[4])
                used.add(j)
                break
        out.append(merged)
    return out


def extract(pdf_path):
    doc = fitz.open(pdf_path)
    rows, problems = [], []
    group, ftype = None, None
    for pno, page in enumerate(doc, start=1):
        words = page.get_text("words")
        text = page.get_text()
        m = re.search(r"\n\s*4\.\d+\.\s+([A-Z ,]+?)\s*\n", "\n" + text)
        if m:
            group = m.group(1).strip().capitalize()
        layout = page_layout(words)
        if layout is None:
            continue
        centers, unit_y = layout["centers"], layout["unit_y"]
        name_x0, source_x0, data_x0 = layout["name_x0"], layout["source_x0"], layout["data_x0"]
        codes = sorted(
            [w for w in words if CODE_RE.match(w[4]) and w[0] < name_x0 and w[1] > unit_y],
            key=lambda w: w[1],
        )
        if not codes:
            continue
        markers = sorted(
            [w for w in words if w[4].startswith(("TUNGGAL", "OLAHAN")) and w[1] > unit_y],
            key=lambda w: w[1],
        )

        # Angka: pasangkan ke baris kode terdekat secara vertikal (bukan rentang),
        # karena angka yang terbungkus dua baris duduk di tengah baris pemiliknya.
        values = {cw[4]: [None] * (len(NUTRIENTS) + 1) for cw in codes}
        data_words = [w for w in words if w[0] >= data_x0 and w[1] > unit_y + 4 and w[4] not in BLANK_MARKS]
        for w in merge_wrapped(data_words):
            owner = min(codes, key=lambda cw: abs(cw[1] - w[1]))
            if abs(owner[1] - w[1]) > 12:
                continue  # nomor halaman / catatan kaki
            num = parse_number(w[4])
            if num is None:
                problems.append(f"{owner[4]} p{pno}: teks non-angka '{w[4]}'")
                continue
            xc = (w[0] + w[2]) / 2
            idx = min(range(len(centers)), key=lambda k: abs(centers[k] - xc))
            if abs(centers[idx] - xc) > 14:
                problems.append(f"{owner[4]} p{pno}: '{w[4]}' di x={xc:.0f} jauh dari kolom")
                continue
            vals = values[owner[4]]
            if vals[idx] is not None:
                problems.append(f"{owner[4]} p{pno}: dua angka di kolom {NUTRIENTS[idx] if idx < len(NUTRIENTS) else 'bdd'}")
                continue
            vals[idx] = num

        # Nama/sumber yang panjang juga dibungkus beberapa baris di sekitar baris kode-nya.
        text_words = {cw[4]: [] for cw in codes}
        for w in words:
            if not (name_x0 <= w[0] < data_x0) or w[1] <= unit_y + 4:
                continue
            if w[4].startswith(("TUNGGAL", "OLAHAN")):
                continue
            owner = min(codes, key=lambda cw: abs(cw[1] - w[1]))
            if abs(owner[1] - w[1]) <= MAX_ROW_HEIGHT / 2:
                text_words[owner[4]].append(w)

        for cw in codes:
            for mk in markers:
                if mk[1] < cw[1]:
                    ftype = "Tunggal/single" if mk[4].startswith("TUNGGAL") else "Olahan/produk/komposit"
            ordered = sorted(text_words[cw[4]], key=lambda w: (round(w[1]), w[0]))
            name = " ".join(w[4] for w in ordered if w[0] < source_x0)
            source = " ".join(w[4] for w in ordered if w[0] >= source_x0)
            vals = values[cw[4]]
            rows.append({
                "code": cw[4],
                "name": re.sub(r"\s+", " ", name).strip(),
                "source": re.sub(r"\s+", " ", source).strip(),
                "group": group,
                "type": ftype,
                "page": pno,
                **{k: vals[j] for j, k in enumerate(NUTRIENTS)},
                "bdd": vals[-1],
            })
    return rows, problems


def compare_with_xlsx(rows, xlsx_path):
    import openpyxl

    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    ws = wb["Food Database"]
    by_code = {r["code"]: r for r in rows}
    checked = mismatched = 0
    diffs = []
    for r in ws.iter_rows(min_row=4, values_only=True):
        if not r[0]:
            continue
        mine = by_code.get(r[0])
        if mine is None:
            diffs.append(f"{r[0]}: ada di xlsx, tidak ada di ekstraksi PDF")
            continue
        sheet_vals = list(r[3:24]) + [r[24]]
        keys = NUTRIENTS + ["bdd"]
        for k, sv in zip(keys, sheet_vals):
            checked += 1
            sv = None if sv in (None, "") else float(sv)
            if sv != mine[k]:
                mismatched += 1
                diffs.append(f"{r[0]} {k}: xlsx={sv} pdf={mine[k]}")
    return checked, mismatched, diffs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--xlsx", type=Path)
    args = ap.parse_args()

    rows, problems = extract(PDF)
    print(f"{len(rows)} baris diekstrak; {len(problems)} catatan parsing")
    for p in problems[:40]:
        print("  ", p)

    if args.xlsx:
        checked, mismatched, diffs = compare_with_xlsx(rows, args.xlsx)
        print(f"Validasi vs xlsx: {checked} sel dicek, {mismatched} berbeda")
        for d in diffs[:40]:
            print("  ", d)

    keys = ["code", "name", "source", "group", "type"] + NUTRIENTS + ["bdd"]
    payload = {
        "source": "Tabel Komposisi Pangan Indonesia 2017, Kementerian Kesehatan RI",
        "basis": "per 100 g bagian dapat dimakan (BDD); null = tidak dianalisis/tidak tersedia, bukan 0",
        "fields": keys,
        "rows": [[r[k] for k in keys] for r in rows],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Ditulis: {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    sys.exit(main())

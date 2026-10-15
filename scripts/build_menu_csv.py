"""
Isi ulang kolom gizi lima CSV menu (public/datasets/tkpi_*.csv) dari TKPI 2017.

CSV menu = daftar makanan yang boleh dipakai mesin menu MOCHI. Kolom yang diisi tim
(kode_tkpi, nama_menu, kategori, porsi_urt, berat_porsi_g, alergen, aktif, catatan)
dibiarkan apa adanya; kolom gizi dan nama_tkpi SELALU ditimpa dari
data/tkpi_2017.json (hasil scripts/build_tkpi.py) agar tidak ada angka ketik manual.

Nilai gizi = per 100 g bagian yang dapat dimakan (BDD), persis seperti tabel PDF TKPI.
Sel kosong = tidak dianalisis / tidak tersedia di TKPI, BUKAN 0.

Pemakaian (setelah menambah/mengubah baris di salah satu CSV):
    python scripts/build_menu_csv.py
"""

import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATASETS = ROOT / "public" / "datasets"
TKPI_JSON = ROOT / "data" / "tkpi_2017.json"

# berkas → kategori yang boleh ada di dalamnya
FILES = {
    "tkpi_staple.csv": {"pokok"},
    "tkpi_animal.csv": {"hewani"},
    "tkpi_plant.csv": {"nabati"},
    "tkpi_vegetable.csv": {"sayur"},
    "tkpi_side.csv": {"buah", "selingan"},
}

ALLERGENS = {"telur", "susu", "ikan", "udang", "kacang_tanah", "kedelai", "gandum"}

META_COLUMNS = [
    "no", "kode_tkpi", "nama_menu", "kategori", "porsi_urt", "berat_porsi_g",
    "alergen", "aktif", "catatan",
]

# kolom CSV → field tkpi_2017.json, urut seperti tabel PDF
NUTRIENT_COLUMNS = [
    ("air_g_per100g", "water"),
    ("energi_kkal_per100g", "energy"),
    ("protein_g_per100g", "protein"),
    ("lemak_g_per100g", "fat"),
    ("karbohidrat_g_per100g", "carbs"),
    ("serat_g_per100g", "fiber"),
    ("abu_g_per100g", "ash"),
    ("kalsium_mg_per100g", "calcium"),
    ("fosfor_mg_per100g", "phosphorus"),
    ("besi_mg_per100g", "iron"),
    ("natrium_mg_per100g", "sodium"),
    ("kalium_mg_per100g", "potassium"),
    ("tembaga_mg_per100g", "copper"),
    ("seng_mg_per100g", "zinc"),
    ("retinol_mcg_per100g", "retinol"),
    ("beta_karoten_mcg_per100g", "betaCarotene"),
    ("karoten_total_mcg_per100g", "totalCarotene"),
    ("thiamin_mg_per100g", "thiamin"),
    ("riboflavin_mg_per100g", "riboflavin"),
    ("niasin_mg_per100g", "niacin"),
    ("vitamin_c_mg_per100g", "vitC"),
    ("bdd_persen", "bdd"),
]

COLUMNS = META_COLUMNS + ["nama_tkpi", "sumber_tkpi"] + [c for c, _ in NUTRIENT_COLUMNS]


def fmt(v):
    if v is None:
        return ""
    return f"{v:g}"


def load_tkpi():
    payload = json.loads(TKPI_JSON.read_text(encoding="utf-8"))
    fields = payload["fields"]
    return {row[0]: dict(zip(fields, row)) for row in payload["rows"]}


def main():
    tkpi = load_tkpi()
    errors, warnings = [], []
    seen_codes = {}

    for fname, allowed in FILES.items():
        path = DATASETS / fname
        with path.open(encoding="utf-8-sig", newline="") as f:
            rows = list(csv.DictReader(f))

        out = []
        for i, row in enumerate(rows, start=1):
            code = (row.get("kode_tkpi") or "").strip()
            where = f"{fname} baris {i + 1} ({row.get('nama_menu')})"
            t = tkpi.get(code)
            if t is None:
                errors.append(f"{where}: kode TKPI '{code}' tidak ada")
                continue
            if row.get("kategori") not in allowed:
                errors.append(f"{where}: kategori '{row.get('kategori')}' tidak boleh di {fname}")
            try:
                if float(row.get("berat_porsi_g") or 0) <= 0:
                    raise ValueError
            except ValueError:
                errors.append(f"{where}: berat_porsi_g harus angka > 0")
            bad = [a for a in (row.get("alergen") or "").split(";") if a and a not in ALLERGENS]
            if bad:
                errors.append(f"{where}: alergen tidak dikenal {bad}")
            if code in seen_codes:
                warnings.append(f"{where}: kode {code} juga dipakai di {seen_codes[code]}")
            seen_codes[code] = where

            e, p, c, l = (t[k] for k in ("energy", "protein", "carbs", "fat"))
            if None not in (e, p, c, l) and e:
                ratio = (4 * p + 4 * c + 9 * l) / e
                if not 0.7 <= ratio <= 1.5 and row.get("aktif", "1").strip() != "0":
                    warnings.append(f"{where}: energi TKPI tidak konsisten dengan makro (rasio {ratio:.2f})")

            if t["copper"] is not None and t["copper"] > 10:
                warnings.append(f"{where}: tembaga {t['copper']:g} mg/100 g di TKPI, kemungkinan tercetak dalam mcg")

            new = {k: (row.get(k) or "").strip() for k in META_COLUMNS}
            new["no"] = str(len(out) + 1)
            new["aktif"] = new["aktif"] or "1"
            new["nama_tkpi"] = t["name"]
            new["sumber_tkpi"] = t["source"]
            for col, key in NUTRIENT_COLUMNS:
                new[col] = fmt(t[key])
            out.append(new)

        # utf-8-sig agar Excel menampilkan ½ ¾ dengan benar
        with path.open("w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=COLUMNS, lineterminator="\n")
            w.writeheader()
            w.writerows(out)
        print(f"{fname}: {len(out)} makanan")

    for wmsg in warnings:
        print("PERINGATAN:", wmsg)
    for emsg in errors:
        print("GALAT:", emsg)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())

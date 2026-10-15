"""
Isi ulang kolom gizi lima CSV menu (public/datasets/tkpi_*.csv) dari TKPI 2017.

CSV menu = daftar makanan yang boleh dipakai mesin menu MOCHI. Kolom yang diisi tim
(kode_tkpi, nama_menu, kategori, porsi_urt, berat_porsi_g, alergen, aktif, catatan)
dibiarkan apa adanya; kolom gizi dan nama_tkpi SELALU ditimpa dari
data/tkpi_2017.csv (hasil scripts/build_tkpi.py) agar tidak ada angka ketik manual.

Nilai gizi = per 100 g bagian yang dapat dimakan (BDD), persis seperti tabel PDF TKPI.
Sel kosong = tidak dianalisis / tidak tersedia di TKPI, BUKAN 0.

Pemakaian (setelah menambah/mengubah baris di salah satu CSV):
    python scripts/build_menu_csv.py
"""

import csv
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATASETS = ROOT / "public" / "datasets"
TKPI_CSV = ROOT / "data" / "tkpi_2017.csv"

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

# kolom gizi, urut seperti tabel PDF — namanya sama persis dengan kolom di data/tkpi_2017.csv
NUTRIENT_COLUMNS = [
    "air_g_per100g", "energi_kkal_per100g", "protein_g_per100g", "lemak_g_per100g",
    "karbohidrat_g_per100g", "serat_g_per100g", "abu_g_per100g", "kalsium_mg_per100g",
    "fosfor_mg_per100g", "besi_mg_per100g", "natrium_mg_per100g", "kalium_mg_per100g",
    "tembaga_mg_per100g", "seng_mg_per100g", "retinol_mcg_per100g", "beta_karoten_mcg_per100g",
    "karoten_total_mcg_per100g", "thiamin_mg_per100g", "riboflavin_mg_per100g",
    "niasin_mg_per100g", "vitamin_c_mg_per100g", "bdd_persen",
]

COLUMNS = META_COLUMNS + ["nama_tkpi", "sumber_tkpi"] + NUTRIENT_COLUMNS


def num(s):
    """Sel kosong = tidak ada data di TKPI → None, bukan 0."""
    return float(s) if s and s.strip() else None


def load_tkpi():
    with TKPI_CSV.open(encoding="utf-8-sig", newline="") as f:
        return {row["kode_tkpi"]: row for row in csv.DictReader(f)}


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

            e, p, c, l = (num(t[k]) for k in ("energi_kkal_per100g", "protein_g_per100g", "karbohidrat_g_per100g", "lemak_g_per100g"))
            if None not in (e, p, c, l) and e:
                ratio = (4 * p + 4 * c + 9 * l) / e
                if not 0.7 <= ratio <= 1.5 and row.get("aktif", "1").strip() != "0":
                    warnings.append(f"{where}: energi TKPI tidak konsisten dengan makro (rasio {ratio:.2f})")

            copper = num(t["tembaga_mg_per100g"])
            if copper is not None and copper > 10:
                warnings.append(f"{where}: tembaga {copper:g} mg/100 g di TKPI, kemungkinan tercetak dalam mcg")

            new = {k: (row.get(k) or "").strip() for k in META_COLUMNS}
            new["no"] = str(len(out) + 1)
            new["aktif"] = new["aktif"] or "1"
            new["nama_tkpi"] = t["nama_tkpi"]
            new["sumber_tkpi"] = t["sumber_tkpi"]
            for col in NUTRIENT_COLUMNS:
                new[col] = t[col]
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

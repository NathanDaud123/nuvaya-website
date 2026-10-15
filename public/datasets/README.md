# Dataset menu Mochi

## Yang dipakai aplikasi: `tkpi_*.csv`

| Berkas | Isi (`kategori`) |
|---|---|
| `tkpi_staple.csv` | makanan pokok (`pokok`) |
| `tkpi_animal.csv` | lauk hewani (`hewani`) |
| `tkpi_plant.csv` | lauk nabati (`nabati`) |
| `tkpi_vegetable.csv` | sayur (`sayur`) |
| `tkpi_side.csv` | buah (`buah`) dan selingan (`selingan`) |

**Kolom yang diisi tim gizi**

- `kode_tkpi`: kode bahan di TKPI 2017, misalnya `AP001`.
- `nama_menu`: nama yang tampil ke ibu.
- `porsi_urt`: ukuran rumah tangga untuk 1 porsi, misalnya `¾ gelas`.
- `berat_porsi_g`: berat 1 porsi dalam gram, bagian yang dapat dimakan.
- `alergen`: dipisah titik koma. Nilai yang dikenali: `telur;susu;ikan;udang;kacang_tanah;kedelai;gandum`.
- `aktif`: `1` dipakai, `0` disimpan tapi tidak dipakai.
- `catatan`: keterangan bebas.

**Kolom yang diisi otomatis dari TKPI 2017**

Kolom-kolom ini jangan diketik manual. Isinya `nama_tkpi`, `sumber_tkpi`, dan semua kolom `*_per100g`: air, energi, protein, lemak, karbohidrat, serat, abu, kalsium, fosfor, besi, natrium, kalium, tembaga, seng, retinol, β-karoten, karoten total, thiamin, riboflavin, niasin, dan vitamin C. Ada juga `bdd_persen`.

- Nilai gizi dihitung **per 100 g bagian yang dapat dimakan (BDD)**, sama seperti tabel PDF TKPI. Aplikasi mengalikannya dengan `berat_porsi_g` saat menampilkan porsi.
- **Sel kosong berarti tidak dianalisis atau tidak tersedia di TKPI, bukan 0.**
- Folat tidak ada di TKPI 2017, jadi kolomnya tidak disediakan.
- Tembaga dibiarkan sesuai PDF, tetapi tidak dipakai aplikasi: beberapa baris TKPI (mis. apel 124,2; jeruk manis 160) tampaknya tercetak dalam µg walau kolomnya mg. `build_menu_csv.py` memberi peringatan untuk nilai > 10 mg/100 g.

Setelah menambah atau mengubah baris, jalankan:

```
python scripts/build_tkpi.py        # sekali saja: PDF TKPI → tkpi_2017.json
python scripts/build_menu_csv.py    # isi ulang kolom gizi kelima CSV dari tkpi_2017.json
```

## Lainnya

- `tkpi_2017.json` berisi seluruh 1.146 bahan TKPI 2017, hasil ekstraksi dari PDF. Ini sumber untuk `build_menu_csv.py`.
- `rec_source_*.csv` adalah dataset menu lama (bukan TKPI). File ini disimpan, tapi tidak dipakai aplikasi.

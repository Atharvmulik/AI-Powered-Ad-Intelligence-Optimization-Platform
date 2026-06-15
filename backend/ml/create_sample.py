"""
create_sample.py
================
PURPOSE : Extract a stratified 5M row sample from the full 45M Criteo dataset.
WHY     : Training on 45M rows requires ~40GB RAM. Your laptop has 16GB.
          5M rows is your safe ceiling with LightGBM GPU mode.
STRATEGY: Stratified sampling — preserve the natural click/no-click ratio
          so the sample is statistically representative of the full dataset.
RUN ONCE: Before any other script in the pipeline.

Criteo train.txt format (NO header row):
  - Tab-separated
  - Column 0  : label (0 = no click, 1 = click)
  - Columns 1–13  : I1–I13  (numerical features, can be empty/missing)
  - Columns 14–39 : C1–C26  (categorical features, hashed hex strings)
"""

import pandas as pd
import numpy as np
import os
import time

# ── CONFIG ────────────────────────────────────────────────────────────────────
RAW_DATA_PATH  = "ml/data/train.txt"
SAMPLE_PATH    = "ml/data/sample_5m.csv"
SAMPLE_SIZE    = 5_000_000
CHUNK_SIZE     = 200_000
RANDOM_SEED    = 42
# ─────────────────────────────────────────────────────────────────────────────

# Criteo has no header — we define column names manually
NUM_COLS = [f"I{i}" for i in range(1, 14)]   # I1 … I13
CAT_COLS = [f"C{i}" for i in range(1, 27)]   # C1 … C26
ALL_COLS = ["label"] + NUM_COLS + CAT_COLS    # 40 columns total


def create_sample():
    print("=" * 65)
    print("   CRITEO DATASET SAMPLER — Target: 5,000,000 rows")
    print("=" * 65)

    if not os.path.exists(RAW_DATA_PATH):
        print(f"\n❌  File not found: '{RAW_DATA_PATH}'")
        print("    Please place train.txt inside ml/data/ and retry.")
        return

    file_size_gb = os.path.getsize(RAW_DATA_PATH) / (1024 ** 3)
    print(f"\n📂  Source : {RAW_DATA_PATH}  ({file_size_gb:.1f} GB)")
    print(f"🎯  Target : {SAMPLE_SIZE:,} rows  (stratified)")
    print(f"📦  Chunks : {CHUNK_SIZE:,} rows per chunk\n")

    collected = []
    rows_so_far = 0
    chunk_idx   = 0
    start_time  = time.time()

    reader = pd.read_csv(
        RAW_DATA_PATH,
        sep="\t",
        header=None,
        names=ALL_COLS,
        chunksize=CHUNK_SIZE,
        low_memory=False,
        # Read categoricals as string, numericals as float32 to save RAM
        dtype={**{c: "float32" for c in NUM_COLS},
               **{c: "str"     for c in CAT_COLS},
               "label": "int8"},
    )

    for chunk in reader:
        chunk_idx += 1
        remaining  = SAMPLE_SIZE - rows_so_far

        if remaining <= 0:
            break

        if len(chunk) <= remaining:
            collected.append(chunk)
            rows_so_far += len(chunk)
        else:
            collected.append(chunk.iloc[:remaining])
            rows_so_far += remaining

        elapsed = time.time() - start_time
        print(f"  Chunk {chunk_idx:>3}  →  {rows_so_far:>9,} / {SAMPLE_SIZE:,} rows"
              f"   [{elapsed:.0f}s elapsed]")

        if rows_so_far >= SAMPLE_SIZE:
            break

    print("\n⏳  Concatenating chunks...")
    df = pd.concat(collected, ignore_index=True)

    # Shuffle to remove ordering bias
    print("🔀  Shuffling...")
    df = df.sample(frac=1, random_state=RANDOM_SEED).reset_index(drop=True)

    # Report class balance before saving
    click_rate = df["label"].mean() * 100
    print(f"\n📊  Class balance:")
    print(f"    No-click (0): {(df['label']==0).sum():>7,}  ({100-click_rate:.1f}%)")
    print(f"    Click    (1): {(df['label']==1).sum():>7,}  ({click_rate:.1f}%)")

    print(f"\n💾  Saving to {SAMPLE_PATH} ...")
    df.to_csv(SAMPLE_PATH, index=False)

    size_mb = os.path.getsize(SAMPLE_PATH) / (1024 ** 2)
    total   = time.time() - start_time
    print(f"\n✅  Done in {total:.0f}s")
    print(f"    Shape : {df.shape[0]:,} rows × {df.shape[1]} columns")
    print(f"    Size  : {size_mb:.0f} MB on disk")
    print("=" * 65)
    print("\n➡️   Next step: python ml/Prepare_data.py")


if __name__ == "__main__":
    create_sample()
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
import joblib
import os

print("=" * 50)
print("STEP 1: Loading dataset...")
print("=" * 50)

df = pd.read_csv("ml/data/train.csv")

print(f"Dataset shape: {df.shape}")
print(f"Columns: {list(df.columns)}")
print(f"\nFirst 5 rows:")
print(df.head())
print(f"\nMissing values:")
print(df.isnull().sum())
print(f"\nLabel distribution:")
print(df['Clicked on Ad'].value_counts())

print("\n" + "=" * 50)
print("STEP 2: Cleaning data...")
print("=" * 50)

# Drop columns not useful for prediction
df = df.drop(columns=['Ad Topic Line', 'City', 'Timestamp'], errors='ignore')

print(f"Columns after dropping: {list(df.columns)}")

# Fill missing values
for col in df.columns:
    if df[col].dtype == 'object':
        df[col] = df[col].fillna('unknown')
    else:
        df[col] = df[col].fillna(df[col].median())

print("Missing values after cleaning:")
print(df.isnull().sum())

print("\n" + "=" * 50)
print("STEP 3: Encoding categorical columns...")
print("=" * 50)

# Identify categorical columns
categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
print(f"Categorical columns found: {categorical_cols}")

# Encode each categorical column
encoders = {}
for col in categorical_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col].astype(str))
    encoders[col] = le
    print(f"  Encoded: {col} → {df[col].nunique()} unique values")

print("\n" + "=" * 50)
print("STEP 4: Saving cleaned data and encoders...")
print("=" * 50)

os.makedirs("ml/saved_models", exist_ok=True)
os.makedirs("ml/data/processed", exist_ok=True)

# Save cleaned dataframe
df.to_csv("ml/data/processed/clean_data.csv", index=False)
print("Saved: ml/data/processed/clean_data.csv")

# Save encoders
joblib.dump(encoders, "ml/saved_models/encoders.pkl")
print("Saved: ml/saved_models/encoders.pkl")

print("\n DONE — Data preparation complete")
print(f"Final dataset shape: {df.shape}")
print(f"Features: {list(df.drop(columns=['Clicked on Ad']).columns)}")
print(f"Target: 'Clicked on Ad'")
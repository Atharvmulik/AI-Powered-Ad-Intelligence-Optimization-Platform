import pandas as pd
import numpy as np
import joblib
import os

print("=" * 55)
print("STEP 1: Loading TalkingData dataset...")
print("=" * 55)

df = pd.read_csv("ml/data/train_fraud.csv")

print(f"Shape: {df.shape}")
print(f"Columns: {list(df.columns)}")
print(f"\nFirst 5 rows:")
print(df.head())
print(f"\nMissing values:")
print(df.isnull().sum())
print(f"\nFraud label distribution:")
print(df['is_attributed'].value_counts())
print(f"Fraud %: {df['is_attributed'].mean()*100:.2f}%")

print("\n" + "=" * 55)
print("STEP 2: Dropping useless columns...")
print("=" * 55)

# attributed_time is only filled when is_attributed=1
# leaks the label directly — must drop
df = df.drop(columns=['attributed_time'], errors='ignore')
print(f"Dropped: attributed_time (leaks label)")
print(f"Remaining columns: {list(df.columns)}")

print("\n" + "=" * 55)
print("STEP 3: Extracting time features from click_time...")
print("=" * 55)

df['click_time'] = pd.to_datetime(df['click_time'])
df['hour']         = df['click_time'].dt.hour
df['day']          = df['click_time'].dt.day
df['day_of_week']  = df['click_time'].dt.dayofweek
df['minute']       = df['click_time'].dt.minute

# Bots click at unusual hours — night time is suspicious
df['is_night']     = ((df['hour'] >= 0) & (df['hour'] <= 5)).astype(int)

# Peak human hours
df['is_peak_hour'] = ((df['hour'] >= 9) & (df['hour'] <= 21)).astype(int)

df = df.drop(columns=['click_time'])
print(f"Extracted: hour, day, day_of_week, minute, is_night, is_peak_hour")

print("\n" + "=" * 55)
print("STEP 4: Engineering click velocity features...")
print("=" * 55)

# This is the KEY difference from your old dataset
# TalkingData has repeated IPs — so we can measure velocity

# How many times does this IP appear in dataset
df['ip_click_count'] = df.groupby('ip')['ip'].transform('count')
print(f"ip_click_count — max: {df['ip_click_count'].max()}, "
      f"mean: {df['ip_click_count'].mean():.2f}")

# How many times does this IP click this specific app
df['ip_app_count'] = df.groupby(['ip', 'app'])['ip'].transform('count')
print(f"ip_app_count   — max: {df['ip_app_count'].max()}, "
      f"mean: {df['ip_app_count'].mean():.2f}")

# How many times does this IP use this OS
df['ip_os_count'] = df.groupby(['ip', 'os'])['ip'].transform('count')
print(f"ip_os_count    — max: {df['ip_os_count'].max()}, "
      f"mean: {df['ip_os_count'].mean():.2f}")

# How many times does this IP use this device
df['ip_device_count'] = df.groupby(['ip', 'device'])['ip'].transform('count')
print(f"ip_device_count — max: {df['ip_device_count'].max()}, "
      f"mean: {df['ip_device_count'].mean():.2f}")

# How many times this IP clicks in this hour
df['ip_hour_count'] = df.groupby(['ip', 'hour'])['ip'].transform('count')
print(f"ip_hour_count  — max: {df['ip_hour_count'].max()}, "
      f"mean: {df['ip_hour_count'].mean():.2f}")

# How many times this channel appears
df['channel_count'] = df.groupby('channel')['channel'].transform('count')
print(f"channel_count  — max: {df['channel_count'].max()}, "
      f"mean: {df['channel_count'].mean():.2f}")

# How many times this app appears
df['app_count'] = df.groupby('app')['app'].transform('count')
print(f"app_count      — max: {df['app_count'].max()}, "
      f"mean: {df['app_count'].mean():.2f}")

print("\n" + "=" * 55)
print("STEP 5: Dropping ip (raw value not useful after velocity)...")
print("=" * 55)

# Raw IP number means nothing to model
# We already captured all info via velocity features
df = df.drop(columns=['ip'])
print(f"Final columns: {list(df.columns)}")

print("\n" + "=" * 55)
print("STEP 6: Checking final data...")
print("=" * 55)

print(f"Final shape: {df.shape}")
print(f"Missing values:\n{df.isnull().sum()}")
print(f"\nFraud label distribution:")
print(df['is_attributed'].value_counts())
print(f"Fraud %: {df['is_attributed'].mean()*100:.2f}%")
print(f"\nSample rows:")
print(df.head())

print("\n" + "=" * 55)
print("STEP 7: Saving processed data...")
print("=" * 55)

os.makedirs("ml/data/processed", exist_ok=True)
os.makedirs("ml/saved_models", exist_ok=True)

df.to_csv("ml/data/processed/clean_fraud_data.csv", index=False)
print("Saved: ml/data/processed/clean_fraud_data.csv")

# Save feature column names (everything except label)
feature_columns = list(df.drop(columns=['is_attributed']).columns)
joblib.dump(feature_columns, "ml/saved_models/fraud_feature_columns.pkl")
print("Saved: ml/saved_models/fraud_feature_columns.pkl")

print(f"\nFeature columns ({len(feature_columns)}):")
for col in feature_columns:
    print(f"  - {col}")

print("\n DONE — Fraud data preparation complete")
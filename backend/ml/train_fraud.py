import pandas as pd
import numpy as np
import joblib
import os
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score
)
import xgboost as xgb

print("=" * 55)
print("STEP 1: Loading cleaned fraud data...")
print("=" * 55)

df = pd.read_csv("ml/data/processed/clean_fraud_data.csv")
print(f"Shape: {df.shape}")
print(f"Columns: {list(df.columns)}")
print(f"\nFraud distribution:")
print(df['is_attributed'].value_counts())
print(f"Fraud %: {df['is_attributed'].mean()*100:.2f}%")

# Features and label
X = df.drop(columns=['is_attributed'])
y = df['is_attributed']

print(f"\nFeature columns: {list(X.columns)}")

print("\n" + "=" * 55)
print("STEP 2: Train/test split...")
print("=" * 55)

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y        # keeps fraud ratio same in both splits
)

print(f"Train: {X_train.shape[0]} rows")
print(f"Test:  {X_test.shape[0]} rows")
print(f"Train fraud %: {y_train.mean()*100:.2f}%")
print(f"Test  fraud %: {y_test.mean()*100:.2f}%")

print("\n" + "=" * 55)
print("STEP 3: Scaling features...")
print("=" * 55)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)
print("Scaling done.")

print("\n" + "=" * 55)
print("STEP 4: Training Isolation Forest (unsupervised)...")
print("=" * 55)

# contamination = actual fraud % in dataset
fraud_rate = y.mean()
print(f"Setting contamination = {fraud_rate:.4f} (actual fraud rate)")

isolation_forest = IsolationForest(
    n_estimators=200,
    contamination=float(fraud_rate),
    max_samples='auto',
    random_state=42,
    n_jobs=-1
)

isolation_forest.fit(X_train_scaled)

# Predict on test set
# IF returns: -1 = anomaly (fraud), 1 = normal (clean)
if_preds = isolation_forest.predict(X_test_scaled)
if_labels = (if_preds == -1).astype(int)

print(f"\nIsolation Forest Results on Test Set:")
print(f"Flagged as fraud: {if_labels.sum()}")
print(classification_report(
    y_test, if_labels,
    target_names=['Clean', 'Fraud']
))

print("\n" + "=" * 55)
print("STEP 5: Training XGBoost (supervised)...")
print("=" * 55)

# Handle class imbalance
# Dataset is heavily imbalanced (fraud is rare)
fraud_count = (y_train == 1).sum()
clean_count = (y_train == 0).sum()
scale_pos_weight = clean_count / fraud_count

print(f"Clean samples:    {clean_count}")
print(f"Fraud samples:    {fraud_count}")
print(f"scale_pos_weight: {scale_pos_weight:.2f}")

xgb_model = xgb.XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=5,
    scale_pos_weight=scale_pos_weight,
    eval_metric='auc',
    random_state=42,
    n_jobs=-1
)

xgb_model.fit(
    X_train_scaled, y_train,
    eval_set=[(X_test_scaled, y_test)],
    verbose=50
)

print("\nXGBoost training complete.")

print("\n" + "=" * 55)
print("STEP 6: Evaluating XGBoost...")
print("=" * 55)

y_pred_proba = xgb_model.predict_proba(X_test_scaled)[:, 1]
y_pred       = xgb_model.predict(X_test_scaled)

auc = roc_auc_score(y_test, y_pred_proba)

print(f"\nAUC-ROC: {auc:.4f}  (target: > 0.95)")
print(f"\nClassification Report:")
print(classification_report(
    y_test, y_pred,
    target_names=['Clean', 'Fraud']
))
print(f"Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(cm)
print(f"\nTrue Positives  (Fraud caught):   {cm[1][1]}")
print(f"False Negatives (Fraud missed):   {cm[1][0]}")
print(f"False Positives (Clean blocked):  {cm[0][1]}")
print(f"True Negatives  (Clean passed):   {cm[0][0]}")

print("\n" + "=" * 55)
print("STEP 7: Testing ensemble scoring on 5 samples...")
print("=" * 55)

# Isolation Forest anomaly score
if_scores = isolation_forest.decision_function(X_test_scaled)

# Normalize IF scores to 0-1
# More negative = more anomalous → higher fraud probability
if_fraud_prob = 1 - (
    (if_scores - if_scores.min()) /
    (if_scores.max() - if_scores.min())
)

xgb_fraud_prob = xgb_model.predict_proba(X_test_scaled)[:, 1]

# Weighted ensemble: XGBoost is more reliable here
ensemble_score = (0.3 * if_fraud_prob) + (0.7 * xgb_fraud_prob)

print(f"{'Row':<5} {'IF':>6} {'XGB':>6} {'Ensemble':>10} "
      f"{'Decision':>10} {'Actual':>8}")
print("-" * 50)
for i in range(10):
    decision = "FRAUD" if ensemble_score[i] > 0.5 else "CLEAN"
    actual    = "FRAUD" if y_test.iloc[i] == 1 else "CLEAN"
    match     = "✓" if decision == actual else "✗"
    print(f"{i:<5} {if_fraud_prob[i]:>6.3f} {xgb_fraud_prob[i]:>6.3f} "
          f"{ensemble_score[i]:>10.3f} {decision:>10} "
          f"{actual:>8} {match}")

print("\n" + "=" * 55)
print("STEP 8: Saving all models...")
print("=" * 55)

os.makedirs("ml/saved_models", exist_ok=True)

joblib.dump(isolation_forest, "ml/saved_models/isolation_forest.pkl")
joblib.dump(xgb_model,        "ml/saved_models/fraud_xgboost.pkl")
joblib.dump(scaler,           "ml/saved_models/fraud_scaler.pkl")

print("Saved: ml/saved_models/isolation_forest.pkl")
print("Saved: ml/saved_models/fraud_xgboost.pkl")
print("Saved: ml/saved_models/fraud_scaler.pkl")

print("\n" + "=" * 55)
print("STEP 9: Feature Importance (XGBoost Top 10)")
print("=" * 55)

feature_columns = list(X.columns)
importance      = xgb_model.feature_importances_
feat_imp = sorted(
    zip(feature_columns, importance),
    key=lambda x: x[1],
    reverse=True
)

for rank, (feature, score) in enumerate(feat_imp, 1):
    bar = "█" * int(score * 100)
    print(f"  {rank:2}. {feature:<25} {score:.4f}  {bar}")

print("\n ALL DONE — Fraud model training complete!")
print("    Models saved in: ml/saved_models/")
print(f"    Final AUC-ROC: {auc:.4f}")
import pandas as pd
import numpy as np
import xgboost as xgb
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    roc_auc_score,
    accuracy_score,
    classification_report,
    confusion_matrix
)

print("=" * 50)
print("STEP 1: Loading cleaned data...")
print("=" * 50)

df = pd.read_csv("ml/data/processed/clean_data.csv")
print(f"Loaded shape: {df.shape}")

# Separate features and target
X = df.drop(columns=['Clicked on Ad'])
y = df['Clicked on Ad']

print(f"Features shape: {X.shape}")
print(f"Target distribution:\n{y.value_counts()}")
print(f"Feature columns: {list(X.columns)}")

print("\n" + "=" * 50)
print("STEP 2: Splitting data...")
print("=" * 50)

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y       # keeps class balance in both splits
)

print(f"Train size: {X_train.shape[0]} rows")
print(f"Test size:  {X_test.shape[0]} rows")

print("\n" + "=" * 50)
print("STEP 3: Scaling numerical features...")
print("=" * 50)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)

print("Scaling done.")

print("\n" + "=" * 50)
print("STEP 4: Training XGBoost model...")
print("=" * 50)

model = xgb.XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=1,
    gamma=0,
    reg_alpha=0.1,
    reg_lambda=1.0,
    use_label_encoder=False,
    eval_metric='logloss',
    random_state=42,
    n_jobs=-1           # use all CPU cores
)

model.fit(
    X_train_scaled, y_train,
    eval_set=[(X_test_scaled, y_test)],
    verbose=50           # prints loss every 50 rounds
)

print("\nTraining complete.")

print("\n" + "=" * 50)
print("STEP 5: Evaluating model...")
print("=" * 50)

y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
y_pred       = model.predict(X_test_scaled)

auc      = roc_auc_score(y_test, y_pred_proba)
accuracy = accuracy_score(y_test, y_pred)

print(f"\nAUC-ROC Score : {auc:.4f}  (target: > 0.75)")
print(f"Accuracy      : {accuracy:.4f}")
print(f"\nClassification Report:")
print(classification_report(y_test, y_pred))
print(f"Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\n" + "=" * 50)
print("STEP 6: Saving model and scaler...")
print("=" * 50)

os.makedirs("ml/saved_models", exist_ok=True)

joblib.dump(model,  "ml/saved_models/click_model_v1.pkl")
joblib.dump(scaler, "ml/saved_models/scaler.pkl")

# Save feature column names
# (important — API must use same column order)
feature_columns = list(X.columns)
joblib.dump(feature_columns, "ml/saved_models/feature_columns.pkl")

print("Saved: ml/saved_models/click_model_v1.pkl")
print("Saved: ml/saved_models/scaler.pkl")
print("Saved: ml/saved_models/feature_columns.pkl")

print("\n" + "=" * 50)
print("STEP 7: Feature Importance (Top 10)")
print("=" * 50)

importance = model.feature_importances_
feature_importance = sorted(
    zip(feature_columns, importance),
    key=lambda x: x[1],
    reverse=True
)[:10]

for rank, (feature, score) in enumerate(feature_importance, 1):
    print(f"  {rank:2}. {feature:<35} {score:.4f}")

print("\n ALL DONE — Model training complete!")
print(f"    Model saved at: ml/saved_models/click_model_v1.pkl")
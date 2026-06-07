import pandas as pd
import numpy as np
import joblib
import matplotlib
matplotlib.use('Agg')            # no display needed
import matplotlib.pyplot as plt
from sklearn.metrics import (
    roc_auc_score,
    roc_curve,
    confusion_matrix,
    classification_report,
    ConfusionMatrixDisplay
)
from sklearn.model_selection import train_test_split
import os

print("=" * 50)
print("Loading model and data for evaluation...")
print("=" * 50)

model           = joblib.load("ml/saved_models/click_model_v1.pkl")
scaler          = joblib.load("ml/saved_models/scaler.pkl")
feature_columns = joblib.load("ml/saved_models/feature_columns.pkl")

df = pd.read_csv("ml/data/processed/clean_data.csv")

X = df[feature_columns]
y = df['Clicked on Ad']

_, X_test, _, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

X_test_scaled = scaler.transform(X_test)

y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
y_pred       = model.predict(X_test_scaled)

print(f"\nAUC-ROC : {roc_auc_score(y_test, y_pred_proba):.4f}")
print(f"\nClassification Report:")
print(classification_report(y_test, y_pred))

os.makedirs("ml/reports", exist_ok=True)

# ── Plot 1: ROC Curve ──────────────────────────────────────
fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
plt.figure(figsize=(8, 6))
plt.plot(fpr, tpr, color='blue',
         label=f'AUC = {roc_auc_score(y_test, y_pred_proba):.4f}')
plt.plot([0, 1], [0, 1], 'k--')
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('ROC Curve — Click Prediction Model')
plt.legend()
plt.tight_layout()
plt.savefig("ml/reports/roc_curve.png")
print("\nSaved: ml/reports/roc_curve.png")

# ── Plot 2: Confusion Matrix ───────────────────────────────
cm = confusion_matrix(y_test, y_pred)
disp = ConfusionMatrixDisplay(confusion_matrix=cm,
                               display_labels=["No Click", "Click"])
disp.plot(cmap='Blues')
plt.title('Confusion Matrix — Click Prediction Model')
plt.tight_layout()
plt.savefig("ml/reports/confusion_matrix.png")
print("Saved: ml/reports/confusion_matrix.png")

# ── Plot 3: Feature Importance ─────────────────────────────
importance = model.feature_importances_
feat_imp = sorted(
    zip(feature_columns, importance),
    key=lambda x: x[1], reverse=True
)[:10]

features, scores = zip(*feat_imp)
plt.figure(figsize=(10, 6))
plt.barh(features[::-1], scores[::-1], color='steelblue')
plt.xlabel('Importance Score')
plt.title('Top 10 Feature Importances — XGBoost')
plt.tight_layout()
plt.savefig("ml/reports/feature_importance.png")
print("Saved: ml/reports/feature_importance.png")

print("\n Evaluation complete. Check ml/reports/ folder.")
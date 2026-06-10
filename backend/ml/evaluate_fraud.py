import pandas as pd
import numpy as np
import joblib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.metrics import (
    roc_auc_score,
    roc_curve,
    confusion_matrix,
    classification_report,
    ConfusionMatrixDisplay,
    precision_recall_curve
)
from sklearn.model_selection import train_test_split
import os

print("=" * 55)
print("Loading models and data...")
print("=" * 55)

xgb_model        = joblib.load("ml/saved_models/fraud_xgboost.pkl")
isolation_forest  = joblib.load("ml/saved_models/isolation_forest.pkl")
scaler           = joblib.load("ml/saved_models/fraud_scaler.pkl")
feature_columns  = joblib.load("ml/saved_models/fraud_feature_columns.pkl")

df = pd.read_csv("ml/data/processed/clean_fraud_data.csv")
X  = df[feature_columns]
y  = df['is_attributed']

_, X_test, _, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

X_test_scaled = scaler.transform(X_test)
y_pred_proba  = xgb_model.predict_proba(X_test_scaled)[:, 1]
y_pred        = xgb_model.predict(X_test_scaled)

auc = roc_auc_score(y_test, y_pred_proba)
print(f"\nXGBoost AUC-ROC: {auc:.4f}")
print(f"\nClassification Report:")
print(classification_report(y_test, y_pred,
      target_names=['Clean', 'Fraud']))

os.makedirs("ml/reports", exist_ok=True)

# ── Plot 1: ROC Curve ──────────────────────────────────────
fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
plt.figure(figsize=(8, 6))
plt.plot(fpr, tpr, color='crimson', linewidth=2,
         label=f'XGBoost AUC = {auc:.4f}')
plt.plot([0, 1], [0, 1], 'k--', label='Random Classifier')
plt.fill_between(fpr, tpr, alpha=0.1, color='crimson')
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('ROC Curve — Fraud Detection Model (TalkingData)')
plt.legend()
plt.grid(alpha=0.3)
plt.tight_layout()
plt.savefig("ml/reports/fraud_roc_curve.png", dpi=150)
print("Saved: ml/reports/fraud_roc_curve.png")

# ── Plot 2: Confusion Matrix ───────────────────────────────
cm = confusion_matrix(y_test, y_pred)
disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=["Clean", "Fraud"]
)
disp.plot(cmap='Reds')
plt.title('Confusion Matrix — Fraud Detection Model')
plt.tight_layout()
plt.savefig("ml/reports/fraud_confusion_matrix.png", dpi=150)
print("Saved: ml/reports/fraud_confusion_matrix.png")

# ── Plot 3: Feature Importance ─────────────────────────────
importance = xgb_model.feature_importances_
feat_imp   = sorted(
    zip(feature_columns, importance),
    key=lambda x: x[1], reverse=True
)
features, scores = zip(*feat_imp)

plt.figure(figsize=(10, 6))
colors = ['crimson' if s > 0.1 else 'salmon' for s in scores]
plt.barh(features[::-1], scores[::-1], color=colors[::-1])
plt.xlabel('Importance Score')
plt.title('Feature Importances — Fraud XGBoost (TalkingData)')
plt.grid(axis='x', alpha=0.3)
plt.tight_layout()
plt.savefig("ml/reports/fraud_feature_importance.png", dpi=150)
print("Saved: ml/reports/fraud_feature_importance.png")

# ── Plot 4: Precision-Recall Curve ────────────────────────
# More useful than ROC when data is imbalanced
precision, recall, thresholds = precision_recall_curve(
    y_test, y_pred_proba
)
plt.figure(figsize=(8, 6))
plt.plot(recall, precision, color='crimson', linewidth=2)
plt.xlabel('Recall (Fraud Caught)')
plt.ylabel('Precision (Accuracy of Fraud Flags)')
plt.title('Precision-Recall Curve — Fraud Detection')
plt.grid(alpha=0.3)
plt.tight_layout()
plt.savefig("ml/reports/fraud_precision_recall.png", dpi=150)
print("Saved: ml/reports/fraud_precision_recall.png")

# ── Plot 5: Fraud Score Distribution ──────────────────────
plt.figure(figsize=(10, 5))
plt.hist(y_pred_proba[y_test == 0], bins=50,
         alpha=0.6, color='steelblue', label='Clean')
plt.hist(y_pred_proba[y_test == 1], bins=50,
         alpha=0.6, color='crimson',   label='Fraud')
plt.xlabel('Predicted Fraud Probability')
plt.ylabel('Count')
plt.title('Fraud Score Distribution — Clean vs Fraud')
plt.legend()
plt.axvline(x=0.5, color='black', linestyle='--',
            label='Decision threshold')
plt.grid(alpha=0.3)
plt.tight_layout()
plt.savefig("ml/reports/fraud_score_distribution.png", dpi=150)
print("Saved: ml/reports/fraud_score_distribution.png")

print(f"\n Evaluation complete.")
print(f"    Final AUC-ROC: {auc:.4f}")
print(f"    Reports saved in: ml/reports/")
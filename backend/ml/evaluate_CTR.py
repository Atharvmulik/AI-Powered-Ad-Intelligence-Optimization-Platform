"""
evaluate_CTR.py
===========
PURPOSE : Comprehensive evaluation of all trained CTR models.
          Run AFTER train.py has completed.

COVERS:
  1. Load all three trained models
  2. Evaluate on held-out TEST set (never seen during training)
  3. AUC-ROC, Log Loss, Precision, Recall, F1, Confusion Matrix
  4. Feature Importance (XGBoost + LightGBM)
  5. SHAP Explainability — why did the model predict this click probability?
  6. Calibration check — are predicted probabilities trustworthy?
  7. Save all plots to ml/plots/
"""

import numpy as np
import pandas as pd
import joblib
import os
import warnings
import matplotlib
matplotlib.use("Agg")   # Non-interactive backend — saves files without display
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
warnings.filterwarnings("ignore")

from sklearn.metrics import (
    roc_auc_score, log_loss, precision_score, recall_score,
    f1_score, confusion_matrix, roc_curve, precision_recall_curve,
    average_precision_score, classification_report
)
import xgboost as xgb
import lightgbm as lgb
import shap

# ── CONFIG ────────────────────────────────────────────────────────────────────
DATA_PATH     = "ml/data/processed_splits.npz"
ARTIFACTS_DIR = "ml/save_model"
PLOTS_DIR     = "ml/plots"
SHAP_SAMPLE   = 5_000   # SHAP on 5K test samples (full test set is too slow)
os.makedirs(PLOTS_DIR, exist_ok=True)
# ─────────────────────────────────────────────────────────────────────────────


# ── LOAD ──────────────────────────────────────────────────────────────────────
def load_everything():
    print("=" * 65)
    print("  LOADING MODELS AND TEST DATA")
    print("=" * 65)

    data    = np.load(DATA_PATH)
    X_test  = data["X_test"]
    y_test  = data["y_test"]
    print(f"\n  Test set : {X_test.shape}  |  CTR={y_test.mean()*100:.2f}%")

    # Load models
    lr_model  = joblib.load(f"{ARTIFACTS_DIR}/lr_model.pkl")
    lr_scaler = joblib.load(f"{ARTIFACTS_DIR}/lr_scaler.pkl")
    xgb_model = joblib.load(f"{ARTIFACTS_DIR}/xgb_model.pkl")
    lgb_model = lgb.Booster(model_file=f"{ARTIFACTS_DIR}/lgb_model.txt")
    feat_cols = joblib.load(f"{ARTIFACTS_DIR}/feature_cols.pkl")

    print(f"  ✅  LR model     loaded")
    print(f"  ✅  XGBoost      loaded")
    print(f"  ✅  LightGBM     loaded")
    print(f"  ✅  Feature cols  {len(feat_cols)} features")

    return X_test, y_test, lr_model, lr_scaler, xgb_model, lgb_model, feat_cols


# ── SECTION 1: FULL METRICS TABLE ─────────────────────────────────────────────
def evaluate_all_models(X_test, y_test,
                        lr_model, lr_scaler, xgb_model, lgb_model):
    print("\n" + "=" * 65)
    print("  SECTION 1 — Full Metrics on Test Set")
    print("=" * 65)

    # Predictions
    X_test_scaled  = lr_scaler.transform(X_test)
    lr_proba       = lr_model.predict_proba(X_test_scaled)[:, 1]
    xgb_proba      = xgb_model.predict_proba(X_test)[:, 1]
    lgb_proba      = lgb_model.predict(X_test)

    # Optimal threshold (default 0.5 is wrong for imbalanced data)
    # Find threshold that maximises F1 on test set
    def best_threshold(y_true, y_proba):
        precisions, recalls, thresholds = precision_recall_curve(y_true, y_proba)
        f1s = 2 * precisions * recalls / (precisions + recalls + 1e-9)
        return thresholds[np.argmax(f1s[:-1])]

    results = {}
    for name, proba in [("Logistic Regression", lr_proba),
                         ("XGBoost",             xgb_proba),
                         ("LightGBM",            lgb_proba)]:
        thr   = best_threshold(y_test, proba)
        preds = (proba >= thr).astype(int)
        results[name] = {
            "proba"    : proba,
            "preds"    : preds,
            "threshold": thr,
            "auc"      : roc_auc_score(y_test, proba),
            "logloss"  : log_loss(y_test, proba),
            "precision": precision_score(y_test, preds, zero_division=0),
            "recall"   : recall_score(y_test, preds, zero_division=0),
            "f1"       : f1_score(y_test, preds, zero_division=0),
            "ap"       : average_precision_score(y_test, proba),
        }

    # Print table
    metrics = ["auc", "logloss", "precision", "recall", "f1", "ap"]
    header  = f"  {'Model':<22} {'AUC':>7} {'LogLoss':>9} {'Prec':>7} {'Rec':>7} {'F1':>7} {'AP':>7}"
    print(f"\n{header}")
    print("  " + "─" * 68)
    for name, m in results.items():
        row = (f"  {name:<22} {m['auc']:>7.4f} {m['logloss']:>9.4f} "
               f"{m['precision']:>7.4f} {m['recall']:>7.4f} "
               f"{m['f1']:>7.4f} {m['ap']:>7.4f}")
        print(row)

    print(f"\n  PRD target: AUC > 0.78  |  Best model should meet this.")
    print(f"\n  Metric glossary:")
    print(f"  AUC     — overall ranking ability (main metric)")
    print(f"  LogLoss — probability calibration quality")
    print(f"  Prec    — of predicted clicks, how many were real?")
    print(f"  Rec     — of real clicks, how many did we catch?")
    print(f"  F1      — harmonic mean of precision and recall")
    print(f"  AP      — area under precision-recall curve")

    return results


# ── SECTION 2: ROC CURVE PLOT ─────────────────────────────────────────────────
def plot_roc_curves(y_test, results):
    print("\n" + "=" * 65)
    print("  SECTION 2 — ROC Curves")
    print("=" * 65)

    colors = {"Logistic Regression": "#6366f1",
              "XGBoost":             "#f59e0b",
              "LightGBM":            "#22c55e"}

    fig, ax = plt.subplots(figsize=(8, 6))

    for name, m in results.items():
        fpr, tpr, _ = roc_curve(y_test, m["proba"])
        ax.plot(fpr, tpr, label=f"{name}  (AUC={m['auc']:.4f})",
                color=colors[name], linewidth=2)

    ax.plot([0, 1], [0, 1], "k--", linewidth=1, label="Random (AUC=0.50)")
    ax.axvline(x=0.1, color="gray", linestyle=":", alpha=0.5)
    ax.set_xlabel("False Positive Rate", fontsize=12)
    ax.set_ylabel("True Positive Rate", fontsize=12)
    ax.set_title("ROC Curves — CTR Click Prediction Models", fontsize=13, pad=14)
    ax.legend(loc="lower right", fontsize=10)
    ax.spines[["top", "right"]].set_visible(False)
    ax.set_xlim([0, 1])
    ax.set_ylim([0, 1.02])

    plt.tight_layout()
    out = f"{PLOTS_DIR}/roc_curves.png"
    plt.savefig(out, dpi=130, bbox_inches="tight")
    plt.close()
    print(f"  📊 Saved → {out}")


# ── SECTION 3: CONFUSION MATRICES ────────────────────────────────────────────
def plot_confusion_matrices(y_test, results):
    print("\n" + "=" * 65)
    print("  SECTION 3 — Confusion Matrices")
    print("=" * 65)

    fig, axes = plt.subplots(1, 3, figsize=(15, 4))

    for ax, (name, m) in zip(axes, results.items()):
        cm      = confusion_matrix(y_test, m["preds"])
        tn, fp, fn, tp = cm.ravel()

        im = ax.imshow(cm, cmap="Blues")
        ax.set_xticks([0, 1]); ax.set_yticks([0, 1])
        ax.set_xticklabels(["Pred: No Click", "Pred: Click"])
        ax.set_yticklabels(["True: No Click", "True: Click"])
        ax.set_title(f"{name}\nAUC={m['auc']:.4f}", fontsize=10, pad=8)

        for (i, j), val in np.ndenumerate(cm):
            ax.text(j, i, f"{val:,}", ha="center", va="center",
                    fontsize=10,
                    color="white" if val > cm.max() / 2 else "black")

        print(f"\n  {name}:")
        print(f"    True  Positives (TP) : {tp:>8,}  — real clicks caught")
        print(f"    False Positives (FP) : {fp:>8,}  — non-clicks predicted as click")
        print(f"    True  Negatives (TN) : {tn:>8,}  — non-clicks correctly ignored")
        print(f"    False Negatives (FN) : {fn:>8,}  — real clicks missed")

    plt.tight_layout()
    out = f"{PLOTS_DIR}/confusion_matrices.png"
    plt.savefig(out, dpi=130, bbox_inches="tight")
    plt.close()
    print(f"\n  📊 Saved → {out}")


# ── SECTION 4: FEATURE IMPORTANCE ────────────────────────────────────────────
def plot_feature_importance(xgb_model, lgb_model, feat_cols):
    print("\n" + "=" * 65)
    print("  SECTION 4 — Feature Importance (XGBoost + LightGBM)")
    print("=" * 65)

    fig, axes = plt.subplots(1, 2, figsize=(16, 7))

    # XGBoost importance
    xgb_imp = pd.Series(
        xgb_model.feature_importances_, index=feat_cols
    ).sort_values(ascending=True).tail(20)

    axes[0].barh(xgb_imp.index, xgb_imp.values, color="#f59e0b", alpha=0.85)
    axes[0].set_title("XGBoost — Top 20 Feature Importances", fontsize=11)
    axes[0].set_xlabel("Importance Score")
    axes[0].spines[["top", "right"]].set_visible(False)

    # LightGBM importance
    lgb_imp = pd.Series(
        lgb_model.feature_importance(importance_type="gain"),
        index=feat_cols
    ).sort_values(ascending=True).tail(20)

    axes[1].barh(lgb_imp.index, lgb_imp.values, color="#22c55e", alpha=0.85)
    axes[1].set_title("LightGBM — Top 20 Feature Importances (Gain)", fontsize=11)
    axes[1].set_xlabel("Gain")
    axes[1].spines[["top", "right"]].set_visible(False)

    plt.suptitle("Feature Importance — Which Signals Drive CTR Predictions?",
                 fontsize=13, y=1.01)
    plt.tight_layout()
    out = f"{PLOTS_DIR}/feature_importance.png"
    plt.savefig(out, dpi=130, bbox_inches="tight")
    plt.close()

    print(f"\n  Top 5 LightGBM features (by gain):")
    for feat, val in lgb_imp.tail(5).sort_values(ascending=False).items():
        print(f"    {feat:<20} gain={val:>10.1f}")
    print(f"\n  📊 Saved → {out}")


# ── SECTION 5: SHAP EXPLAINABILITY ───────────────────────────────────────────
def shap_analysis(lgb_model, X_test, feat_cols):
    """
    SHAP = SHapley Additive exPlanations

    For EACH prediction, SHAP tells you:
    'Feature X pushed the click probability UP by 0.15'
    'Feature Y pushed the click probability DOWN by 0.08'

    This is what the PRD requires:
    'Every ad recommendation must include a SHAP-based explanation'
    'Fraud scores must include top 3 contributing features'
    """
    print("\n" + "=" * 65)
    print("  SECTION 5 — SHAP Explainability (LightGBM)")
    print("=" * 65)
    print(f"\n  Computing SHAP on {SHAP_SAMPLE:,} test samples...")
    print("  (Full test set would take too long — sample is sufficient)\n")

    X_sample = X_test[:SHAP_SAMPLE]

    # TreeExplainer is fast for tree-based models
    explainer  = shap.TreeExplainer(lgb_model)
    shap_vals  = explainer.shap_values(X_sample)

    # LightGBM binary returns 2D array — take positive class
    if isinstance(shap_vals, list):
        shap_vals = shap_vals[1]

    # ── 5a. Summary Bar Plot (global feature importance by SHAP)
    fig, ax = plt.subplots(figsize=(10, 7))
    shap.summary_plot(
        shap_vals, X_sample,
        feature_names=feat_cols,
        plot_type="bar",
        max_display=20,
        show=False,
    )
    plt.title("SHAP Feature Importance — Mean |SHAP Value| per Feature",
              fontsize=12, pad=12)
    plt.tight_layout()
    out1 = f"{PLOTS_DIR}/shap_importance.png"
    plt.savefig(out1, dpi=130, bbox_inches="tight")
    plt.close()
    print(f"  📊 SHAP bar plot saved → {out1}")

    # ── 5b. SHAP Beeswarm Plot (direction + magnitude)
    fig, ax = plt.subplots(figsize=(10, 7))
    shap.summary_plot(
        shap_vals, X_sample,
        feature_names=feat_cols,
        max_display=20,
        show=False,
    )
    plt.title("SHAP Beeswarm — Feature Impact Direction on Click Probability",
              fontsize=12, pad=12)
    plt.tight_layout()
    out2 = f"{PLOTS_DIR}/shap_beeswarm.png"
    plt.savefig(out2, dpi=130, bbox_inches="tight")
    plt.close()
    print(f"  📊 SHAP beeswarm  saved → {out2}")

    # ── 5c. Single prediction explanation (for the dashboard demo)
    print(f"\n  Example: SHAP explanation for 1 prediction")
    print(f"  {'─'*50}")
    sample_shap = shap_vals[0]
    base_val    = explainer.expected_value
    if isinstance(base_val, (list, np.ndarray)):
        base_val = base_val[1] if len(base_val) > 1 else base_val[0]

    top_features = pd.Series(sample_shap, index=feat_cols) \
                     .abs() \
                     .sort_values(ascending=False) \
                     .head(5)

    print(f"  Base click probability (dataset average): {base_val:.4f}")
    print(f"\n  Top 5 features driving THIS prediction:")
    for feat in top_features.index:
        val       = sample_shap[feat_cols.index(feat)]
        direction = "↑ increases" if val > 0 else "↓ decreases"
        print(f"    {feat:<20}  SHAP={val:+.4f}  → {direction} click probability")

    # Save SHAP values for later use in FastAPI
    np.save(f"{ARTIFACTS_DIR}/shap_sample_values.npy", shap_vals[:100])
    joblib.dump(float(base_val), f"{ARTIFACTS_DIR}/shap_base_value.pkl")
    print(f"\n  💾 SHAP values (100 samples) saved → {ARTIFACTS_DIR}/")


# ── SECTION 6: CALIBRATION PLOT ──────────────────────────────────────────────
def plot_calibration(y_test, results):
    print("\n" + "=" * 65)
    print("  SECTION 6 — Probability Calibration")
    print("=" * 65)
    print("  Are the predicted probabilities trustworthy?")
    print("  A well-calibrated model: P(click)=0.8 should click ~80% of time.\n")

    fig, ax = plt.subplots(figsize=(7, 6))
    colors  = {"Logistic Regression": "#6366f1",
               "XGBoost":             "#f59e0b",
               "LightGBM":            "#22c55e"}

    for name, m in results.items():
        # Bin predictions into 10 buckets, plot mean predicted vs mean actual
        df_cal = pd.DataFrame({"proba": m["proba"], "actual": y_test})
        df_cal["bin"] = pd.cut(df_cal["proba"], bins=10, labels=False)
        cal = df_cal.groupby("bin").agg(
            mean_pred=("proba", "mean"),
            mean_actual=("actual", "mean")
        ).dropna()
        ax.plot(cal["mean_pred"], cal["mean_actual"],
                marker="o", label=name, color=colors[name], linewidth=2)

    ax.plot([0, 1], [0, 1], "k--", label="Perfect calibration", linewidth=1)
    ax.set_xlabel("Mean Predicted Probability")
    ax.set_ylabel("Mean Actual Click Rate")
    ax.set_title("Calibration Curve — Predicted vs Actual Click Probability",
                 fontsize=12, pad=12)
    ax.legend(fontsize=9)
    ax.spines[["top", "right"]].set_visible(False)
    plt.tight_layout()
    out = f"{PLOTS_DIR}/calibration.png"
    plt.savefig(out, dpi=130, bbox_inches="tight")
    plt.close()
    print(f"  📊 Saved → {out}")
    print("  Closer to diagonal = better calibrated = more trustworthy probabilities")


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    X_test, y_test, \
    lr_model, lr_scaler, \
    xgb_model, lgb_model, \
    feat_cols = load_everything()

    results = evaluate_all_models(
        X_test, y_test, lr_model, lr_scaler, xgb_model, lgb_model)

    plot_roc_curves(y_test, results)
    plot_confusion_matrices(y_test, results)
    plot_feature_importance(xgb_model, lgb_model, feat_cols)
    shap_analysis(lgb_model, X_test, feat_cols)
    plot_calibration(y_test, results)

    print(f"\n{'='*65}")
    print(f"  ✅  EVALUATION COMPLETE")
    print(f"{'='*65}")
    print(f"\n  All plots saved to {PLOTS_DIR}/:")
    print(f"    roc_curves.png")
    print(f"    confusion_matrices.png")
    print(f"    feature_importance.png")
    print(f"    shap_importance.png")
    print(f"    shap_beeswarm.png")
    print(f"    calibration.png")
    print(f"\n  All artifacts saved to {ARTIFACTS_DIR}/:")
    print(f"    lgb_model.txt          ← primary model for FastAPI")
    print(f"    xgb_model.pkl")
    print(f"    lr_model.pkl + scaler")
    print(f"    freq_maps.pkl          ← categorical encoder")
    print(f"    num_medians.pkl        ← missing value filler")
    print(f"    feature_cols.pkl       ← feature order for inference")
    print(f"    shap_base_value.pkl    ← for SHAP explanations in API")
    print(f"\n➡️   Next step: python ml/inference_pipeline.py  (FastAPI prep)")


if __name__ == "__main__":
    main()
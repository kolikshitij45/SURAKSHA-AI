"""
ML Model Training Pipeline for Suraksha-AI
Trains:
1. Flood Crest Regressor (predicts 24-hr downstream river water level in meters)
2. Hazard Tier Classifier (classifies disaster severity into Normal, Alert, Warning, Severe)
Saves model artifacts and performance metrics for the Agent and Backend.
"""

import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.metrics import (
    mean_absolute_error,
    root_mean_squared_error,
    r2_score,
    accuracy_score,
    precision_recall_fscore_support,
    classification_report
)

from src.config import (
    REGRESSOR_MODEL_PATH,
    CLASSIFIER_MODEL_PATH,
    SCALER_PATH,
    MODEL_METADATA_PATH,
    HAZARD_TIERS
)
from src.feature_engineering import (
    prepare_training_features,
    FEATURE_COLUMNS,
    REGRESSION_TARGET,
    CLASSIFICATION_TARGET
)


def train_models():
    print("=" * 60)
    print("SURAKSHA-AI: ML MODEL TRAINING PIPELINE")
    print("=" * 60)

    # 1. Load data
    df = prepare_training_features(save_to_disk=True)

    X = df[FEATURE_COLUMNS]
    y_reg = df[REGRESSION_TARGET]
    y_clf = df[CLASSIFICATION_TARGET]

    # 2. Time-series Split (80% train, 20% test to prevent temporal data leakage)
    split_idx = int(len(df) * 0.80)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_reg_train, y_reg_test = y_reg.iloc[:split_idx], y_reg.iloc[split_idx:]
    y_clf_train, y_clf_test = y_clf.iloc[:split_idx], y_clf.iloc[split_idx:]

    print(f"[*] Training samples: {len(X_train)} | Test samples: {len(X_test)}")

    # 3. Feature Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # ----------------------------------------------------
    # 4. Train Flood Crest Regressor
    # ----------------------------------------------------
    print("\n[*] Training Flood Crest Level Regressor (RandomForestRegressor)...")
    regressor = RandomForestRegressor(
        n_estimators=150,
        max_depth=12,
        min_samples_split=4,
        random_state=42,
        n_jobs=-1
    )
    regressor.fit(X_train_scaled, y_reg_train)

    # Evaluate Regressor
    y_reg_pred = regressor.predict(X_test_scaled)
    mae = mean_absolute_error(y_reg_test, y_reg_pred)
    rmse = root_mean_squared_error(y_reg_test, y_reg_pred)
    r2 = r2_score(y_reg_test, y_reg_pred)

    print(f"   -> Regressor MAE:  {mae:.4f} meters")
    print(f"   -> Regressor RMSE: {rmse:.4f} meters")
    print(f"   -> Regressor R2:   {r2:.4f}")

    # ----------------------------------------------------
    # 5. Train Hazard Tier Classifier
    # ----------------------------------------------------
    print("\n[*] Training Hazard Tier Classifier (GradientBoostingClassifier)...")
    classifier = GradientBoostingClassifier(
        n_estimators=120,
        learning_rate=0.08,
        max_depth=5,
        random_state=42
    )
    classifier.fit(X_train_scaled, y_clf_train)

    # Evaluate Classifier
    y_clf_pred = classifier.predict(X_test_scaled)
    acc = accuracy_score(y_clf_test, y_clf_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_clf_test, y_clf_pred, average="weighted", zero_division=0
    )

    print(f"   -> Classifier Accuracy: {acc * 100:.2f}%")
    print(f"   -> Weighted Precision:   {precision:.4f}")
    print(f"   -> Weighted Recall:      {recall:.4f}")
    print(f"   -> Weighted F1-Score:    {f1:.4f}")

    print("\n[*] Detailed Classification Report:")
    target_names = [HAZARD_TIERS[i]["name"] for i in sorted(np.unique(y_clf))]
    print(classification_report(y_clf_test, y_clf_pred, target_names=target_names, zero_division=0))

    # Feature Importance analysis
    feature_importances = dict(zip(FEATURE_COLUMNS, [round(float(v), 4) for v in regressor.feature_importances_]))
    top_features = sorted(feature_importances.items(), key=lambda x: x[1], reverse=True)[:5]
    print(f"\n[*] Top 5 Hydrological Predictors: {top_features}")

    # ----------------------------------------------------
    # 6. Save Model Artifacts
    # ----------------------------------------------------
    joblib.dump(regressor, REGRESSOR_MODEL_PATH)
    joblib.dump(classifier, CLASSIFIER_MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    metrics = {
        "regressor": {
            "model_type": "RandomForestRegressor",
            "mae_meters": round(float(mae), 4),
            "rmse_meters": round(float(rmse), 4),
            "r2_score": round(float(r2), 4)
        },
        "classifier": {
            "model_type": "GradientBoostingClassifier",
            "accuracy": round(float(acc), 4),
            "weighted_precision": round(float(precision), 4),
            "weighted_recall": round(float(recall), 4),
            "weighted_f1": round(float(f1), 4)
        },
        "top_features": top_features,
        "features_list": FEATURE_COLUMNS
    }

    with open(MODEL_METADATA_PATH, "w") as f:
        json.dump(metrics, f, indent=4)

    print(f"\n[OK] Saved artifacts to {REGRESSOR_MODEL_PATH}, {CLASSIFIER_MODEL_PATH}, and {SCALER_PATH}")
    print(f"[OK] Metadata saved to {MODEL_METADATA_PATH}")
    print("=" * 60)
    return metrics


if __name__ == "__main__":
    train_models()

import pandas as pd
import numpy as np
import joblib
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error
import warnings
warnings.filterwarnings('ignore')

print("=" * 60)
print("  RECOMMENDATION ENGINE — Training Pipeline")
print("=" * 60)

# ─────────────────────────────────────────────────────────────
# STEP 1: Load all 3 datasets
# ─────────────────────────────────────────────────────────────
print("\nSTEP 1: Loading all 3 datasets...")
print("-" * 40)

users   = pd.read_csv("ml/data/synthetic/user_profiles.csv")
ads     = pd.read_csv("ml/data/synthetic/ad_catalogue.csv")
history = pd.read_csv("ml/data/synthetic/interaction_history.csv")

print(f"user_profiles.csv   → {users.shape[0]} rows, {users.shape[1]} columns")
print(f"ad_catalogue.csv    → {ads.shape[0]} rows, {ads.shape[1]} columns")
print(f"interaction_history → {history.shape[0]} rows, {history.shape[1]} columns")

print(f"\nUser columns    : {list(users.columns)}")
print(f"Ad columns      : {list(ads.columns)}")
print(f"History columns : {list(history.columns)}")

print(f"\nLabel distributions:")
print(f"  primary_interest  : {users['primary_interest'].value_counts().to_dict()}")
print(f"  ad categories     : {ads['category'].value_counts().to_dict()}")
print(f"  interaction_types : {history['interaction_type'].value_counts().to_dict()}")
print(f"  fraud count       : {history['was_fraud'].sum()} / {len(history)}")

# ─────────────────────────────────────────────────────────────
# STEP 2: Clean data
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 2: Cleaning data...")
print("-" * 40)

# Remove fraud interactions — never train recommendations on fake clicks
fraud_before = history['was_fraud'].sum()
history = history[history['was_fraud'] == 0].copy()
print(f"Removed fraud interactions : {fraud_before} rows removed")

# Keep only active ads
inactive_ads    = ads[ads['is_active'] == 0]['ad_id'].tolist()
ads_active      = ads[ads['is_active'] == 1].copy().reset_index(drop=True)
history         = history[~history['ad_id'].isin(inactive_ads)].copy()
print(f"Removed inactive ads       : {len(inactive_ads)} ads removed")
print(f"Clean history rows         : {len(history)}")
print(f"Active ads remaining       : {len(ads_active)}")

# ─────────────────────────────────────────────────────────────
# STEP 3: Content-Based Filtering — TF-IDF on ad keywords
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 3: Content-Based Filtering (TF-IDF)...")
print("-" * 40)

# Build rich text for each ad
# keywords column in your data: "laptop,gaming,RGB,high-performance,RTX,desktop"
# Replace commas with spaces so TF-IDF treats them as separate words
# Repeat category 3x to give it strongest weight in similarity
ads_active['content_text'] = (
    ads_active['category'] + " " +
    ads_active['category'] + " " +
    ads_active['category'] + " " +
    ads_active['keywords'].str.replace(",", " ", regex=False) + " " +
    ads_active['ad_name'].str.lower().str.replace(r'[^a-z0-9 ]', ' ', regex=True) + " " +
    ads_active['brand_name'].str.lower()
)

print("Sample content_text for first 3 ads:")
for _, row in ads_active.head(3).iterrows():
    print(f"  [{row['ad_id']}] {row['content_text'][:90]}...")

# Train TF-IDF vectorizer
tfidf = TfidfVectorizer(
    max_features=500,
    ngram_range=(1, 2),     # unigrams and bigrams
    stop_words='english',
    min_df=1,
    sublinear_tf=True       # dampens very frequent terms
)

ad_tfidf_matrix = tfidf.fit_transform(ads_active['content_text'])
print(f"\nTF-IDF matrix shape : {ad_tfidf_matrix.shape}")
print(f"Vocabulary size     : {len(tfidf.vocabulary_)}")

# Compute ad-to-ad cosine similarity matrix
# Used later to find similar ads for a given ad
ad_similarity_matrix = cosine_similarity(ad_tfidf_matrix)
print(f"Ad similarity matrix shape : {ad_similarity_matrix.shape}")

# Map each interest to keyword text
# Used to transform user interest → TF-IDF vector for matching
INTEREST_KEYWORDS = {
    "gaming":        "gaming laptop RGB console fps shooter esports graphics RTX GPU",
    "sports":        "sports football cricket running athletics shoes jersey tournament",
    "tech":          "technology software laptop smartphone gadget AI cloud SaaS hardware",
    "lifestyle":     "lifestyle wellness home decor premium luxury self-care relaxation",
    "finance":       "finance investment stock trading banking insurance portfolio wealth",
    "entertainment": "entertainment movie streaming music concert OTT show celebrity",
    "fashion":       "fashion clothing shoes accessories style outfit trendy brand",
    "travel":        "travel hotel flight vacation tourism destination adventure visa",
    "fitness":       "fitness gym workout nutrition protein supplement cardio training",
    "food":          "food restaurant delivery recipe cooking meal cuisine diet",
}

def get_content_scores(user_row, tfidf_model, ad_matrix):
    """
    Compute content-based similarity score for one user against all ads.
    Combines primary_interest (70%) and secondary_interest (30%).
    Returns numpy array of length = number of ads.
    """
    primary   = str(user_row.get('primary_interest', 'tech'))
    secondary = str(user_row.get('secondary_interest', 'lifestyle'))

    primary_text   = INTEREST_KEYWORDS.get(primary,   primary)
    secondary_text = INTEREST_KEYWORDS.get(secondary, secondary)

    # Weighted: primary gets mentioned twice more
    user_text = (
        primary_text + " " + primary_text + " " + secondary_text
    )

    user_vector = tfidf_model.transform([user_text])
    scores      = cosine_similarity(user_vector, ad_matrix).flatten()
    return scores

# Quick test
sample_user    = users.iloc[0]
content_scores = get_content_scores(sample_user, tfidf, ad_tfidf_matrix)
print(f"\nContent scores — User: {sample_user['user_id']} "
      f"| Interest: {sample_user['primary_interest']}")
top5 = content_scores.argsort()[::-1][:5]
for idx in top5:
    print(f"  {ads_active.iloc[idx]['ad_id']} | "
          f"{ads_active.iloc[idx]['category']:<15} | "
          f"{ads_active.iloc[idx]['ad_name'][:40]:<40} | "
          f"score={content_scores[idx]:.4f}")

# ─────────────────────────────────────────────────────────────
# STEP 4: Collaborative Filtering — SVD Matrix Factorization
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 4: Collaborative Filtering (SVD)...")
print("-" * 40)

# Weight each interaction by type + engagement_score
# conversion > click > impression
INTERACTION_WEIGHTS = {
    'conversion': 1.0,
    'click':      0.6,
    'impression': 0.2,
}

history['weighted_score'] = (
    history['interaction_type']
    .map(INTERACTION_WEIGHTS)
    .fillna(0.2)               # fallback for unknown types
    * history['engagement_score']
)

print(f"Weighted score stats:")
print(history['weighted_score'].describe().round(4))

# Aggregate: one score per (user_id, ad_id) pair
# If user interacted with same ad multiple times → take max
user_ad_agg = (
    history.groupby(['user_id', 'ad_id'])['weighted_score']
    .max()
    .reset_index()
)
print(f"\nUnique (user, ad) pairs : {len(user_ad_agg)}")

# Encode user and ad IDs to integer indices
user_encoder = LabelEncoder()
ad_encoder   = LabelEncoder()

user_ad_agg['user_idx'] = user_encoder.fit_transform(user_ad_agg['user_id'])
user_ad_agg['ad_idx']   = ad_encoder.fit_transform(user_ad_agg['ad_id'])

n_users = int(user_ad_agg['user_idx'].max()) + 1
n_ads   = int(user_ad_agg['ad_idx'].max())   + 1
print(f"Users in interaction data : {n_users}")
print(f"Ads in interaction data   : {n_ads}")

# Build dense user-item matrix
# Rows = users, Columns = ads, Values = weighted engagement score
user_item_matrix = np.zeros((n_users, n_ads))
for _, row in user_ad_agg.iterrows():
    user_item_matrix[int(row['user_idx']), int(row['ad_idx'])] = (
        row['weighted_score']
    )

sparsity = (user_item_matrix == 0).sum() / user_item_matrix.size * 100
print(f"User-Item matrix shape    : {user_item_matrix.shape}")
print(f"Matrix sparsity           : {sparsity:.1f}% "
      f"(high is normal — users see only a few ads each)")

# Train SVD
# Learns latent factors: hidden patterns linking users to ads
n_components = min(50, min(n_users, n_ads) - 1)
print(f"\nTraining SVD with {n_components} latent components...")

svd = TruncatedSVD(
    n_components=n_components,
    n_iter=20,
    random_state=42
)

user_factors = svd.fit_transform(user_item_matrix)  # (n_users, n_components)
ad_factors   = svd.components_.T                     # (n_ads,   n_components)

explained_var = svd.explained_variance_ratio_.sum()
print(f"Explained variance        : {explained_var*100:.1f}%")
print(f"User factors shape        : {user_factors.shape}")
print(f"Ad factors shape          : {ad_factors.shape}")

# Reconstruct full predicted score matrix
predicted_matrix = np.dot(user_factors, svd.components_)

# Evaluate on known interactions
actual, predicted = [], []
for _, row in user_ad_agg.iterrows():
    actual.append(row['weighted_score'])
    predicted.append(predicted_matrix[int(row['user_idx']),
                                       int(row['ad_idx'])])

rmse = np.sqrt(mean_squared_error(actual, predicted))
print(f"SVD RMSE on known pairs   : {rmse:.4f} (lower = better)")

def get_collab_scores(user_id, user_enc, ad_enc,
                       pred_matrix, ads_df):
    """
    Return collaborative filtering scores for a user for all ads.
    If user not in training data → cold start → return zeros.
    Zeros means content-based and bid amount will drive recommendation.
    """
    scores = np.zeros(len(ads_df))

    if user_id not in user_enc.classes_:
        return scores  # cold start — new user

    user_idx = user_enc.transform([user_id])[0]

    for i, ad_id in enumerate(ads_df['ad_id']):
        if ad_id in ad_enc.classes_:
            ad_idx    = ad_enc.transform([ad_id])[0]
            scores[i] = pred_matrix[user_idx, ad_idx]

    # Normalize to 0-1
    if scores.max() > 0:
        scores = (scores - scores.min()) / (scores.max() - scores.min())

    return scores

# Quick test
collab_scores = get_collab_scores(
    users.iloc[0]['user_id'],
    user_encoder, ad_encoder,
    predicted_matrix, ads_active
)
print(f"\nCollaborative scores — User: {users.iloc[0]['user_id']}")
top5 = collab_scores.argsort()[::-1][:5]
for idx in top5:
    print(f"  {ads_active.iloc[idx]['ad_id']} | "
          f"{ads_active.iloc[idx]['category']:<15} | "
          f"score={collab_scores[idx]:.4f}")

# ─────────────────────────────────────────────────────────────
# STEP 5: Hybrid Scoring — Combine Both + Bid Amount
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 5: Hybrid Recommendation Engine...")
print("-" * 40)

# Scoring weights — must add up to 1.0
CONTENT_W = 0.45   # does ad match user interest?
COLLAB_W  = 0.35   # did similar users click this?
BID_W     = 0.20   # how much does advertiser pay?

def get_recommendations(user_id, top_n=5, exclude_ad_ids=None):
    """
    Full hybrid recommendation for one user.
    Returns list of top_n ads with scores + explanation.
    """
    exclude_ad_ids = exclude_ad_ids or []

    # Get user row
    user_rows = users[users['user_id'] == user_id]
    if len(user_rows) == 0:
        # Unknown user — return top ads by bid
        top_ads = ads_active.nlargest(top_n, 'bid_amount')
        return [{
            'ad_id':        row['ad_id'],
            'ad_name':      row['ad_name'],
            'category':     row['category'],
            'final_score':  0.5,
            'explanation':  'Top ad by revenue (new user)',
        } for _, row in top_ads.iterrows()]

    user_row = user_rows.iloc[0]

    # Score 1 — Content-based
    content_s = get_content_scores(user_row, tfidf, ad_tfidf_matrix)

    # Score 2 — Collaborative
    collab_s = get_collab_scores(
        user_id, user_encoder, ad_encoder,
        predicted_matrix, ads_active
    )

    # Score 3 — Bid amount (normalized 0-1)
    bid_vals  = ads_active['bid_amount'].values.astype(float)
    bid_s     = (bid_vals - bid_vals.min()) / (bid_vals.max() - bid_vals.min())

    # Combined score
    hybrid = (CONTENT_W * content_s) + (COLLAB_W * collab_s) + (BID_W * bid_s)

    results = []
    user_age = int(user_row.get('age', 25))

    for i, (_, ad_row) in enumerate(ads_active.iterrows()):
        # Skip excluded ads (already seen)
        if ad_row['ad_id'] in exclude_ad_ids:
            continue

        # Age filter — respect advertiser's target demographic
        if user_age < ad_row['target_age_min'] or \
           user_age > ad_row['target_age_max']:
            continue

        # Explanation: what drove this recommendation?
        if content_s[i] * CONTENT_W >= collab_s[i] * COLLAB_W:
            reason = (f"matches your interest in "
                      f"{user_row['primary_interest']}")
        else:
            reason = (f"users with similar behavior engaged "
                      f"with this ad")

        results.append({
            'ad_id':         ad_row['ad_id'],
            'ad_name':       ad_row['ad_name'],
            'category':      ad_row['category'],
            'brand':         ad_row['brand_name'],
            'ad_format':     ad_row['ad_format'],
            'bid_amount':    float(ad_row['bid_amount']),
            'final_score':   round(float(hybrid[i]), 4),
            'content_score': round(float(content_s[i]), 4),
            'collab_score':  round(float(collab_s[i]), 4),
            'bid_score':     round(float(bid_s[i]), 4),
            'explanation':   f"Recommended because it {reason}",
        })

    # Sort by final score descending
    results.sort(key=lambda x: x['final_score'], reverse=True)
    return results[:top_n]

# Test on one user from each major interest group
print("\nTesting recommendations across user interest groups:")
tested_interests = set()

for _, user_row in users.iterrows():
    interest = user_row['primary_interest']
    if interest in tested_interests:
        continue
    tested_interests.add(interest)

    recs = get_recommendations(user_row['user_id'], top_n=3)
    print(f"\n  User: {user_row['user_id']} | "
          f"Interest: {interest} | "
          f"Age: {user_row['age']} | "
          f"Device: {user_row['device_type']}")
    for rank, r in enumerate(recs, 1):
        print(f"    #{rank} {r['ad_id']} | "
              f"{r['category']:<15} | "
              f"score={r['final_score']:.4f} | "
              f"{r['ad_name'][:40]}")

    if len(tested_interests) >= 5:
        break

# ─────────────────────────────────────────────────────────────
# STEP 6: Save all models
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 6: Saving all models and artifacts...")
print("-" * 40)

os.makedirs("ml/saved_models", exist_ok=True)
os.makedirs("ml/data/processed", exist_ok=True)

# TF-IDF vectorizer (content-based model)
joblib.dump(tfidf,               "ml/saved_models/tfidf_vectorizer.pkl")
print("Saved: ml/saved_models/tfidf_vectorizer.pkl")

# Ad TF-IDF sparse matrix
joblib.dump(ad_tfidf_matrix,     "ml/saved_models/ad_tfidf_matrix.pkl")
print("Saved: ml/saved_models/ad_tfidf_matrix.pkl")

# Ad-to-ad cosine similarity matrix
joblib.dump(ad_similarity_matrix,"ml/saved_models/ad_similarity_matrix.pkl")
print("Saved: ml/saved_models/ad_similarity_matrix.pkl")

# SVD model (collaborative filter)
joblib.dump(svd,                 "ml/saved_models/svd_model.pkl")
print("Saved: ml/saved_models/svd_model.pkl")

# User and ad encoders
joblib.dump(user_encoder,        "ml/saved_models/user_encoder.pkl")
joblib.dump(ad_encoder,          "ml/saved_models/ad_encoder.pkl")
print("Saved: ml/saved_models/user_encoder.pkl")
print("Saved: ml/saved_models/ad_encoder.pkl")

# Full predicted score matrix (collaborative scores)
joblib.dump(predicted_matrix,    "ml/saved_models/predicted_score_matrix.pkl")
print("Saved: ml/saved_models/predicted_score_matrix.pkl")

# Interest → keyword mapping
joblib.dump(INTEREST_KEYWORDS,   "ml/saved_models/interest_keywords_map.pkl")
print("Saved: ml/saved_models/interest_keywords_map.pkl")

# Hybrid weights
WEIGHTS = {'content': CONTENT_W, 'collab': COLLAB_W, 'bid': BID_W}
joblib.dump(WEIGHTS,             "ml/saved_models/hybrid_weights.pkl")
print("Saved: ml/saved_models/hybrid_weights.pkl")

# Clean ads dataframe (used by FastAPI at runtime)
ads_active.to_csv("ml/data/processed/clean_ads.csv", index=False)
print("Saved: ml/data/processed/clean_ads.csv")

# ─────────────────────────────────────────────────────────────
# STEP 7: Final evaluation summary
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 7: Final Summary")
print("-" * 40)

print(f"\nModel Performance:")
print(f"  SVD RMSE               : {rmse:.4f}  (lower is better)")
print(f"  Explained variance     : {explained_var*100:.1f}%")
print(f"  SVD components        : {n_components}")

print(f"\nDataset Stats:")
print(f"  Total users           : {len(users)}")
print(f"  Total active ads      : {len(ads_active)}")
print(f"  Clean interactions    : {len(history)}")
print(f"  Unique user-ad pairs  : {len(user_ad_agg)}")
print(f"  Matrix sparsity       : {sparsity:.1f}%")

print(f"\nHybrid Weights:")
print(f"  Content-based (TF-IDF): {CONTENT_W*100:.0f}%")
print(f"  Collaborative (SVD)   : {COLLAB_W*100:.0f}%")
print(f"  Bid amount            : {BID_W*100:.0f}%")

print(f"\nTop SVD latent factors (explained variance):")
for i, var in enumerate(svd.explained_variance_ratio_[:8]):
    bar = "█" * int(var * 300)
    print(f"  Component {i+1:2}: {var:.4f}  {bar}")

print(f"\nFiles saved in ml/saved_models/:")
saved_files = [
    "tfidf_vectorizer.pkl       ← content-based model",
    "ad_tfidf_matrix.pkl        ← ad content vectors",
    "ad_similarity_matrix.pkl   ← ad-to-ad similarity",
    "svd_model.pkl              ← collaborative filter",
    "user_encoder.pkl           ← user ID encoder",
    "ad_encoder.pkl             ← ad ID encoder",
    "predicted_score_matrix.pkl ← collaborative scores",
    "interest_keywords_map.pkl  ← interest to keyword map",
    "hybrid_weights.pkl         ← scoring weights",
]
for f in saved_files:
    print(f"  {f}")

print("\n" + "=" * 60)
print("  ALL DONE — Recommendation model training complete!")
print("=" * 60)
print("\nNext step: Build app/services/recommend_service.py")
print("           which loads these pkl files and serves")
print("           recommendations via FastAPI endpoint.")
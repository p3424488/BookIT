import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.database import get_all_events, get_user_activity, get_all_bookings, get_user_bookings

# ─── CONTENT BASED FILTERING ─────────────────────────────
def content_based_recommendations(user_id: str, top_n: int = 5):
    """
    Recommends events similar to what the user has viewed/booked
    based on event features like category, city, language
    """
    try:
        events = get_all_events()
        if not events:
            return []

        # Create dataframe
        df = pd.DataFrame(events)

        # Create feature string for each event
        df['features'] = (
            df['category'].fillna('') + ' ' +
            df['city'].fillna('') + ' ' +
            df['language'].fillna('')
        )

        # TF-IDF vectorization
        tfidf = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf.fit_transform(df['features'])

        # Get user activity
        activity = get_user_activity(user_id)
        if not activity:
            # No activity — return popular events
            return [e['id'] for e in events[:top_n]]

        # Get events user has interacted with
        user_event_ids = list(set([a['eventId'] for a in activity]))

        # Find indices of user's events in our dataframe
        user_indices = df[df['id'].isin(user_event_ids)].index.tolist()
        if not user_indices:
            return [e['id'] for e in events[:top_n]]

        # Calculate similarity scores
        user_profile = tfidf_matrix[user_indices].mean(axis=0)
        user_profile_array = np.asarray(user_profile)
        similarity_scores = cosine_similarity(
            user_profile_array,
            tfidf_matrix.toarray()
        ).flatten()

        # Get top N most similar events
        # Exclude events user already interacted with
        similar_indices = similarity_scores.argsort()[::-1]
        recommendations = []
        for idx in similar_indices:
            event_id = df.iloc[idx]['id']
            if event_id not in user_event_ids:
                recommendations.append(event_id)
            if len(recommendations) >= top_n:
                break

        return recommendations

    except Exception as e:
        print(f"Content-based error: {e}")
        return []


# ─── COLLABORATIVE FILTERING ─────────────────────────────
def collaborative_recommendations(user_id: str, top_n: int = 5):
    """
    Recommends events that similar users have booked
    """
    try:
        bookings = get_all_bookings()
        if not bookings:
            return []

        # Create user-event matrix
        df = pd.DataFrame(bookings)
        if df.empty:
            return []

        # Pivot table — rows=users, columns=events, values=1 if booked
        matrix = df.pivot_table(
            index='userId',
            columns='eventId',
            aggfunc=len,
            fill_value=0
        )

        if user_id not in matrix.index:
            return []

        # Calculate user similarity
        user_similarity = cosine_similarity(matrix)
        user_sim_df = pd.DataFrame(
            user_similarity,
            index=matrix.index,
            columns=matrix.index
        )

        # Get similar users
        similar_users = user_sim_df[user_id].sort_values(
            ascending=False
        ).iloc[1:6].index.tolist()

        if not similar_users:
            return []

        # Get events booked by similar users
        user_booked = get_user_bookings(user_id)
        recommendations = []

        for similar_user in similar_users:
            similar_user_events = matrix.loc[similar_user]
            booked_events = similar_user_events[
                similar_user_events > 0
            ].index.tolist()

            for event_id in booked_events:
                if event_id not in user_booked and event_id not in recommendations:
                    recommendations.append(event_id)
                if len(recommendations) >= top_n:
                    break

        return recommendations[:top_n]

    except Exception as e:
        print(f"Collaborative error: {e}")
        return []


# ─── HYBRID RECOMMENDATIONS ──────────────────────────────
def hybrid_recommendations(user_id: str, top_n: int = 6):
    """
    Combines content-based and collaborative filtering
    60% content-based + 40% collaborative
    """
    try:
        content_recs = content_based_recommendations(user_id, top_n)
        collab_recs = collaborative_recommendations(user_id, top_n)

        # Combine with weights
        seen = set()
        combined = []

        # Add content-based first (60% weight — more reliable)
        for event_id in content_recs:
            if event_id not in seen:
                combined.append(event_id)
                seen.add(event_id)

        # Fill with collaborative recommendations
        for event_id in collab_recs:
            if event_id not in seen:
                combined.append(event_id)
                seen.add(event_id)

        # If still not enough — add any events
        if len(combined) < top_n:
            all_events = get_all_events()
            for event in all_events:
                if event['id'] not in seen:
                    combined.append(event['id'])
                    seen.add(event['id'])
                if len(combined) >= top_n:
                    break

        return combined[:top_n]

    except Exception as e:
        print(f"Hybrid error: {e}")
        return []
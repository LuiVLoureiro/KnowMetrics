"""
Analytics utility functions for performance prediction and retention analysis.
Uses Ebbinghaus forgetting curve and statistical models.
"""
import math
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional


def erf(x: float) -> float:
    """Compute error function using Abramowitz and Stegun approximation"""
    sign = 1 if x >= 0 else -1
    x = abs(x)
    
    a1, a2, a3, a4, a5 = 0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429
    p = 0.3275911
    
    t = 1.0 / (1.0 + p * x)
    y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * math.exp(-x * x)
    
    return sign * y


def normal_cdf(x: float) -> float:
    """Compute normal cumulative distribution function"""
    return 0.5 * (1 + erf(x / math.sqrt(2)))


def calculate_msle(actual: float, predicted: float) -> float:
    """Calculate Mean Squared Logarithmic Error"""
    return (math.log1p(actual) - math.log1p(predicted)) ** 2


def calculate_retention_rate(
    accuracy: float,
    hours_since_review: float,
    decay_constant: float = 0.0005
) -> float:
    """
    Calculate retention rate using Ebbinghaus forgetting curve.
    R(t) = p * e^(-λt)
    """
    return accuracy * math.exp(-decay_constant * hours_since_review)


def calculate_next_review(
    current_retention: float,
    target_retention: float = 0.85,
    decay_constant: float = 0.0005
) -> float:
    """Calculate hours until retention drops to target level"""
    if current_retention <= 0 or current_retention <= target_retention:
        return 0
    
    return -math.log(target_retention / current_retention) / decay_constant


def calculate_entropy(correct: int, total: int) -> float:
    """
    Calculate entropy (uncertainty/complexity) of a topic.
    Higher entropy = more uncertain performance.
    """
    if total == 0:
        return 0
    
    p_correct = max(0.01, min(0.99, correct / total))
    p_wrong = 1 - p_correct
    
    return -(p_correct * math.log2(p_correct) + p_wrong * math.log2(p_wrong))


def calculate_priority_index(entropy: float, exposures: int) -> float:
    """
    Calculate study priority index.
    Higher entropy and lower familiarity = higher priority.
    """
    if exposures == 0:
        return entropy * 2
    return entropy / exposures


def calculate_pass_probability(
    total_correct: int,
    total_questions: int,
    exam_questions: int,
    min_score: float,
    msle_adjustment: float = 0
) -> float:
    """
    Calculate probability of passing using normal distribution with continuity correction.
    """
    if total_questions == 0:
        return 0
    
    p = total_correct / total_questions
    mean = p * exam_questions
    variance = exam_questions * p * (1 - p)
    
    if variance <= 0:
        return 100.0 if mean >= min_score else 0.0
    
    stddev = math.sqrt(variance)
    z = ((min_score - 0.5) - mean) / stddev
    probability = (1 - normal_cdf(z)) * 100
    
    # Adjust for model error
    probability -= msle_adjustment * 100
    
    return max(0, min(100, probability))


def predict_performance(
    sessions_data: List[Dict],
    exam_questions: int,
    min_score: float
) -> Dict:
    """
    Predict performance based on historical session data.
    Returns prediction including pass probability and topic analysis.
    """
    if not sessions_data:
        return {
            "predicted_correct": 0,
            "predicted_time": "0s",
            "pass_probability": 0,
            "topics_retention": {},
            "study_schedule": []
        }
    
    total_correct = sum(s.get('correct', 0) for s in sessions_data)
    total_wrong = sum(s.get('wrong', 0) for s in sessions_data)
    total_questions = total_correct + total_wrong
    total_time = sum(s.get('time', 0) for s in sessions_data)
    
    if total_questions == 0:
        return {
            "predicted_correct": 0,
            "predicted_time": "0s",
            "pass_probability": 0,
            "topics_retention": {},
            "study_schedule": []
        }
    
    # Calculate accuracy and predictions
    accuracy = total_correct / total_questions
    predicted_correct = round(accuracy * exam_questions)
    avg_time_per_question = total_time / total_questions if total_questions > 0 else 0
    predicted_time = avg_time_per_question * exam_questions
    
    # Calculate MSLE for adjustment
    msle_sum = 0
    for session in sessions_data:
        s_correct = session.get('correct', 0)
        s_total = session.get('correct', 0) + session.get('wrong', 0)
        if s_total > 0:
            predicted = accuracy * s_total
            msle_sum += calculate_msle(s_correct, predicted)
    
    msle = msle_sum / len(sessions_data) if sessions_data else 0
    
    # Calculate pass probability
    pass_prob = calculate_pass_probability(
        total_correct, total_questions, exam_questions, min_score, msle / exam_questions
    )
    
    return {
        "predicted_correct": predicted_correct,
        "predicted_time": format_time(predicted_time),
        "pass_probability": pass_prob,
        "accuracy": accuracy * 100
    }


def analyze_topic_retention(
    topic_data: Dict,
    current_time: datetime
) -> Dict:
    """
    Analyze retention for a specific topic.
    """
    correct = topic_data.get('correct', 0)
    wrong = topic_data.get('wrong', 0)
    total = correct + wrong
    last_review = topic_data.get('last_review', current_time)
    exposures = topic_data.get('exposures', 1)
    
    if total == 0:
        return {
            "accuracy": 0,
            "retention_rate": 0,
            "exposures": exposures,
            "days_since_review": 0,
            "hours_until_review": 0,
            "priority_index": 0
        }
    
    accuracy = correct / total
    hours_diff = (current_time - last_review).total_seconds() / 3600
    days_diff = int(hours_diff / 24)
    
    retention = calculate_retention_rate(accuracy, hours_diff)
    entropy = calculate_entropy(correct, total)
    priority = calculate_priority_index(entropy, exposures)
    hours_until = calculate_next_review(retention)
    
    return {
        "accuracy": round(accuracy * 100, 1),
        "retention_rate": round(retention * 100, 1),
        "exposures": exposures,
        "days_since_review": days_diff,
        "hours_until_review": round(hours_until, 1),
        "priority_index": round(priority, 3)
    }


def generate_study_schedule(topics_analysis: List[Dict]) -> List[Dict]:
    """
    Generate prioritized study schedule based on retention analysis.
    """
    # Sort by priority (lower retention and higher priority first)
    sorted_topics = sorted(
        topics_analysis,
        key=lambda x: (x.get('retention_rate', 0), -x.get('priority_index', 0))
    )
    
    schedule = []
    for topic in sorted_topics:
        hours = topic.get('hours_until_review', 0)
        
        if hours <= 0:
            next_review = "Review now"
            priority = "High"
        elif hours < 24:
            next_review = f"In {int(hours)} hour{'s' if hours > 1 else ''}"
            priority = "Medium"
        else:
            days = int(hours / 24)
            next_review = f"In {days} day{'s' if days > 1 else ''}"
            priority = "Low"
        
        schedule.append({
            "topic": topic.get('topic', 'Unknown'),
            "retention_rate": topic.get('retention_rate', 0),
            "next_review": next_review,
            "priority": priority
        })
    
    return schedule


def format_time(seconds: float) -> str:
    """Format seconds into human-readable string"""
    if seconds < 60:
        return f"{int(seconds)}s"
    
    minutes = int(seconds // 60)
    remaining_seconds = int(seconds % 60)
    
    if minutes < 60:
        if remaining_seconds > 0:
            return f"{minutes}m {remaining_seconds}s"
        return f"{minutes}m"
    
    hours = int(minutes // 60)
    remaining_minutes = int(minutes % 60)
    
    if remaining_minutes > 0:
        return f"{hours}h {remaining_minutes}m"
    return f"{hours}h"


def format_interval(hours: float) -> str:
    """Format hours into human-readable interval"""
    if hours <= 0:
        return "Review now"
    
    if hours < 1:
        minutes = int(hours * 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''}"
    
    if hours < 24:
        h = int(hours)
        return f"{h} hour{'s' if h != 1 else ''}"
    
    days = int(hours / 24)
    return f"{days} day{'s' if days != 1 else ''}"


def calculate_trend(data_points: List[float]) -> str:
    """Calculate trend direction from data points using simple linear regression"""
    if len(data_points) < 2:
        return "stable"
    
    n = len(data_points)
    x_mean = (n - 1) / 2
    y_mean = sum(data_points) / n
    
    numerator = sum((i - x_mean) * (y - y_mean) for i, y in enumerate(data_points))
    denominator = sum((i - x_mean) ** 2 for i in range(n))
    
    if denominator == 0:
        return "stable"
    
    slope = numerator / denominator
    
    if slope > 0.1:
        return "improving"
    elif slope < -0.1:
        return "declining"
    return "stable"

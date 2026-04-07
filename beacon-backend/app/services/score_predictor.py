from ..models import User, SessionAnswer, Question, PracticeSession, Streak


class ScorePredictor:

    @staticmethod
    def predict(user_id):
        from ..extensions import db
        user = User.query.get(user_id)
        answers = SessionAnswer.query.filter_by(user_id=user_id).all()

        if len(answers) < 50:
            return None

        total = len(answers)
        correct = sum(1 for a in answers if a.is_correct)
        accuracy = correct / total

        # Subject breakdown
        subject_scores = {}
        for subject in (user.subjects or []):
            subj_answers = [
                a for a in answers
                if a.question and a.question.subject == subject
            ]
            if subj_answers:
                subj_acc = sum(1 for a in subj_answers if a.is_correct) / len(subj_answers)
                subject_scores[subject] = round(subj_acc * 100, 1)

        # Streak consistency
        streak = Streak.query.filter_by(user_id=user_id).first()
        consistency = min((streak.current_streak if streak else 0) / 30, 1.0)

        # Mock exam performance
        mock_sessions = PracticeSession.query.filter_by(
            user_id=user_id, mode='mock', status='completed'
        ).order_by(PracticeSession.completed_at.desc()).limit(5).all()

        mock_avg = (
            sum(s.score for s in mock_sessions) / len(mock_sessions) / 100
            if mock_sessions else accuracy
        )

        base_score = (
            accuracy * 0.35 +
            mock_avg * 0.40 +
            consistency * 0.15 +
            min(total / 5000, 1.0) * 0.10
        )

        predicted = int(base_score * 400)
        predicted = max(80, min(400, predicted))
        confidence = min(0.95, 0.5 + (total / 2000))

        return {
            'predicted_score': predicted,
            'confidence': round(confidence * 100),
            'range_low': max(0, predicted - 15),
            'range_high': min(400, predicted + 15),
            'pass_probability': round(
                99.9 if predicted >= 180 else (predicted / 180) * 100, 1
            ),
            'subject_breakdown': subject_scores,
            'questions_analyzed': total,
        }

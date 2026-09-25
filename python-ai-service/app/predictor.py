"""
DeliveryPredictor
------------------
A lightweight, self-contained model for estimating delivery windows.

For a real deployment, replace `_heuristic_predict` with a trained
scikit-learn regression/classification model (loaded via joblib from
MODEL_PATH) trained on historical order -> delivery-time data:
features could include pincode/zone, courier partner, item category,
order hour/day, warehouse load, weather, etc.

This scaffold ships a transparent heuristic so the whole pipeline
(Node -> Python -> Node -> Socket.IO -> React) is runnable end-to-end
without requiring a trained model file first.
"""
from datetime import datetime, timedelta
import os


class DeliveryPredictor:
    def __init__(self, model_path: str | None = None):
        self.model_path = model_path or os.getenv("MODEL_PATH", "model/delivery_model.joblib")
        self.model = self._try_load_model()

    def _try_load_model(self):
        try:
            import joblib
            if os.path.exists(self.model_path):
                return joblib.load(self.model_path)
        except Exception as e:
            print(f"[Predictor] No trained model loaded, using heuristic. ({e})")
        return None

    def predict(self, pincode: str | None, item_count: int, total_amount: float, order_hour: int) -> dict:
        if self.model is not None:
            return self._model_predict(pincode, item_count, total_amount, order_hour)
        return self._heuristic_predict(pincode, item_count, total_amount, order_hour)

    def _model_predict(self, pincode, item_count, total_amount, order_hour) -> dict:
        # Example shape if a trained model is plugged in later:
        # features = [[item_count, total_amount, order_hour, zone_code(pincode)]]
        # days = float(self.model.predict(features)[0])
        days = 3.0
        return self._build_response(days, confidence=0.82)

    def _heuristic_predict(self, pincode: str | None, item_count: int, total_amount: float, order_hour: int) -> dict:
        base_days = 3
        # more items -> slightly longer packing/dispatch time
        base_days += 1 if item_count > 5 else 0
        # orders placed late at night are picked up the next processing cycle
        base_days += 1 if order_hour >= 20 or order_hour < 6 else 0
        # unknown / distant pincode zones assumed slower (placeholder logic)
        if pincode and not pincode.startswith(("6", "5")):  # example: non-local zone
            base_days += 1

        delay_risk = "low"
        if base_days >= 5:
            delay_risk = "high"
        elif base_days == 4:
            delay_risk = "medium"

        return self._build_response(base_days, confidence=0.65, delay_risk=delay_risk)

    def _build_response(self, days: float, confidence: float, delay_risk: str | None = None) -> dict:
        predicted_date = datetime.utcnow() + timedelta(days=days)
        return {
            "predicted_delivery_date": predicted_date.strftime("%Y-%m-%d %H:%M:%S"),
            "estimated_days": days,
            "delay_risk": delay_risk or ("high" if days >= 5 else "low"),
            "confidence": confidence,
        }

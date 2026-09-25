"""
AnomalyDetector
-----------------
Flags order-tracking anomalies, e.g.:
  - a status transition that skips required steps (pending -> delivered directly)
  - an order sitting in the same status far longer than the typical window

This scaffold uses simple rule-based checks. For production, replace
with a model trained on historical order_tracking timestamps to learn
"typical time per status" per category/zone and flag statistical outliers.
"""

VALID_FLOW = [
    "pending", "confirmed", "processing", "packed",
    "shipped", "out_for_delivery", "delivered",
]

TERMINAL_STATES = {"cancelled", "returned"}


class AnomalyDetector:
    def check(self, order_id: int, new_status: str) -> dict:
        if new_status in TERMINAL_STATES:
            return {"is_anomaly": False, "reason": None}

        if new_status not in VALID_FLOW:
            return {"is_anomaly": True, "reason": f"Unknown status '{new_status}'"}

        # NOTE: in a full implementation, fetch the order's tracking history here
        # (via a shared DB connection or an internal API call back to Node) and
        # verify `new_status` is not skipping steps in VALID_FLOW, and that the
        # time elapsed since the previous status change isn't a statistical outlier.
        return {"is_anomaly": False, "reason": None}

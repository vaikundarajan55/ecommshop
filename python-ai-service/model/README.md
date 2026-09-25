# Model directory

Place a trained model file here (e.g. `delivery_model.joblib`) and point
`MODEL_PATH` in `.env` to it. Until then, `DeliveryPredictor` automatically
falls back to a transparent rule-based heuristic, so the API works out of
the box.

Suggested next step: train a scikit-learn regressor on historical
`orders` + `order_tracking` data (exported from MySQL) with features such
as shipping zone, item count, order value, order hour/day-of-week, and
courier partner, predicting actual delivery time in days.

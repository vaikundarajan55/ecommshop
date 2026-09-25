"""
Python AI Service - Order Tracking Intelligence
------------------------------------------------
Exposes REST endpoints the Node.js backend calls to:
  1. POST /predict/delivery  -> predicted delivery date + delay risk for a new order
  2. POST /track/anomaly     -> flags unusual order-status transitions (e.g. stuck orders)

Run:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
"""
from datetime import datetime, timedelta
from fastapi import FastAPI
from pydantic import BaseModel
import os
from dotenv import load_dotenv

from app.predictor import DeliveryPredictor
from app.anomaly import AnomalyDetector

load_dotenv()

app = FastAPI(title="Ecommerce AI Order-Tracking Service", version="1.0.0")

predictor = DeliveryPredictor()
anomaly_detector = AnomalyDetector()


class DeliveryPredictionRequest(BaseModel):
    order_id: int
    shipping_pincode: str | None = None
    item_count: int
    total_amount: float
    order_hour: int


class AnomalyCheckRequest(BaseModel):
    order_id: int
    new_status: str


@app.get("/health")
def health():
    return {"success": True, "message": "AI service is running"}


@app.post("/predict/delivery")
def predict_delivery(payload: DeliveryPredictionRequest):
    result = predictor.predict(
        pincode=payload.shipping_pincode,
        item_count=payload.item_count,
        total_amount=payload.total_amount,
        order_hour=payload.order_hour,
    )
    return result


@app.post("/track/anomaly")
def track_anomaly(payload: AnomalyCheckRequest):
    result = anomaly_detector.check(order_id=payload.order_id, new_status=payload.new_status)
    return result

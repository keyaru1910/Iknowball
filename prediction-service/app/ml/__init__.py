"""
Module Machine Learning cho iKnowBall Prediction Service.
Bao gồm:
  - Feature Engineering (Trích xuất và chuẩn hóa đặc trưng)
  - Logistic Regression Model (Mô hình hồi quy Logistic đa lớp & nhị phân)
  - Model Trainer (Huấn luyện và đánh giá mô hình)
  - Predictor Facade (Giao diện suy luận chính)
"""

from app.ml.predictor import du_doan_tran_dau, MODEL_VERSION

__all__ = ["du_doan_tran_dau", "MODEL_VERSION"]

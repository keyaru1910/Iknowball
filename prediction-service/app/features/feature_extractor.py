"""
feature_extractor.py – Chuẩn hóa và kiểm tra feature snapshot đầu vào.

Module này chịu trách nhiệm:
  - Validate kiểu dữ liệu và phạm vi giá trị của các feature.
  - Tính toán recent_form từ số liệu thống kê thô.
  - Không truy cập database – chỉ nhận dict và trả về dict đã chuẩn hóa.
"""

from typing import TypedDict, Literal


class RawFeatureSnapshot(TypedDict, total=False):
    sport: Literal["football", "basketball"]
    homeTeamId: str
    awayTeamId: str
    homeElo: float
    awayElo: float
    homeWinRate: float  # Tỷ lệ thắng toàn mùa (0.0–1.0)
    awayWinRate: float
    homeRecentForm: float   # Tỷ lệ thắng 5 trận gần nhất (0.0–1.0)
    awayRecentForm: float
    h2hMatches: int


def compute_recent_form(wins: int, draws: int, losses: int) -> float:
    """
    Tính chỉ số phong độ gần đây từ số trận thắng/hòa/thua.
    
    Hòa tính 0.5 điểm, thắng tính 1.0 điểm, thua tính 0.0 điểm.
    Trả về 0.5 nếu không có dữ liệu.
    """
    total = wins + draws + losses
    if total == 0:
        return 0.5
    return (wins + 0.5 * draws) / total


def normalize_snapshot(raw: RawFeatureSnapshot) -> dict:
    """
    Chuẩn hóa snapshot feature và đặt giá trị mặc định hợp lý nếu thiếu.

    Đảm bảo:
      - homeElo / awayElo nằm trong [800, 2200].
      - homeRecentForm / awayRecentForm nằm trong [0.0, 1.0].
      - h2hMatches >= 0.
    """
    DEFAULT_ELO = 1500.0

    home_elo = float(raw.get("homeElo") or DEFAULT_ELO)
    away_elo = float(raw.get("awayElo") or DEFAULT_ELO)
    # Kẹp trong phạm vi hợp lý
    home_elo = max(800.0, min(2200.0, home_elo))
    away_elo = max(800.0, min(2200.0, away_elo))

    home_form = float(raw.get("homeRecentForm") or raw.get("homeWinRate") or 0.5)
    away_form = float(raw.get("awayRecentForm") or raw.get("awayWinRate") or 0.5)
    home_form = max(0.0, min(1.0, home_form))
    away_form = max(0.0, min(1.0, away_form))

    return {
        "sport": raw.get("sport", "football"),
        "homeTeamId": raw.get("homeTeamId", ""),
        "awayTeamId": raw.get("awayTeamId", ""),
        "homeElo": home_elo,
        "awayElo": away_elo,
        "homeRecentForm": home_form,
        "awayRecentForm": away_form,
        "h2hMatches": max(0, int(raw.get("h2hMatches") or 0)),
    }

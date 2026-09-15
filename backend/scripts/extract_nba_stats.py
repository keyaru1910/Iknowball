import os
import sys
import json
import kagglehub
import pandas as pd

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

NBA_TEAM_LOGOS = {
    "Atlanta Hawks": "https://a.espncdn.com/i/teamlogos/nba/500/atl.png",
    "Boston Celtics": "https://a.espncdn.com/i/teamlogos/nba/500/bos.png",
    "Brooklyn Nets": "https://a.espncdn.com/i/teamlogos/nba/500/bkn.png",
    "Charlotte Hornets": "https://a.espncdn.com/i/teamlogos/nba/500/cha.png",
    "Chicago Bulls": "https://a.espncdn.com/i/teamlogos/nba/500/chi.png",
    "Cleveland Cavaliers": "https://a.espncdn.com/i/teamlogos/nba/500/cle.png",
    "Dallas Mavericks": "https://a.espncdn.com/i/teamlogos/nba/500/dal.png",
    "Denver Nuggets": "https://a.espncdn.com/i/teamlogos/nba/500/den.png",
    "Detroit Pistons": "https://a.espncdn.com/i/teamlogos/nba/500/det.png",
    "Golden State Warriors": "https://a.espncdn.com/i/teamlogos/nba/500/gsw.png",
    "Houston Rockets": "https://a.espncdn.com/i/teamlogos/nba/500/hou.png",
    "Indiana Pacers": "https://a.espncdn.com/i/teamlogos/nba/500/ind.png",
    "LA Clippers": "https://a.espncdn.com/i/teamlogos/nba/500/lac.png",
    "Los Angeles Clippers": "https://a.espncdn.com/i/teamlogos/nba/500/lac.png",
    "Los Angeles Lakers": "https://a.espncdn.com/i/teamlogos/nba/500/lal.png",
    "Memphis Grizzlies": "https://a.espncdn.com/i/teamlogos/nba/500/mem.png",
    "Miami Heat": "https://a.espncdn.com/i/teamlogos/nba/500/mia.png",
    "Milwaukee Bucks": "https://a.espncdn.com/i/teamlogos/nba/500/mil.png",
    "Minnesota Timberwolves": "https://a.espncdn.com/i/teamlogos/nba/500/min.png",
    "New Orleans Pelicans": "https://a.espncdn.com/i/teamlogos/nba/500/nop.png",
    "New York Knicks": "https://a.espncdn.com/i/teamlogos/nba/500/nyk.png",
    "Oklahoma City Thunder": "https://a.espncdn.com/i/teamlogos/nba/500/okc.png",
    "Orlando Magic": "https://a.espncdn.com/i/teamlogos/nba/500/orl.png",
    "Philadelphia 76ers": "https://a.espncdn.com/i/teamlogos/nba/500/phi.png",
    "Phoenix Suns": "https://a.espncdn.com/i/teamlogos/nba/500/phx.png",
    "Portland Trail Blazers": "https://a.espncdn.com/i/teamlogos/nba/500/por.png",
    "Sacramento Kings": "https://a.espncdn.com/i/teamlogos/nba/500/sac.png",
    "San Antonio Spurs": "https://a.espncdn.com/i/teamlogos/nba/500/sas.png",
    "Toronto Raptors": "https://a.espncdn.com/i/teamlogos/nba/500/tor.png",
    "Utah Jazz": "https://a.espncdn.com/i/teamlogos/nba/500/uta.png",
    "Washington Wizards": "https://a.espncdn.com/i/teamlogos/nba/500/was.png",
}

def get_season_from_date(date_str):
    try:
        # date_str co the la '2024-11-05'
        parts = str(date_str).split(' ')[0].split('T')[0].split('-')
        year = int(parts[0])
        month = int(parts[1])
        if month >= 10:
            return f"{year}-{year+1}"
        else:
            return f"{year-1}-{year}"
    except:
        return None

def main():
    print("[1/4] Lay duong dan dataset Kaggle...", flush=True)
    dataset_path = kagglehub.dataset_download("eoinamoore/historical-nba-data-and-player-box-scores")
    print(f"[OK] Thu muc dataset: {dataset_path}", flush=True)

    # 1. Xu ly Team Statistics
    team_csv = os.path.join(dataset_path, "TeamStatistics.csv")
    print(f"\n[2/4] Dang doc va loc TeamStatistics tu: {team_csv}...", flush=True)
    
    team_cols = ['gameId', 'teamCity', 'teamName', 'teamId', 'win', 'teamScore', 'opponentScore', 'gameDate']
    df_teams = pd.read_csv(team_csv, usecols=team_cols, low_memory=False)
    df_teams['season'] = df_teams['gameDate'].apply(get_season_from_date)
    
    available_seasons = sorted(df_teams['season'].dropna().unique())
    print(f"Cac mua giai co san trong TeamStatistics: {available_seasons[-5:]}", flush=True)
    
    target_seasons = ['2024-2025', '2025-2026']
    found_seasons = [s for s in target_seasons if s in available_seasons]
    print(f"Cac mua muc tieu tim thay: {found_seasons}", flush=True)
    
    if len(found_seasons) < 2:
        print("Dataset chua du 2 mua 24/25 & 25/26, se lay 2 mua gan nhat va map chuan hoa.", flush=True)
        latest_seasons = available_seasons[-2:]
        season_mapping = {
            latest_seasons[0]: "2024-2025",
            latest_seasons[1]: "2025-2026"
        }
    else:
        season_mapping = {
            "2024-2025": "2024-2025",
            "2025-2026": "2025-2026"
        }

    selected_raw_seasons = list(season_mapping.keys())
    print(f"Lay du lieu cac mua goc: {selected_raw_seasons} -> map thanh: {list(season_mapping.values())}", flush=True)

    df_teams_filtered = df_teams[df_teams['season'].isin(selected_raw_seasons)].copy()
    df_teams_filtered['fullTeamName'] = df_teams_filtered['teamCity'].fillna('') + ' ' + df_teams_filtered['teamName'].fillna('')
    df_teams_filtered['fullTeamName'] = df_teams_filtered['fullTeamName'].str.strip()
    df_teams_filtered['mappedSeason'] = df_teams_filtered['season'].map(season_mapping)

    team_records = []
    for (t_name, m_season), group in df_teams_filtered.groupby(['fullTeamName', 'mappedSeason']):
        if not t_name:
            continue
        played = len(group)
        wins = int(group['win'].sum())
        losses = played - wins
        win_pct = round(wins / played, 3) if played > 0 else 0
        pts_for_avg = round(group['teamScore'].mean(), 1)
        pts_against_avg = round(group['opponentScore'].mean(), 1)
        pt_diff = round(pts_for_avg - pts_against_avg, 1)
        
        logo = NBA_TEAM_LOGOS.get(t_name, "https://a.espncdn.com/i/teamlogos/leagues/500/nba.png")
        
        team_records.append({
            "teamName": t_name,
            "teamLogoUrl": logo,
            "season": m_season,
            "sport": "basketball",
            "played": played,
            "wins": wins,
            "draws": None,
            "losses": losses,
            "winPercentage": win_pct,
            "pointsForAvg": float(pts_for_avg),
            "pointsAgainstAvg": float(pts_against_avg),
            "pointDifferential": float(pt_diff)
        })

    print(f"-> Tong so ban ghi Team Thong ke: {len(team_records)}", flush=True)

    # 2. Xu ly Player Statistics voi Chunk de toi uu RAM va toc do
    player_csv = os.path.join(dataset_path, "PlayerStatistics.csv")
    print(f"\n[3/4] Dang doc va loc PlayerStatistics tu: {player_csv}...", flush=True)
    
    player_cols = [
        'firstName', 'lastName', 'personId', 'playerteamCity', 'playerteamName',
        'points', 'assists', 'blocks', 'steals', 'fieldGoalsAttempted', 'fieldGoalsMade',
        'reboundsTotal', 'startingPosition', 'gameDate', 'numMinutes'
    ]
    
    # Doc theo chunk de loc ngay cac mua can thiet
    chunks = []
    chunk_size = 50000
    for chunk in pd.read_csv(player_csv, usecols=player_cols, chunksize=chunk_size, low_memory=False):
        chunk['season'] = chunk['gameDate'].apply(get_season_from_date)
        filtered_chunk = chunk[chunk['season'].isin(selected_raw_seasons)]
        if len(filtered_chunk) > 0:
            chunks.append(filtered_chunk)
            
    df_players_filtered = pd.concat(chunks, ignore_index=True)
    print(f"Tong so row player hop le trong 2 mua: {len(df_players_filtered)}", flush=True)
    
    df_players_filtered['fullName'] = df_players_filtered['firstName'].fillna('') + ' ' + df_players_filtered['lastName'].fillna('')
    df_players_filtered['fullName'] = df_players_filtered['fullName'].str.strip()
    df_players_filtered['teamName'] = df_players_filtered['playerteamCity'].fillna('') + ' ' + df_players_filtered['playerteamName'].fillna('')
    df_players_filtered['teamName'] = df_players_filtered['teamName'].str.strip()
    df_players_filtered['mappedSeason'] = df_players_filtered['season'].map(season_mapping)

    player_records = []
    for (p_id, p_name, m_season), group in df_players_filtered.groupby(['personId', 'fullName', 'mappedSeason']):
        valid_games = group.dropna(subset=['points'])
        appearances = len(valid_games)
        if appearances < 10:  # Loai bo cau thu thi dau duoi 10 tran
            continue
        
        latest_team = group['teamName'].dropna().iloc[-1] if len(group['teamName'].dropna()) > 0 else "NBA Team"
        
        positions = group['startingPosition'].dropna()
        pos = positions.mode()[0] if len(positions) > 0 else "Guard"
        if pos == "G": pos = "Guard"
        elif pos == "F": pos = "Forward"
        elif pos == "C": pos = "Center"
        
        fg_made = group['fieldGoalsMade'].sum()
        fg_att = group['fieldGoalsAttempted'].sum()
        fg_pct = round((fg_made / fg_att) * 100, 1) if fg_att > 0 else 0.0
        
        logo = NBA_TEAM_LOGOS.get(latest_team, "https://a.espncdn.com/i/teamlogos/leagues/500/nba.png")
        
        player_records.append({
            "externalId": f"nba-{p_id}",
            "playerName": p_name,
            "teamName": latest_team,
            "teamLogoUrl": logo,
            "season": m_season,
            "sport": "basketball",
            "position": pos,
            "appearances": int(appearances),
            "minutesPlayed": int(group['numMinutes'].fillna(0).sum()) if 'numMinutes' in group else appearances * 25,
            "pointsAvg": float(round(group['points'].mean(), 1)),
            "reboundsAvg": float(round(group['reboundsTotal'].mean(), 1)),
            "assistsAvg": float(round(group['assists'].mean(), 1)),
            "stealsAvg": float(round(group['steals'].mean(), 1)),
            "blocksAvg": float(round(group['blocks'].mean(), 1)),
            "fieldGoalPercentage": float(fg_pct)
        })

    player_records.sort(key=lambda x: (x['season'], x['pointsAvg']), reverse=True)
    print(f"-> Tong so ban ghi Player Thong ke (>=10 tran): {len(player_records)}", flush=True)

    # 3. Xuat file JSON
    output_dir = os.path.join(os.path.dirname(__file__), "..", "data", "basketball")
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, "nba_stats_24_26.json")
    
    result_data = {
        "seasons": ["2024-2025", "2025-2026"],
        "teams": team_records,
        "players": player_records
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result_data, f, ensure_ascii=False, indent=2)
        
    print(f"\n[4/4] [SUCCESS] Da luu thanh cong mock seed data vao:\n{output_file}", flush=True)

if __name__ == "__main__":
    main()

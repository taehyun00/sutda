from fastapi import APIRouter
from app.db import get_connection
from app.game_logic import evaluate_hand
import random

router = APIRouter()

@router.post("/start")
def start_game():
    cards = list(range(1, 21))
    random.shuffle(cards)

    player1 = cards[:2]
    player2 = cards[2:4]

    hand1, score1 = evaluate_hand(*player1)
    hand2, score2 = evaluate_hand(*player2)

    winner = "player1" if score1 > score2 else "player2"

    conn = get_connection()
    with conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO game_result (p1_card1, p1_card2, p2_card1, p2_card2, winner) VALUES (%s, %s, %s, %s, %s)",
                (player1[0], player1[1], player2[0], player2[1], winner)
            )
            conn.commit()

    return {
        "player1": {"cards": player1, "hand": hand1},
        "player2": {"cards": player2, "hand": hand2},
        "winner": winner
    }
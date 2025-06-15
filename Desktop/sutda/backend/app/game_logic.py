def evaluate_hand(card1, card2):
    hand = sorted([card1, card2])
    if hand == [3, 8]:
        return "삼팔광땡", 100
    elif card1 == card2:
        return f"{card1}땡", 90 + card1
    else:
        total = (card1 + card2) % 10
        return f"{total}끗", total
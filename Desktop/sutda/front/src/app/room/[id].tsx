import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { jokbo } from "../../../jokbo";

type CardType = number | string | null;

function parseCard(card: CardType): number {
  if (card === "01" || card === "02") return 0; // 광패를 0으로 취급
  if (typeof card === "string") return parseInt(card, 10);
  if (typeof card === "number") return card;
  return 0;
}


function getJokbo(a: CardType, b: CardType): string {
  const x = parseCard(a);
  const y = parseCard(b);
  const [min, max] = [x, y].sort((m, n) => m - n);
  const key = `${min}-${max}`;
  return jokbo[key] || "족보 없음";
}

export default function RoomPage() {
  const router = useRouter();
  const { id } = router.query;
  const [gameState, setGameState] = useState(null);
  const [card1, setCard1] = useState<CardType>(null);
  const [card2, setCard2] = useState<CardType>(null);

  useEffect(() => {
    if (!id) return;
    axios.post(`http://localhost:8080/api/sutda/start`, { room_id: id })
      .then((res) => {
        setGameState(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [id]);

  if (!gameState) return <div>게임 로딩 중...</div>;

  const handleDraw = () => {
    const draw1 = Math.floor(Math.random() * 11); // 0~10
    const draw2 = Math.floor(Math.random() * 11);

    const resolveCard = (num: number): CardType => {
      if (num === 0) {
        return Math.random() < 0.5 ? "01" : "02";
      }
      return num;
    };

    setCard1(resolveCard(draw1));
    setCard2(resolveCard(draw2));
  };

  const getCardImage = (card: CardType) => {
    if (typeof card === "string") return `/image/${card.toString().padStart(2, "0")}.svg`;
    if (typeof card === "number") return `/image/${card}.svg`;
    return "";
  };

  return (
    <div>
      <button onClick={handleDraw}>패 뽑기</button>
      {card1 !== null && card2 !== null && (
        <div>
          <p>당신의 패: {card1} & {card2}</p>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <img src={getCardImage(card1)} alt={`Card ${card1}`} width={100} />
            <img src={getCardImage(card2)} alt={`Card ${card2}`} width={100} />
          </div>

          <p>족보: {getJokbo(card1, card2)}</p>
        </div>
      )}
    </div>
  );
}

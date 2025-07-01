class SeotdaGame {
  constructor() {
    this.ws = null;
    this.roomListWs = null;
    this.currentRoom = null;
    this.playerId = null;
    this.playerName = null;
    this.gameState = null;
    this.isRoomOwner = false;
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // 메인 메뉴 이벤트
    document.getElementById('create-room-btn').addEventListener('click', () => {
      this.showScreen('create-room-screen');
    });

    document.getElementById('room-list-btn').addEventListener('click', () => {
      this.showRoomList();
    });

    document.getElementById('join-room-btn').addEventListener('click', () => {
      this.showJoinForm();
    });

    document.getElementById('cancel-join-btn').addEventListener('click', () => {
      this.hideJoinForm();
    });

    document.getElementById('join-btn').addEventListener('click', () => {
      this.joinRoomDirect();
    });

    // 방 생성 이벤트
    document.getElementById('new-room-private').addEventListener('change', (e) => {
      const passwordField = document.getElementById('new-room-password');
      passwordField.style.display = e.target.checked ? 'block' : 'none';
    });

    document.getElementById('create-room-confirm-btn').addEventListener('click', () => {
      this.createRoom();
    });

    document.getElementById('create-room-cancel-btn').addEventListener('click', () => {
      this.showScreen('main-menu');
    });

    // 방 목록 이벤트
    document.getElementById('refresh-rooms-btn').addEventListener('click', () => {
      this.refreshRoomList();
    });

    document.getElementById('back-to-menu-btn').addEventListener('click', () => {
      this.showScreen('main-menu');
      this.disconnectRoomList();
    });

    // 게임룸 이벤트
    document.getElementById('edit-room-btn').addEventListener('click', () => {
      this.showRoomSettings();
    });

    document.getElementById('start-game-btn').addEventListener('click', () => {
      this.startGame();
    });

    document.getElementById('leave-room-btn').addEventListener('click', () => {
      this.leaveRoom();
    });

    // 방 설정 모달 이벤트
    document.getElementById('edit-room-private').addEventListener('change', (e) => {
      const passwordField = document.getElementById('edit-room-password');
      if (!e.target.checked) {
        passwordField.value = '';
      }
    });

    document.getElementById('save-room-settings-btn').addEventListener('click', () => {
      this.saveRoomSettings();
    });

    document.getElementById('delete-room-btn').addEventListener('click', () => {
      this.deleteRoom();
    });

    document.getElementById('cancel-room-settings-btn').addEventListener('click', () => {
      this.hideRoomSettings();
    });

    // 베팅 이벤트
    document.getElementById('call-btn').addEventListener('click', () => {
      this.placeBet('call');
    });

    document.getElementById('raise-btn').addEventListener('click', () => {
      const amount = parseInt(document.getElementById('raise-amount').value) || 0;
      this.placeBet('raise', amount);
    });

    document.getElementById('fold-btn').addEventListener('click', () => {
      this.placeBet('fold');
    });

    document.getElementById('allin-btn').addEventListener('click', () => {
      this.placeBet('all_in');
    });

    document.getElementById('half-btn').addEventListener('click', () => {
      this.placeBet('half');
    });

    // 결과 화면 이벤트
    document.getElementById('new-game-btn').addEventListener('click', () => {
      this.showScreen('game-room');
    });

    // 모달 외부 클릭 시 닫기
    document.getElementById('room-settings-modal').addEventListener('click', (e) => {
      if (e.target.id === 'room-settings-modal') {
        this.hideRoomSettings();
      }
    });
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
  }

  showJoinForm() {
    document.getElementById('join-room-form').style.display = 'block';
    document.querySelector('.menu-buttons').style.display = 'none';
  }

  hideJoinForm() {
    document.getElementById('join-room-form').style.display = 'none';
    document.querySelector('.menu-buttons').style.display = 'flex';
  }

  async createRoom() {
    const name = document.getElementById('new-room-name').value.trim();
    const description = document.getElementById('new-room-description').value.trim();
    const maxPlayers = parseInt(document.getElementById('new-room-max-players').value);
    const isPrivate = document.getElementById('new-room-private').checked;
    const password = isPrivate ? document.getElementById('new-room-password').value : null;
    const createdBy = document.getElementById('new-room-creator').value.trim();

    if (!name || !createdBy) {
      alert('방 이름과 방장 이름을 입력하세요.');
      return;
    }

    if (isPrivate && !password) {
      alert('비밀방의 경우 비밀번호를 입력하세요.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          max_players: maxPlayers,
          is_private: isPrivate,
          password,
          created_by: createdBy
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.playerName = createdBy;
        this.isRoomOwner = true;
        await this.joinRoom(data.room_id);
      } else {
        const error = await response.json();
        alert(error.detail || '방 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('방 생성 실패:', error);
      alert('방 생성에 실패했습니다.');
    }
  }

  async showRoomList() {
    this.showScreen('room-list-screen');
    this.connectRoomList();
  }

  connectRoomList() {
    if (this.roomListWs) {
      this.roomListWs.close();
    }

    this.roomListWs = new WebSocket('ws://localhost:8000/ws/rooms');
    
    this.roomListWs.onopen = () => {
      console.log('방 목록 WebSocket 연결됨');
    };

    this.roomListWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'room_list') {
        this.updateRoomList(data.rooms);
      }
    };

    this.roomListWs.onclose = () => {
      console.log('방 목록 WebSocket 연결 종료');
    };

    this.roomListWs.onerror = (error) => {
      console.error('방 목록 WebSocket 에러:', error);
    };
  }

  disconnectRoomList() {
    if (this.roomListWs) {
      this.roomListWs.close();
      this.roomListWs = null;
    }
  }

  updateRoomList(rooms) {
    const container = document.getElementById('rooms-container');
    
    if (rooms.length === 0) {
      container.innerHTML = '<div class="no-rooms">생성된 방이 없습니다.</div>';
      return;
    }

    container.innerHTML = rooms.map(room => `
      <div class="room-card ${room.status === 'playing' ? 'playing' : ''}" data-room-id="${room.id}">
        <div class="room-header">
          <h3>${room.name}</h3>
          <div class="room-status">
            ${room.is_private ? '🔒' : '🔓'}
            <span class="status-text">${room.status === 'playing' ? '게임중' : '대기중'}</span>
          </div>
        </div>
        <div class="room-info">
          <p class="room-description">${room.description || '설명 없음'}</p>
          <div class="room-details">
            <span class="players-count">${room.current_players}/${room.max_players}명</span>
            <span class="created-by">방장: ${room.created_by}</span>
          </div>
        </div>
        <div class="room-actions">
          ${room.status === 'waiting' && room.current_players < room.max_players ? 
            `<button class="btn btn-primary join-room-btn" data-room-id="${room.id}" data-is-private="${room.is_private}">참가</button>` :
            `<button class="btn btn-secondary" disabled>${room.status === 'playing' ? '게임중' : '방 가득참'}</button>`
          }
        </div>
      </div>
    `).join('');

    // 방 참가 버튼 이벤트 리스너 추가
    container.querySelectorAll('.join-room-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const roomId = e.target.dataset.roomId;
        const isPrivate = e.target.dataset.isPrivate === 'true';
        this.joinRoomFromList(roomId, isPrivate);
      });
    });
  }

  async joinRoomFromList(roomId, isPrivate) {
    const playerName = document.getElementById('room-list-player-name').value.trim();
    
    if (!playerName) {
      alert('플레이어 이름을 입력하세요.');
      return;
    }

    let password = null;
    if (isPrivate) {
      password = prompt('비밀번호를 입력하세요:');
      if (password === null) return; // 취소한 경우
    }

    try {
      // 방 참가 가능 여부 확인
      const response = await fetch(`http://localhost:8000/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        this.playerName = playerName;
        this.isRoomOwner = false;
        await this.joinRoom(roomId);
      } else {
        const error = await response.json();
        alert(error.detail || '방 참가에 실패했습니다.');
      }
    } catch (error) {
      console.error('방 참가 실패:', error);
      alert('방 참가에 실패했습니다.');
    }
  }

  async joinRoomDirect() {
    const roomId = document.getElementById('room-id-input').value.trim();
    const playerName = document.getElementById('player-name-input').value.trim();
    const password = document.getElementById('room-password-input').value;

    if (!roomId || !playerName) {
      alert('방 ID와 플레이어 이름을 입력하세요.');
      return;
    }

    try {
      // 방 참가 가능 여부 확인
      const response = await fetch(`http://localhost:8000/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: password || null })
      });

      if (response.ok) {
        this.playerName = playerName;
        this.isRoomOwner = false;
        await this.joinRoom(roomId);
      } else {
        const error = await response.json();
        alert(error.detail || '방 참가에 실패했습니다.');
      }
    } catch (error) {
      console.error('방 참가 실패:', error);
      alert('방 참가에 실패했습니다.');
    }
  }

  async joinRoom(roomId) {
    this.currentRoom = roomId;
    this.disconnectRoomList();
    
    // WebSocket 연결
    const wsUrl = `ws://localhost:8000/ws/${roomId}/${this.playerName}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('게임룸 WebSocket 연결됨');
      this.showScreen('game-room');
      document.getElementById('room-id-display').textContent = `방 ID: ${roomId}`;
      this.hideJoinForm();
      
      // 방장인 경우에만 방 설정 버튼 표시
      document.getElementById('edit-room-btn').style.display = this.isRoomOwner ? 'inline-block' : 'none';
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleWebSocketMessage(data);
    };

    this.ws.onclose = () => {
      console.log('게임룸 WebSocket 연결 종료');
      this.showScreen('main-menu');
    };

    this.ws.onerror = (error) => {
      console.error('게임룸 WebSocket 에러:', error);
      alert('서버 연결에 실패했습니다.');
    };
  }

  async showRoomSettings() {
    if (!this.isRoomOwner) {
      alert('방장만 방 설정을 변경할 수 있습니다.');
      return;
    }

    try {
      // 현재 방 정보 가져오기
      const response = await fetch(`http://localhost:8000/api/rooms/${this.currentRoom}`);
      if (response.ok) {
        const data = await response.json();
        const room = data.room;
        
        // 폼에 현재 값 설정
        document.getElementById('edit-room-name').value = room.name;
        document.getElementById('edit-room-description').value = room.description || '';
        document.getElementById('edit-room-max-players').value = room.max_players;
        document.getElementById('edit-room-private').checked = room.is_private;
        document.getElementById('edit-room-password').value = room.password || '';
        
        // 모달 표시
        document.getElementById('room-settings-modal').style.display = 'flex';
      }
    } catch (error) {
      console.error('방 정보 조회 실패:', error);
      alert('방 정보를 불러올 수 없습니다.');
    }
  }

  hideRoomSettings() {
    document.getElementById('room-settings-modal').style.display = 'none';
  }

  async saveRoomSettings() {
    const name = document.getElementById('edit-room-name').value.trim();
    const description = document.getElementById('edit-room-description').value.trim();
    const maxPlayers = parseInt(document.getElementById('edit-room-max-players').value);
    const isPrivate = document.getElementById('edit-room-private').checked;
    const password = isPrivate ? document.getElementById('edit-room-password').value : null;

    if (!name) {
      alert('방 이름을 입력하세요.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/rooms/${this.currentRoom}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          max_players: maxPlayers,
          is_private: isPrivate,
          password
        })
      });

      if (response.ok) {
        alert('방 설정이 저장되었습니다.');
        this.hideRoomSettings();
      } else {
        const error = await response.json();
        alert(error.detail || '방 설정 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('방 설정 저장 실패:', error);
      alert('방 설정 저장에 실패했습니다.');
    }
  }

  async deleteRoom() {
    if (!confirm('정말로 방을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/rooms/${this.currentRoom}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('방이 삭제되었습니다.');
        this.leaveRoom();
      } else {
        const error = await response.json();
        alert(error.detail || '방 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('방 삭제 실패:', error);
      alert('방 삭제에 실패했습니다.');
    }
  }

  async refreshRoomList() {
    try {
      const response = await fetch('http://localhost:8000/api/rooms');
      if (response.ok) {
        const data = await response.json();
        this.updateRoomList(data.rooms);
      }
    } catch (error) {
      console.error('방 목록 새로고침 실패:', error);
    }
  }

  handleWebSocketMessage(data) {
    console.log('받은 메시지:', data);

    switch (data.type) {
      case 'game_state':
        this.updateGameState(data);
        break;
      case 'cards_dealt':
        this.showMyCards(data.cards);
        break;
      case 'game_result':
        this.showGameResult(data);
        break;
      case 'room_deleted':
        alert(data.message);
        this.leaveRoom();
        break;
      case 'error':
        alert(data.message);
        break;
    }
  }

  updateGameState(gameState) {
    this.gameState = gameState;
    
    // 플레이어 목록 업데이트
    this.updatePlayersList(gameState.players);
    
    // 팟 금액 업데이트
    document.getElementById('current-pot').textContent = gameState.current_pot;
    document.getElementById('pot-amount').textContent = `팟: ${gameState.current_pot}원`;
    
    // 내 정보 업데이트
    const myPlayer = gameState.players.find(p => p.name === this.playerName);
    if (myPlayer) {
      document.getElementById('my-chips').textContent = `칩: ${myPlayer.chips}`;
      this.playerId = myPlayer.id;
    }
    
    // 베팅 버튼 상태 업데이트
    this.updateBettingButtons(gameState);
  }

  updatePlayersList(players) {
    const playersList = document.getElementById('players-list');
    playersList.innerHTML = '';

    players.forEach(player => {
      const playerCard = document.createElement('div');
      playerCard.className = 'player-card';
      
      if (player.id === this.gameState?.current_player) {
        playerCard.classList.add('current-turn');
      }
      
      if (player.folded) {
        playerCard.classList.add('folded');
      }

      playerCard.innerHTML = `
        <div class="player-name">${player.name}</div>
        <div class="player-chips">칩: ${player.chips}</div>
        <div class="player-bet">베팅: ${player.current_bet}</div>
        ${player.ready ? '<div class="ready-status">준비완료</div>' : ''}
      `;

      playersList.appendChild(playerCard);
    });
  }

  updateBettingButtons(gameState) {
    const isMyTurn = gameState.current_player === this.playerId;
    const isPlaying = gameState.status === 'playing';
    
    const buttons = document.querySelectorAll('.bet-btn');
    buttons.forEach(btn => {
      btn.disabled = !isMyTurn || !isPlaying;
    });

    if (isMyTurn && isPlaying) {
      const myPlayer = gameState.players.find(p => p.id === this.playerId);
      const callAmount = gameState.current_bet - myPlayer.current_bet;
      
      document.getElementById('call-btn').textContent = `콜 (${callAmount})`;
    }
  }

  showMyCards(cards) {
    const cardsDisplay = document.getElementById('my-cards-display');
    cardsDisplay.innerHTML = '';

    cards.forEach(card => {
      const cardElement = document.createElement('div');
      cardElement.className = `card ${card.suit}`;
      cardElement.innerHTML = `
        <div class="card-number">${card.number}</div>
        <div class="card-suit">${this.getSuitName(card.suit)}</div>
      `;
      cardsDisplay.appendChild(cardElement);
    });
  }

  getSuitName(suit) {
    const suitNames = {
      'pine': '송',
      'plum': '매',
      'cherry': '벚',
      'wisteria': '등',
      'iris': '창',
      'peony': '모',
      'bush': '싸',
      'pampas': '공',
      'chrysanthemum': '국',
      'maple': '단'
    };
    return suitNames[suit] || suit;
  }

  startGame() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'start_game'
      }));
    }
  }

  placeBet(action, amount = 0) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'bet',
        action: action,
        amount: amount
      }));
    }
  }

  showGameResult(result) {
    this.showScreen('game-result');
    
    // 승자 표시
    const winnerDisplay = document.getElementById('winner-display');
    winnerDisplay.innerHTML = `
      <h3>🎉 승자: ${result.winner.name} 🎉</h3>
      <div class="winner-cards">
        ${result.winner.cards.map(card => `
          <div class="card ${card.suit}">
            <div class="card-number">${card.number}</div>
            <div class="card-suit">${this.getSuitName(card.suit)}</div>
          </div>
        `).join('')}
      </div>
    `;

    // 모든 플레이어 카드 표시
    const allCardsDisplay = document.getElementById('all-cards-display');
    allCardsDisplay.innerHTML = '<h4>모든 플레이어 카드</h4>';
    
    result.all_players.forEach(player => {
      const playerResult = document.createElement('div');
      playerResult.className = 'player-result';
      
      if (player.id === result.winner.id) {
        playerResult.classList.add('winner');
      }
      
      if (player.folded) {
        playerResult.classList.add('folded');
      }

      playerResult.innerHTML = `
        <div class="player-info">
          <strong>${player.name}</strong>
          ${player.folded ? ' (포기)' : ''}
        </div>
        <div class="player-cards">
          ${player.cards.map(card => `
            <div class="card ${card.suit}">
              <div class="card-number">${card.number}</div>
            </div>
          `).join('')}
        </div>
      `;

      allCardsDisplay.appendChild(playerResult);
    });
  }

  leaveRoom() {
    if (this.ws) {
      this.ws.close();
    }
    this.showScreen('main-menu');
    this.currentRoom = null;
    this.playerId = null;
    this.playerName = null;
    this.gameState = null;
    this.isRoomOwner = false;
    
    // 입력 필드 초기화
    document.getElementById('room-id-input').value = '';
    document.getElementById('player-name-input').value = '';
    document.getElementById('room-password-input').value = '';
  }
}

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
  new SeotdaGame();
});
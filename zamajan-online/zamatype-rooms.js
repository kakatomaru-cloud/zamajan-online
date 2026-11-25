'use strict';
const { randomUUID } = require('node:crypto');
const engine = require('./public/minigames/zamatype/engine');

module.exports = function attachZamatype(io, getYaku=()=>undefined) {
  const namespace = io.of('/zamatype');
  const rooms = new Map();
  const maxPlayers = 4;
  function recruitment() {
    return [...rooms.values()]
      .filter(room => !room.game && room.players.length < maxPlayers)
      .map(room => ({
        id: room.id,
        hostName: room.players.find(player => player.id === room.host).name,
        count: room.players.length
      }));
  }
  function broadcastRecruitment() {
    namespace.emit('recruitment', recruitment());
  }
  function publish(room) {
    namespace.to(room.id).emit('room', {
      host: room.host, players: room.players, game: room.game, round: room.round
    });
  }
  const timer = setInterval(() => {
    const now = Date.now();
    for (const room of rooms.values()) {
      if (room.game?.status !== 'playing' || now < room.readyAt) continue;
      engine.tick(room.game, Math.min((now - room.lastTick) / 1000, .25));
      room.lastTick = now;
      publish(room);
    }
  }, 100);
  timer.unref();
  namespace.on('connection', socket => {
    let room;
    socket.emit('recruitment', recruitment());
    function leave() {
      if (!room) return;
      room.reviewWords.delete(socket.id);
      room.words.delete(socket.id);
      if(room.game) {
        const player=room.game.players.find(entry=>entry.id===socket.id);
        if(player){player.typed='';player.aimText='';}
      }
      socket.leave(room.id);
      room.players = room.players.filter(player => player.id !== socket.id);
      if (!room.players.length) rooms.delete(room.id);
      else {
        if (room.host === socket.id) room.host = room.players[0].id;
        publish(room);
      }
      room = undefined;
      broadcastRecruitment();
    }
    socket.on('disconnect', leave);
    socket.on('leave', leave);
    socket.on('lobby', (data, reply) => {
      if (typeof reply !== 'function') return;
      const name = typeof data?.name === 'string' ? data.name.trim().slice(0,20) : '';
      if (!name) return reply('プレイヤー名を入力してください。');
      if (room) return reply('すでにルームに参加しています。');
      if (data.create === true) {
        if (rooms.size >= 512) return reply('ルームの上限に達しました。');
        const id = randomUUID();
        room = {id, host: socket.id, players: [], reviewWords: new Map(), words: new Map(), game: null, round: 0};
        rooms.set(id, room);
      } else {
        const target = rooms.get(data.roomId);
        if (!target || target.game || target.players.length >= maxPlayers) {
          return reply('参加できるルームが見つかりません。');
        }
        room = target;
      }
      room.players.push({id: socket.id, name});
      room.reviewWords.set(socket.id, engine.normalizeReviewWords(data.reviewWords));
      room.words.set(socket.id, engine.normalizeRegisteredWords(data.words));
      socket.join(room.id);
      reply(null);
      publish(room);
      broadcastRecruitment();
    });
    function startRound(reply, rematch) {
      if (typeof reply !== 'function') return;
      if (!room || room.host !== socket.id || room.players.length < 2 || (rematch ? room.game?.status !== 'ended' : room.game)) {
        return reply('2〜4人集まると、ルーム作成者が開始できます。');
      }
      if (rematch) {
        for (const player of room.players) {
          const ranking = engine.missRanking(room.game, player.id);
          if (ranking.length) room.reviewWords.set(player.id, ranking.map(([word]) => word));
        }
      }
      room.round += 1;
      const firstJob=Math.floor(Math.random()*4);
      for(const [index,player] of room.players.entries())player.job=(firstJob+index)%4;
      room.game = engine.init(engine.make(room.players, {
        reviewWords: [...room.reviewWords.values()],
        words: [...room.words.values()].flat(),
        yaku: getYaku()
      }));
      room.readyAt = Date.now() + 1450;
      room.lastTick = room.readyAt;
      reply(null);
      publish(room);
      broadcastRecruitment();
    }
    socket.on('start', reply => startRound(reply, false));
    socket.on('rematch', reply => startRound(reply, true));
    socket.on('aim', text => {
      if(room?.game?.status!=='playing'||Date.now()<room.readyAt||typeof text!=='string'||text.length>120)return;
      const player=room.game.players.find(entry=>entry.id===socket.id);
      if(player)player.aimText=text;
    });
    socket.on('input', (text) => {
      if (room?.game?.status !== 'playing' || Date.now() < room.readyAt) return;
      if (typeof text !== 'string' || !text || text.length > 120) return;
      const player=room.game.players.find(entry=>entry.id===socket.id);
      if(player)player.aimText='';
      if (text === 'ESCAPE' || text === 'BACKSPACE') engine.handle(room.game, socket.id, text);
      else if (!engine.handleText(room.game, socket.id, text) && /^[a-z-]+$/i.test(text)) {
        for (const key of text) engine.handle(room.game, socket.id, key);
      }
      publish(room);
    });
  });
};

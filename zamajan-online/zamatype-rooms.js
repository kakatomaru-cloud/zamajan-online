'use strict';
const { randomUUID } = require('node:crypto');
const engine = require('./public/minigames/zamatype/engine');

module.exports = function attachZamatype(io) {
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
      host: room.host, players: room.players, game: room.game
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
        room = {id, host: socket.id, players: [], reviewWords: new Map(), game: null};
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
      socket.join(room.id);
      reply(null);
      publish(room);
      broadcastRecruitment();
    });
    socket.on('start', (reply) => {
      if (typeof reply !== 'function') return;
      if (!room || room.host !== socket.id || room.game || room.players.length < 2) {
        return reply('2〜4人集まると、ルーム作成者が開始できます。');
      }
      room.game = engine.init(engine.make(room.players, {reviewWords: [...room.reviewWords.values()]}));
      room.readyAt = Date.now() + 1450;
      room.lastTick = room.readyAt;
      reply(null);
      publish(room);
      broadcastRecruitment();
    });
    socket.on('input', (text) => {
      if (room?.game?.status !== 'playing' || Date.now() < room.readyAt) return;
      if (typeof text !== 'string' || !text || text.length > 120) return;
      if (text === 'ESCAPE' || text === 'BACKSPACE') engine.handle(room.game, socket.id, text);
      else if (!engine.handleText(room.game, socket.id, text) && /^[a-z-]+$/i.test(text)) {
        for (const key of text) engine.handle(room.game, socket.id, key);
      }
      publish(room);
    });
  });
};

const assert = require('node:assert/strict');
const { HttpService } = require('@nestjs/axios');
const { ConfigService } = require('@nestjs/config');
const { GameApiService } = require('../dist/basic/game-api.service');
const { FinalStageService } = require('../dist/final-battle/shared/final-stage.service');

async function main() {
  const [origin, bffEs, bffEn] = process.argv.slice(2);
  assert.ok(origin && bffEs && bffEn, 'Provide isolated Game API and two BFF URLs');
  const api = new GameApiService(new HttpService(), new ConfigService({ GAME_API_URL: origin }));
  const context = { language: 'es', getCurrentTeamId: () => 'hulk' };
  const service = new FinalStageService(context, api);
  const path = '/teams/hulk/journeys/current/final-stage';
  const seen = new Set();
  async function verify(label) {
    for (const [lang, bff] of [
      ['es', bffEs],
      ['en', bffEn],
    ]) {
      context.language = lang;
      const state = await service.getState();
      const events = await service.getEvents();
      assert.deepEqual(state, await api.get(path, { lang }));
      assert.deepEqual(events, await api.get(path + '/events', { lang }));
      assert.equal(events.language, lang);
      assert.equal(events.attemptId, state.attemptId);
      if (state.status !== 'READY')
        assert.deepEqual(await service.getTeams(), await api.get(path + '/teams'));
      if (state.status === 'ACTIVE') {
        assert.deepEqual(await service.getActions(), await api.get(path + '/actions', { lang }));
        const filtered = await service.getActions('BASIC_ATTACK');
        assert.ok(filtered.actions.every((a) => a.actionCode === 'BASIC_ATTACK'));
        assert.deepEqual((await service.getActions('NOT_PUBLISHED')).actions, []);
      }
      const response = await fetch(bff + '/gameCore/final-stage/events');
      assert.equal(response.status, 200);
      const live = (await response.json()).data;
      assert.equal(live.status, state.status);
      assert.equal(live.phase, state.phase);
      assert.equal(live.phaseLabel, state.phaseLabel);
      assert.equal(live.events.length, events.events.length);
      for (const [index, event] of events.events.entries()) {
        for (const key of Object.keys(event)) assert.deepEqual(live.events[index][key], event[key]);
      }
      seen.add(state.phase);
      if (state.completion) seen.add(state.completion.outcomeCode);
    }
    console.log('PASS', label, 'gateway and R10 compared with real Game API in ES/EN');
  }
  assert.equal(await service.getState(), null);
  await assert.rejects(service.getEvents(), (error) => error.getStatus() === 409);
  for (const bff of [bffEs, bffEn]) {
    const result = await (await fetch(bff + '/gameCore/final-stage/events')).json();
    assert.equal(result.data.status, 'UNAVAILABLE');
  }
  console.log('PASS no Journey: state null, events error, R10 UNAVAILABLE');
  await api.post('/teams/hulk/journeys/simulate', { spendingStrategy: 'SAVE' });
  await verify('READY');
  assert.deepEqual((await service.getEvents()).events, []);
  await assert.rejects(service.getTeams(), (error) => error.getStatus() === 409);
  await assert.rejects(service.getActions(), (error) => error.getStatus() === 409);
  const receipt = await service.play({ type: 'START' });
  assert.equal(receipt.status, 'ACTIVE');
  await verify('START');
  await assert.rejects(service.play({ type: 'START' }), (error) => error.getStatus() === 409);
  const action = (await service.getActions()).actions[0];
  assert.ok(action.actionId);
  await service.play({ type: 'CHOOSE_ACTION', actionId: action.actionId });
  await verify('CHOOSE_ACTION');
  await assert.rejects(
    service.play({ type: 'CHOOSE_ACTION', actionId: action.actionId }),
    (error) => error.getStatus() === 422,
  );
  await assert.rejects(
    service.play({ type: 'CHOOSE_ACTION', actionId: 'invalid-action' }),
    (error) => error.getStatus() === 422,
  );
  const abandoned = await service.play({ type: 'ABANDON' });
  assert.equal(abandoned.completionOutcome, 'ABANDON');
  await verify('ABANDON');
  assert.equal((await service.getState()).completion.outcomeCode, 'ABANDON');
  console.log('PASS duplicate START and stale/invalid action failures');
  console.log('Observed:', [...seen].join(', '));
  console.log(
    'Not covered: real VICTORY, DEFEAT, DOOMSDAY, FINAL_ATTACK and special ending; complete R9 screen',
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

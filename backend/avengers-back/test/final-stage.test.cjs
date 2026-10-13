const { test } = require('node:test');
const assert = require('node:assert/strict');
const { HttpException } = require('@nestjs/common');
const { FinalStageService } = require('../dist/final-battle/shared/final-stage.service');

const path = '/teams/hulk/journeys/current/final-stage';
function setup(result = {}) {
  const calls = [];
  const context = { language: 'es', getCurrentTeamId: () => 'hulk' };
  const api = Object.fromEntries(
    ['get', 'post'].map((method) => [
      method,
      async (...args) => {
        calls.push([method, ...args]);
        return result;
      },
    ]),
  );
  return { service: new FinalStageService(context, api), api, context, calls };
}
function failure(status, code) {
  return new HttpException(
    { responseMessage: { messageCode: code, message: 'Published error' }, data: null },
    status,
  );
}
for (const [method, suffix, params] of [
  ['getState', '', { lang: 'es' }],
  ['getEvents', '/events', { lang: 'es' }],
  ['getTeams', '/teams', undefined],
  ['getActions', '/actions', { lang: 'es', actionCode: undefined }],
]) {
  test(`${method} preserves the response and uses the current team`, async () => {
    const response = { published: true };
    const { service, calls } = setup(response);
    assert.equal(await service[method](), response);
    assert.deepEqual(
      calls[0],
      params === undefined ? ['get', path + suffix] : ['get', path + suffix, params],
    );
  });
}
test('actionCode and language are forwarded without altering actions', async () => {
  const { service, context, calls } = setup();
  context.language = 'en';
  await service.getActions('BASIC_ATTACK');
  assert.deepEqual(calls[0], [
    'get',
    path + '/actions',
    { lang: 'en', actionCode: 'BASIC_ATTACK' },
  ]);
});
for (const command of [
  { type: 'START' },
  { type: 'ABANDON' },
  { type: 'CHOOSE_ACTION', actionId: 'opaque_ID:-/_Exact' },
]) {
  test(`${command.type} sends only the allowed fields and preserves the receipt`, async () => {
    const receipt = { status: 'ACTIVE' };
    const { service, context, calls } = setup(receipt);
    context.language = 'en';
    assert.equal(await service.play({ ...command, target: 'invented', cost: 999 }), receipt);
    assert.deepEqual(calls, [['post', path + '/play', command, { lang: 'en' }]]);
  });
}
test('only state converts 409 JOURNEY_REQUIRED to null', async () => {
  const { service, api } = setup();
  const error = failure(409, 'JOURNEY_REQUIRED');
  api.get = async () => {
    throw error;
  };
  assert.equal(await service.getState(), null);
  for (const method of ['getEvents', 'getTeams', 'getActions']) {
    await assert.rejects(service[method](), (err) => err === error);
  }
});
for (const status of [404, 409, 422, 500, 502]) {
  test(`preserves ${status} failures for all operations`, async () => {
    const { service, api } = setup();
    const error = failure(status, 'PUBLISHED_FAILURE');
    api.get = api.post = async () => {
      throw error;
    };
    for (const method of ['getState', 'getEvents', 'getTeams', 'getActions']) {
      await assert.rejects(service[method](), (err) => err === error);
    }
    await assert.rejects(service.play({ type: 'START' }), (err) => err === error);
  });
}
test('network failure becomes 502, never empty data', async () => {
  const { service, api } = setup();
  api.get = api.post = async () => {
    throw { isAxiosError: true, message: 'ECONNREFUSED' };
  };
  for (const method of ['getState', 'getEvents', 'getTeams', 'getActions']) {
    await assert.rejects(
      service[method](),
      (err) => err.getStatus() === 502 && err.getResponse().data === null,
    );
  }
  await assert.rejects(service.play({ type: 'START' }), (err) => err.getStatus() === 502);
});

from pathlib import Path
import argparse
import json
import os
import socket
import sqlite3
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

parser = argparse.ArgumentParser()
parser.add_argument('--output', required=True)
parser.add_argument('--game-port', type=int, default=55102)
parser.add_argument('--es-port', type=int, default=54102)
parser.add_argument('--en-port', type=int, default=54104)
args = parser.parse_args()
root = Path(__file__).resolve().parents[3]
out = Path(args.output).resolve()
out.mkdir(parents=True, exist_ok=True)
ports = [args.game_port, args.es_port, args.en_port]
for port in ports:
    with socket.socket() as probe:
        probe.bind(('127.0.0.1', port))
processes, streams = [], []


def start(name, cwd, environment):
    stream = open(out / (name + '.log'), 'w', encoding='utf-8')
    streams.append(stream)
    process = subprocess.Popen(['node', 'dist/main.js'], cwd=cwd,
                               env=dict(os.environ, **environment), stdout=stream, stderr=subprocess.STDOUT)
    processes.append(process)
    return process


def get(url):
    try:
        response = urllib.request.urlopen(url, timeout=5)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        return response.status, json.load(response)


try:
    with tempfile.TemporaryDirectory(prefix='r9-yani-') as temporary:
        database = Path(temporary) / 'game.sqlite'
        sql = root / 'game-api/scripts'
        with sqlite3.connect(database) as connection:
            connection.executescript('\n'.join((sql / file).read_text(encoding='utf-8') for file in [
                'init-schema.sql', 'seed-common-data.sql', 'themes/avengers-doomsday/seed-theme-data.sql']))
        game = start('game-api', root / 'game-api', {
            'APP_HOST': '127.0.0.1', 'APP_PORT': str(args.game_port),
            'DB_DATABASE': str(database), 'DB_SEED_THEME': 'avengers-doomsday', 'FINAL_BATTLE_DIFFICULTY': 'EASY'})
        for lang, port in [('es', args.es_port), ('en', args.en_port)]:
            start('bff-' + lang, root / 'backend/avengers-back', {
                'APP_HOST': '127.0.0.1', 'APP_PORT': str(port), 'APP_LANG': lang, 'TEAM_ID': 'hulk',
                'GAME_API_URL': f'http://127.0.0.1:{args.game_port}'})
        try:
            for _ in range(100):
                if any(process.poll() is not None for process in processes):
                    raise RuntimeError('Server stopped; inspect logs')
                try:
                    assert get(f'http://127.0.0.1:{args.game_port}/game/heroes')[0] == 200
                    for port in [args.es_port, args.en_port]:
                        assert get(f'http://127.0.0.1:{port}/gameCore/context')[0] == 200
                    break
                except (OSError, AssertionError):
                    time.sleep(.2)
            else:
                raise RuntimeError('Startup timed out')
            subprocess.run(['node', 'test/final-stage.contract.cjs', *[f'http://127.0.0.1:{p}' for p in ports]],
                           cwd=root / 'backend/avengers-back', check=True, timeout=120)
            game.terminate()
            game.wait(timeout=10)
            for port in [args.es_port, args.en_port]:
                status, payload = get(f'http://127.0.0.1:{port}/gameCore/final-stage/events')
                assert status == 502 and payload['data'] is None, (status, payload)
            print('PASS real API offline: R10 returns 502, never empty events', flush=True)
        finally:
            for process in processes:
                if process.poll() is None:
                    process.terminate()
                process.wait(timeout=10)
finally:
    for process in processes:
        if process.poll() is None:
            process.terminate()
            process.wait(timeout=10)
    for stream in streams:
        stream.close()

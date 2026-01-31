# Air Guitar Backend

FastAPIバックエンドサーバー

## インストール

```bash
cd backend
pip install -r requirements.txt
```

## 実行

```bash
uvicorn main:app --reload --port 8000
```

## APIエンドポイント

- `POST /api/scores` - スコア送信
- `POST /api/history` - プレイ履歴送信
- `GET /api/leaderboard?limit=10` - リーダーボード取得
- `GET /api/history/{player_id}?limit=20` - プレイヤー履歴取得
- `GET /api/stats/{player_id}` - プレイヤー統計取得

## データベース

SQLiteを使用。最初の起動時に`air_guitar.db`が自動生成されます。

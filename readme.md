# Slack mokumoku app

## 使い方

* Slack上で `/mokumoku` コマンドを叩くと作業開始モーダルが開きます
* もう一度 `/mokumoku` コマンドを叩くと作業終了モーダルが開きます
  * 作業終了報告をしないまま終了予定時間を30分過ぎると、ユーザーにアラートが飛びます
  * 作業終了報告をしないまま終了予定時間を30分過ぎると、作業時間0として記録されます
* Slack上で `/mokumoku` コマンドを叩くと作業の実績が表示されます
  * 作業をすればするほどランクアップしていくので、いっぱい作業しましょう

## 動作環境

node.js v 14.0 以降

## アプリケーションの動作方法

1. Slackにログインし、[アプリを新規作成](https://api.slack.com/apps?new_app=1)する

   1. `Beta features` をONにする
   2. `Interactivity & Shortcuts` の `Request URL` に `{アプリのURL}/slack/events` と入力して `Save Changes` する
   3. `Slash Commands` に `/mokumoku` と `/mokumoku-summary` を登録する。( `Request URL` の設定は1-2と同様)
   4. `Install App` でワークスペースにアプリをinstallする

2. GoogleアカウントでGoogle Cloud Platformに登録し、[Firebaseプロジェクトを新規作成](https://console.firebase.google.com/u/0/)する

   1. [Firebaseコンソール](https://console.firebase.google.com/u/0/)から2で作成したプロジェクトに移動し、Firestore Databaseを作成する(→[参考](https://qiita.com/watataku8911/items/ac040f4671c0f9a62bd4))
   2. 1.で作成したdatabaseで `+コレクションを開始`をクリックし、コレクションIDを `works`とする

3. アプリを配置するサーバーにアクセスする

   1. `git clone https://github.com/mega-yadoran/mokumoku` でcloneする

   2. `.env` ファイルを作成して以下の情報を入力する

      ```
      SLACK_SIGNING_SECRET={1で作成したSlackアプリのBasic InformationページのSigning Secret}
      SLACK_BOT_TOKEN={1で作成したSlackアプリのOAuth & PermissionsページのBot User OAuth Token}
      SLACK_TARGET_CHANNEL_ID={メッセージ投稿したいSlackチャンネルのID}
      SLACK_MY_USER_ID={自分のSlack UserID}
      RANK_IMAGE_BASE_PATH={ランク用画像のベースURLパス(任意)}
      ```

   3. [Firebaseのサービスアカウント用の秘密鍵ファイルを生成](https://firebase.google.com/docs/admin/setup?hl=ja#initialize-sdk)して `index.js` と同じディレクトリに配置する

   4.  以下のコマンドを叩く

      ```
      npm install
      npm install firebase-admin --save
      ```

   5. `node batch.js` を実行

   6.  以下のようなエラーログが出ているはずなので、書かれたURLにアクセスしてindexを作成する

      > The query requires an index. You can create it here: https://~

   7. `node index.js`を実行

   8. Slackで `/mokumoku` を投稿

   9. 6と同様にエラーログが出ているはずなので、書かれたURLにアクセスしてindexを作成する

   10. batchの定期実行設定をする。cronで設定する場合は以下の通り

       ```
       * *	* * *	root    cd {ソースをcloneしたパス} && node batch.js
       ```
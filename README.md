# Simple Office Chat Text v1

這是純文字版聊天室，不使用 Firebase Storage，因此不需要升級 Blaze，也不需要設定 Storage。

## 目前需要的 Firebase 功能

1. Authentication → Anonymous / 匿名：已啟用
2. Realtime Database：已建立
3. Realtime Database Rules：已發布

## 不需要設定

- Storage
- Firebase Hosting
- AI API
- 帳號密碼登入

## app.js 要填的 Firebase 設定

打開 `app.js`，找到最上方：

```js
const firebaseConfig = {
  apiKey: "請填入你的 Firebase apiKey",
  authDomain: "simple-office-chat.firebaseapp.com",
  databaseURL: "https://simple-office-chat-default-rtdb.firebaseio.com/",
  projectId: "simple-office-chat",
  storageBucket: "simple-office-chat.firebasestorage.app",
  messagingSenderId: "525327351854",
  appId: "請填入你的 Firebase appId"
};
```

請把 `apiKey` 和 `appId` 換成 Firebase Web App 畫面給你的值。

## 本機測試

建議用 VS Code 的 Live Server 開啟 `index.html`。

測試方式：

1. 開兩個瀏覽器視窗。
2. 第一個輸入暱稱：April，房間代碼：test001。
3. 第二個輸入暱稱：同事，房間代碼：test001。
4. 任一邊送出文字訊息。
5. 另一邊有同步看到，就代表成功。

## 功能

- 輸入暱稱
- 輸入房間代碼
- 相同房間代碼進入同一聊天室
- 傳送文字訊息
- 顯示傳送者與時間
- 聊天紀錄保留在 Realtime Database

## 暫停功能

- 圖片上傳
- 檔案上傳
- 已讀
- 訊息收回
- 通知

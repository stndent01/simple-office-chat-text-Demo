/*
  Simple Office Chat Text v1
  純文字聊天室版：不使用 Firebase Storage，因此不需要升級 Blaze。
*/

const firebaseConfig = {
  apiKey: "AIzaSyDqgeJOLWWTgs_ZQoHFHyjxbGwWQXVTRzs",
  authDomain: "simple-office-chat.firebaseapp.com",
  databaseURL: "https://simple-office-chat-default-rtdb.firebaseio.com/",
  projectId: "simple-office-chat",
  storageBucket: "simple-office-chat.firebasestorage.app",
  messagingSenderId: "525327351854",
  appId:"1:525327351854:web:476d82fae8e8ed89311fbf"
};

const MAX_TEXT_LENGTH = 1000;
const LAST_MESSAGE_LIMIT = 200;

const state = {
  uid: null,
  name: "",
  roomId: "",
  messagesRef: null,
  isFirebaseReady: false,
  messageKeys: new Set()
};

const $ = (selector) => document.querySelector(selector);

const loginView = $("#loginView");
const chatView = $("#chatView");
const loginForm = $("#loginForm");
const nameInput = $("#nameInput");
const roomInput = $("#roomInput");
const roomTitle = $("#roomTitle");
const userInfo = $("#userInfo");
const leaveButton = $("#leaveButton");
const messageList = $("#messageList");
const messageInput = $("#messageInput");
const sendButton = $("#sendButton");
const toast = $("#toast");

init();

function init() {
  nameInput.value = localStorage.getItem("officeChatName") || "";
  roomInput.value = localStorage.getItem("officeChatRoom") || "";

  bindEvents();
  prepareFirebase();
  renderEmptyState();
}

function bindEvents() {
  loginForm.addEventListener("submit", handleLogin);
  leaveButton.addEventListener("click", leaveRoom);
  sendButton.addEventListener("click", sendTextMessage);

  messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendTextMessage();
    }
  });

  messageInput.addEventListener("input", autoResizeTextarea);
}

function prepareFirebase() {
  if (!hasFirebaseConfig()) {
    showToast("請先在 app.js 填入 Firebase 設定");
    return;
  }

  try {
    firebase.initializeApp(firebaseConfig);
    firebase.auth().signInAnonymously().catch((error) => {
      console.error(error);
      showToast("Firebase 匿名登入失敗，請確認已啟用 Authentication Anonymous");
    });

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        state.uid = user.uid;
        state.isFirebaseReady = true;
        showToast("Firebase 已連線");
      }
    });
  } catch (error) {
    console.error(error);
    showToast("Firebase 初始化失敗，請檢查設定值");
  }
}

function hasFirebaseConfig() {
  return firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("請填入") &&
    firebaseConfig.appId && !firebaseConfig.appId.includes("請填入") &&
    firebaseConfig.databaseURL && !firebaseConfig.databaseURL.includes("請填入");
}

function handleLogin(event) {
  event.preventDefault();

  const rawName = nameInput.value.trim();
  const rawRoom = roomInput.value.trim();

  if (!rawName || !rawRoom) {
    showToast("請輸入暱稱與房間代碼");
    return;
  }

  if (!state.isFirebaseReady) {
    showToast("Firebase 尚未連線，請先完成設定");
    return;
  }

  state.name = rawName.slice(0, 20);
  state.roomId = normalizeRoomId(rawRoom);

  localStorage.setItem("officeChatName", state.name);
  localStorage.setItem("officeChatRoom", state.roomId);

  enterRoom();
}

function normalizeRoomId(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.#$\[\]/]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

function enterRoom() {
  loginView.classList.add("hidden");
  chatView.classList.remove("hidden");
  roomTitle.textContent = `Office Chat｜${state.roomId}`;
  userInfo.textContent = `${state.name} 已進入聊天室`;

  messageList.innerHTML = "";
  state.messageKeys.clear();
  renderSystemMessage("已進入聊天室。此版本支援純文字訊息。圖片功能先暫停。");

  state.messagesRef = firebase.database().ref(`rooms/${state.roomId}/messages`);
  state.messagesRef.limitToLast(LAST_MESSAGE_LIMIT).on("child_added", (snapshot) => {
    if (state.messageKeys.has(snapshot.key)) return;
    state.messageKeys.add(snapshot.key);
    renderMessage(snapshot.val());
  });
}

function leaveRoom() {
  if (state.messagesRef) {
    state.messagesRef.off();
  }
  state.messagesRef = null;
  state.roomId = "";
  state.messageKeys.clear();
  chatView.classList.add("hidden");
  loginView.classList.remove("hidden");
  messageList.innerHTML = "";
  renderEmptyState();
}

async function sendTextMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  if (text.length > MAX_TEXT_LENGTH) {
    showToast(`文字訊息不可超過 ${MAX_TEXT_LENGTH} 字`);
    return;
  }

  if (!canSend()) return;

  const payload = {
    type: "text",
    text,
    name: state.name,
    uid: state.uid,
    createdAt: Date.now()
  };

  try {
    await state.messagesRef.push(payload);
    messageInput.value = "";
    autoResizeTextarea();
  } catch (error) {
    console.error(error);
    showToast("訊息送出失敗，請檢查 Database 規則");
  }
}

function canSend() {
  if (!state.isFirebaseReady || !state.uid) {
    showToast("Firebase 尚未完成連線");
    return false;
  }
  if (!state.messagesRef || !state.roomId) {
    showToast("請先進入聊天室");
    return false;
  }
  return true;
}

function renderEmptyState() {
  messageList.innerHTML = `<div class="empty-state">尚未進入聊天室<br>請輸入暱稱與房間代碼</div>`;
}

function renderSystemMessage(text) {
  const div = document.createElement("div");
  div.className = "system-message";
  div.textContent = text;
  messageList.appendChild(div);
  scrollToBottom();
}

function renderMessage(message) {
  if (!message || !message.type) return;

  const row = document.createElement("div");
  row.className = "message-row";
  if (message.uid === state.uid) row.classList.add("mine");

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = `${message.name || "未知"} · ${formatTime(message.createdAt)}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  if (message.type === "text") {
    bubble.textContent = message.text || "";
  } else {
    bubble.textContent = "此版本暫不支援圖片訊息";
  }

  row.appendChild(meta);
  row.appendChild(bubble);
  messageList.appendChild(row);
  scrollToBottom();
}

function formatTime(timestamp) {
  if (!timestamp || typeof timestamp !== "number") return "傳送中";
  return new Intl.DateTimeFormat("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(timestamp));
}

function autoResizeTextarea() {
  messageInput.style.height = "auto";
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 120)}px`;
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    messageList.scrollTop = messageList.scrollHeight;
  });
}

let toastTimer = null;
function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2800);
}

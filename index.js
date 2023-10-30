let userName = "";
// начальная позиция игрока
let myPosition = {y:0, x:0};
let myColor = "";
let allUsersData = [];

const serverMess = [];
let errMess = "";

const inGame = document.querySelector(".inGame");
const numberOfUsers = document.querySelector(".numberOfUsers");
const messageField = document.querySelector(".messageField");
const errorDOM = document.querySelector(".error");
const exitBTN = document.querySelector(".exit");
const userNameForm = document.getElementById("userNameForm");

// ---------- WS connection 
// Browser clients must use the native WebSocket object !!!

const ws = new WebSocket("ws://localhost:1919");
// const ws = new WebSocket("wss://web-socket.onrender.com");

// Обработчик сообщений
ws.onmessage = ({data: message}) => {
  const messageDate = new Date;
  writeToLog({date: messageDate.toISOString(), message});
  
  if (message[0] !== "{" & message[0] !== "[") {
    if (message === "users limit") {
      errMess = message;
      message = `${message}, weight for an empty user's slot`;
    } else { 
      errMess = "" 
    };
    
    // if (message === "--ping--") ws.send(JSON.stringify({pong: myColor}));
    messageField.innerHTML = `<p>${message}<p>`;
    return;
  }
  
  const data = JSON.parse(message);

  if (Array.isArray(data) & data.length !== 0) { // Если массив, то делаем список юзеров
    makeUsersList(data);
    allUsersData = data;
    const lastObject = data[data.length - 1];

    if (lastObject.newUserName === userName) { // если это я ...
      console.log("Получаю мои первые данные");
      myPosition = lastObject.position;
      myColor = lastObject.color;
      data.forEach(el => { // рисую свою позицию ..
        document.querySelector(`.n${el.position.y}${el.position.x}`)
        .style.backgroundColor = el.color;
      });
      exitBTN.className = "exit";
      exitBTN.addEventListener("click", handleExit );
      window.addEventListener("keydown", handleMove); // слушаю свои ходы
      return;
    };

    if (myColor === "") return; // Если ещё не в игре, назад

    const { newUserName, position, color } = lastObject;
    messageField.innerHTML = `Присоединился новый игрок, ${newUserName}`
    document.querySelector(`.n${position.y}${position.x}`).style.backgroundColor = color
  };

  if (data.userLeft) { // кто-то из игроков вышел
    messageField.innerHTML = `Игрок ${data.userLeft} покинул нас`;
    // удаляем игрока из БД
    const user = allUsersData.find(user => user.newUserName === data.userLeft);
    clearLastPosition(user.position.y, user.position.x);

    allUsersData = allUsersData.filter(user => user.newUserName !== data.userLeft);
    makeUsersList(allUsersData);
  };

  if (data.move) { // кто-то двигается
    console.log("Move:", data)
    const {color, move} = data;
      
    setPosition(move.y, move.x, color);
    let x;
    let y;
    allUsersData = allUsersData.map(user => {
      if (user.color === color) {
        x = user.position.x;
        y = user.position.y;
        user.position = {y: move.y, x: move.x};
      };
      return user;
    })
    clearLastPosition(y, x);
  }
}

//        ***     ***     ***

(function login () {
  userNameForm.addEventListener("submit", (e) => {
    e.preventDefault();
    userName = e.target.elements.name.value;
    document.querySelector(".name").textContent = userName;
    ws.send(JSON.stringify({ newUser: userName }));
    userNameForm.classList.add("hidden");
    // userNameForm.remove(); // удаляем форму
    start();
  });
})();

function start() {
  // делаем поле игры
  let markup = "";
  for (y = 0; y <=9; y++) {
    for (x = 0; x <=9; x++) {
      markup = `${markup}<div class="position n${y}${x}"></div>`
    }
  }
  document.querySelector(".gameField").innerHTML = markup;
}
function handleMove (e) {
  switch (e.key) {
    case "ArrowLeft":
      if (myPosition.x === 0) break;
      clearLastPosition(myPosition.y, myPosition.x);
      myPosition.x -=1;
      setPosition(myPosition.y, myPosition.x, myColor);
      ws.send(JSON.stringify({color: myColor, move: {y: myPosition.y, x: myPosition.x}}))
      break;
    case "ArrowRight":
      if (myPosition.x === 9) break;
      clearLastPosition(myPosition.y, myPosition.x);
      myPosition.x +=1;
      setPosition(myPosition.y, myPosition.x, myColor);
      ws.send(JSON.stringify({color: myColor, move: {y: myPosition.y, x: myPosition.x}}))
      break;
    case "ArrowDown":
      if (myPosition.y === 9) break;
      clearLastPosition(myPosition.y, myPosition.x);
      myPosition.y +=1;
      setPosition(myPosition.y, myPosition.x, myColor);
      ws.send(JSON.stringify({color: myColor, move: {y: myPosition.y, x: myPosition.x}}))
      break;
    case "ArrowUp":
      if (myPosition.y === 0) break;
      clearLastPosition(myPosition.y, myPosition.x);
      myPosition.y -=1;
      setPosition(myPosition.y, myPosition.x, myColor);
      ws.send(JSON.stringify({color: myColor, move: {y: myPosition.y, x: myPosition.x}}))
      break;
    break;
  }
} 
function setPosition(y, x, color) {
  document.querySelector(`.n${y}${x}`).style.backgroundColor = color
}
function clearLastPosition (y, x) {
  document.querySelector(`.n${y}${x}`).style.backgroundColor = "rgb(153, 228, 153)";
}
function makeUsersList (data){
  if (data.length === 0) return;
  let markup = "";
  data.forEach( el => {
    if (el.newUserName !== userName) {
      markup = `${markup}<p style="color:${el.color}">User - ${el.newUserName}</p>`
    }
  });
  numberOfUsers.textContent = `${data.length}`;
  inGame.innerHTML = markup;
}
function handleExit () {
  console.log("exit");
  ws.send(JSON.stringify({exit: {userName, color: myColor}}));
  messageField.innerHTML = "Игра окончена";
  document.querySelector(".gameField").innerHTML = "";
  userNameForm.classList.remove("hidden");
}
function writeToLog (mess) {
  if (mess[0] !== "{" & mess[0] !== "[") {
    serverMess.push(mess);
  } else {
    serverMess.push(JSON.parse(mess));
  }
}
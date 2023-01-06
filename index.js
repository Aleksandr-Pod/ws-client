// const ws = new WebSocket("ws://localhost:1919");
const ws = new WebSocket("wss://web-socket.onrender.com");

let userName = "";
const userNameForm = document.getElementById("userNameForm");
userNameForm.addEventListener("submit", (e) => {
  e.preventDefault();
  // userName = e.target[0].value;
  userName = userNameForm.elements.name.value;
  console.log("userName:", userName);
  document.querySelector(".name").textContent = userName;
  // отправляем на бекенд имя нового юзера
  ws.send(JSON.stringify({newUser: userName}))
  userNameForm.remove(); // удаляем форму
  start();
});

function start() {

  // делаем поле игры
  let markup = "";
  for (y = 0; y <=9; y++) {
    for (x = 0; x <=9; x++) {
      markup = `${markup}<div class="position n${y}${x}"></div>`
    }
  }
  document.querySelector(".gameField").innerHTML = markup;

  // начальная позиция игрока
  let myPosition = {y:0, x:0};
  let myColor = "";
  let allUsersData = [];
  
  window.addEventListener("keydown", (e) => {
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
  });
  function setPosition(y, x, color) {
    document.querySelector(`.n${y}${x}`).style.backgroundColor = color
  }
  function clearLastPosition (y, x) {
    document.querySelector(`.n${y}${x}`).style.backgroundColor = "rgb(153, 228, 153)";
  }
  // приём сообщения с ws сервера
  const inGame = document.querySelector(".inGame");
  const numberOfUsers = document.querySelector(".numberOfUsers");
  
  const messageField = document.querySelector(".messageField");
  // const newUsers = [];
  
  ws.onmessage = ({data}) => {
    // Если не объект и не массив, то обычное сообщение

    if (data[0] !== "{" & data[0] !== "[") {
      console.log("message:", data);
      messageField.innerHTML = `<p>${data}<p>`
      return
    }

    const incomeData = JSON.parse(data);
    if (Array.isArray(incomeData)) {
      console.log('data is array:', incomeData);
      let markup = "";
      incomeData.forEach( el => {
        markup = `${markup}<p style="color:${el.color}">User - ${el.newUserName}</p>`
      });
      numberOfUsers.textContent = `${incomeData.length}`;
      inGame.innerHTML = markup;
      allUsersData = incomeData;

      const lastObject = incomeData[incomeData.length-1]

      if (lastObject.newUserName === userName) { // если это я ...
        console.log("пришли мои первые данные");
        myPosition = lastObject.position;
        myColor = lastObject.color;
        incomeData.forEach(el => {
          document.querySelector(`.n${el.position.y}${el.position.x}`)
          .style.backgroundColor = el.color;
        })
        return;
      }
      const {newUserName, position, color} = lastObject
      messageField.innerHTML = `Присоединился новый игрок, ${newUserName}`
      document.querySelector(`.n${position.y}${position.x}`).style.backgroundColor = color
    }

    if (incomeData.move) {
      const {color, move} = incomeData;
      messageField.innerHTML = `Игрок двигается ${move.x}, ${move.y}`
        
      setPosition(move.y, move.x, color)
        let x;
        let y;
        allUsersData = allUsersData.map(user => {
          if (user.color === color) {
            x = user.position.x;
            y = user.position.y;
            user.position = {y: move.y, x: move.x}
          }
          return user;
        })
        clearLastPosition(y, x)
      }
  }
}
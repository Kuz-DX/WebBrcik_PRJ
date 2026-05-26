const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// UI 요소 가져오기
const gameOverScreen = document.getElementById("gameOverScreen");
const gameOverMessage = document.getElementById("gameOverMessage");
const gameClearScreen = document.getElementById("gameClearScreen");
const mainScreen = document.getElementById("mainScreen");
const restartBtn = document.querySelectorAll(".restartBtn");
const mainBtn = document.querySelectorAll(".mainBtn");
const stageSelectBtn = document.getElementById("stageSelectBtn");
const stageSelectModal = document.getElementById("stageSelectModal");
const closeStageBtn = document.getElementById("closeStageBtn");
const stageItemBtns = document.querySelectorAll(".stage-item-btn");
const nextBtn = document.getElementById("nextBtn");
const questBox = document.getElementById("quest-box");
const difficultyBtn = document.getElementById("difficultyBtn");
const difficultyModal = document.getElementById("difficultyModal");
const closeDifficultyBtn = document.getElementById("closeDifficultyBtn");
const diffItemBtns = document.querySelectorAll(".diff-item-btn");

//대화창 관련 변수
let allStoryData = {"lunchTime": [
    { "speaker": "나", "text": "샘플 텍스트~" },
    { "speaker": "나", "text": "이거 다 끝나도 아직은 안넘어가요" },
    { "speaker": "나", "text": "정상이니까 k로 스테이지 넘겨주세요" }
  ]}; 
let currentScript = ["sampleText"]; 
let currentIndex = 0;



// 게임 상태 변수 선언
let x, y, dx, dy, paddleX;
let isGameOver = true;
let isGameStarted = false;
let isCleared = false; //스테이지 클리어 상태 변수

let ballOpacity = 1.0; // 공의 투명도
let opacityTimeoutId = null; // 투명도 복구 타이머 ID 15~16줄

const ballRadius = 12;
const paddleHeight = 10;
let paddleWidth = 100;
let targetPaddleWidth = 100;

//벽돌 기본 사이즈, 간격
const brickWidth = 80;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 35;

let bricks = [];
let currentStage = 2;    // 현재 진행 중인 스테이지 번호
let maxStage = 0; //최대 진행 스테이지 변수
let clearCount = 0; //이산수학 미니 스테이지 클리어 수
let brokenBricksCount = 0; // 부순 벽돌 개수
let totalBricks = 0;     // 스테이지마다 깨야 할 목표 벽돌 개수
let bombs = [];          // 폭탄들을 저장할 배열

const statusMap = { 
    "T":    { color: "#48dd57", effectFunc: tfHit },
    "F":    { color: "#d74e1d", effectFunc: tfHit },
    "NOT":  { color: "#555555", effectFunc: notHit },
    "CONFIRM": {color: "#9ec12b", effectFunc: confirmHit},

    // 논리 게이트 색상, 실행할 함수, 실제 연산식 한번에 정의
    "AND":  { color: "#8e8e8e", effectFunc: gateHit, operation: (a, b) => a && b },
    "OR":   { color: "#444444", effectFunc: gateHit, operation: (a, b) => a || b },    
    "XOR":  { color: "#555555", effectFunc: gateHit, operation: (a, b) => a !== b },
    "NAND": { color: "#555555", effectFunc: gateHit, operation: (a, b) => !(a && b) },
    "NOR":  { color: "#555555", effectFunc: gateHit, operation: (a, b) => !(a || b) },
    "XNOR": { color: "#555555", effectFunc: gateHit, operation: (a, b) => a === b }
};

// 이벤트 리스너 추가
document.addEventListener("mousemove", mouseMoveHandler, false);
restartBtn.forEach((item)=>{
    item.addEventListener("click", ()=>{
        if(isCleared) currentStage--;
        initGame();
    });
});// 다시 시작 버튼 클릭 시 게임 초기화
mainBtn.forEach((item)=>{
    item.addEventListener("click", ()=>{
        mainScreen.style.display = "flex";
        gameOverScreen.style.display = "none";
        gameClearScreen.style.display = "none";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        resizeGame(600,400);
    });
});//메인으로 가는 버튼
nextBtn.addEventListener("click",initGame); // 다음 단계 버튼 클릭 시 다음 단계 진행
canvas.addEventListener("click", clickBombHandler, false); // 폭탄 클릭 이벤트
startNewGameBtn.addEventListener("click", () => { //게임 시작 이벤트
      mainScreen.style.display = "none"; 
      currentStage = 0; 
      stageSelectModal.style.display = "flex";
});
stageItemBtns.forEach(btn => { //스테이지 선택 이벤트
      btn.addEventListener("click", (e) => {
          // 데이터 속성(data-stage)에서 스테이지 인덱스 추출
          let selectedStage = parseInt(e.target.getAttribute("value"));
          // 메인 화면 및 모달 닫기
          stageSelectModal.style.display = "none";
          mainScreen.style.display = "none";
          
          // 해당 스테이지로 전역 변수 변경 후 게임 초기화 구동
          currentStage = selectedStage;
          initGame();
      });
  });
//닫기 버튼 addevent
closeStageBtn.addEventListener("click", ()=>{
    stageSelectModal.style.display = "none";
    mainScreen.style.display = "flex";
});
difficultyBtn.addEventListener("click", () => {
      difficultyModal.style.display = "flex";
  });
  closeDifficultyBtn.addEventListener("click", () => {
      difficultyModal.style.display = "none";
  });

  // 난이도 버튼 클릭 시 동적 변경
diffItemBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
        // 기존에 선택된 active클래스를 삭제, 현재 클릭한 버튼에 부여
        const level = e.currentTarget.getAttribute("value");
        const selectLevel = diff[level];
        // targetPaddleWidth = config.paddle; //환경변수 통일 후 사용
        // gameSpeed = config.speed;
        // bombProb = config.bomb;
        diffItemBtns.forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        
        console.log(`난이도 변경 완료!`);
    });
});


function mouseMoveHandler(e) {
    const relativeX = e.clientX - canvas.getBoundingClientRect().left;
    if(relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
        if (paddleX < 0) paddleX = 0;
        if (paddleX + paddleWidth > canvas.width) paddleX = canvas.width - paddleWidth;
    }
}

window.addEventListener("keydown", (e) => {
    if (e.key === 'k') {
        clearGame(); //클리어 화면 출력
    }
  });
window.addEventListener("load", () => {
  console.log("대화창 관련 요소 로딩 시작");

  const dialogueBox = document.getElementById("quest-box");
  
  if (dialogueBox) {
    dialogueBox.addEventListener("click", (e) => {
      if (e.button === 0) nextDialogue();
    });
    console.log("대화창 클릭 이벤트 연결");
  } else {
    console.error("HTML에서 'quest-box' ID를 찾을 수 없습니다. HTML 코드를 확인해주세요.");
  }

  window.addEventListener("keydown", (e) => { //스페이스나 엔터로 다음 창 진행
    if (e.key === ' ' || e.key === 'Enter') {
      if (e.key === ' ') e.preventDefault(); //스페이스로 화면 내려가기 방지
      nextDialogue();
    }
  });

  //loadGameData();
});
// async function loadGameData() { //웹서버 구축 후 사용 예정
//   try {
//     const response = await fetch('./scripts.json'); 
//     if (!response.ok) throw new Error(`HTTP 상태코드: ${response.status}`);
    
//     allStoryData = await response.json();
//     //initGame(); // ★ 데이터를 먼저 받고 게임 초기화를 진행하도록 순서 변경
//   } catch (error) {
//     console.error("데이터를 불러오는 중 에러 발생:", error);
//   }
// }


function clickBombHandler(e) { //폭탄 클릭 핸들러
    const relativeX = e.clientX - canvas.getBoundingClientRect().left;
    const relativeY = e.clientY - canvas.getBoundingClientRect().top;
    
    for (let i = 0; i < bombs.length; i++) {
        let b = bombs[i];
        if (b.isActive) {
            // 폭탄 중심과 마우스 클릭 위치 간의 거리 계산
            const dist = Math.hypot(relativeX - b.x, relativeY - b.y);
            if (dist <= b.radius + 10) { // 마우스 클릭 판정을 넉넉하게 주기 위해 +10
                b.isActive = false; // 폭탄 해제 (클릭 시 사라짐)
            }
        }
    }
}

// === 무결점 디버그 시스템: Z(보스 직행) & K(스테이지 스킵) 이벤트 (최적화 버전) ===
document.addEventListener("keydown", cheatKeyHandler, false);

function cheatKeyHandler(e) {
    if (e.key === 'z' || e.key === 'Z') {
        
        if (currentStage !== 2) {
            currentStage = 2; 
            initGame(); 
        }

        let destroyedByCheat = 0;

        for (let i = 0; i < bricks.length; i++) {
            let b = bricks[i];
            
            if (b.realType !== "BOSS" && b.status !== 0) {
                b.status = 0; 
                destroyedByCheat++;
            } else if (b.realType === "BOSS" && b.status !== 0) {
                
                // 💡 치트키로 잠금이 풀릴 때도 웅장하게 거대화!
                if (b.status === "LOCK") {
                    let expandWidth = brickWidth * 2;
                    let expandHeight = brickWidth * 2;
                    
                    b.x = b.x + (b.width / 2) - (expandWidth / 2);
                    b.y = b.y + (b.height / 2) - (expandHeight / 2);
                    b.width = expandWidth;
                    b.height = expandHeight;
                    
                    if (b.tempData) b.color = b.tempData.color;
                }
                
                b.hp = 15;
                b.status = 1;
            }
        }
        
        brokenBricksCount += destroyedByCheat;
    }
}

class Bomb { //폭탄배열
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.dy = 1; // 떨어지는 속도
        this.isActive = true;
    }

    draw(ctx) {
        if (!this.isActive) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#2C3E50"; // 폭탄 색상
        ctx.fill();
        ctx.closePath();
        
        // 폭탄 심지 그리기
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.radius);
        ctx.lineTo(this.x + 5, this.y - this.radius - 5);
        ctx.strokeStyle = "#E74C3C";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }

    update() {
        if (!this.isActive) return;
        this.y += this.dy;
        
        // 바닥에 닿으면 게임 오버
        if (this.y + this.radius > canvas.height) {
            endGame("폭탄이 바닥에 떨어졌습니다. 게임 오버!");
            this.isActive = false;
        }
    }
}

//객체에서 Brick class로 변경, 속성이 많아질 거 같아 Object.assign으로 구현
class Brick {
    constructor(x, y, option = {}) { //생성할때 x,y는 필수로 넣고 나머지는 baseSettings 에서 바꾸고 싶은것만 {}로 감싸서 넣으면 됨, 없는 속성 추가도 가능
        this.x = x;
        this.y = y;

        const baseSettings = {
            //status 0:깨진블록 1:일반블록 T:true블록 F:false블록
            status: 1,
            effectFunc: ()=>{},
            color: "#787878",
            text: "" //텍스트 추가(블럭위에 써질것)
        };

        Object.assign(this, baseSettings, option);
    }

    onHit() { //블록 쳤을때 기능 함수 실행 //status 맵 활용 추가
        const currentFunc = statusMap[this.status] || {effectFunc: this.effectFunc};
        this.effectFunc = currentFunc.effectFunc;
        this.effectFunc();
        if(this.status===1){
            this.status = 0;
            brokenBricksCount++;
        }
    }

    draw(ctx) {
        if (this.status !== 0) {
            //statusMap에 없으면 baseSetting color로
            const currentStyle = statusMap[this.status] || { color: this.color };
            ctx.beginPath();
            ctx.rect(this.x, this.y, brickWidth, brickHeight);
            ctx.fillStyle = currentStyle.color; //currentStyle로 변경
            ctx.fill();
            ctx.closePath();

            if(typeof this.status === "string") this.text = this.status;           
            if (this.text !== "") { //블럭위에 글씨 추가
                ctx.fillStyle = "#FFFFFF";
                ctx.font = "bold 14px 'Galmuri11', sans-serif"; // css에 정의된 픽셀 폰트 적용
                ctx.textAlign = "center";   
                ctx.textBaseline = "middle";

                // 블록의 정중앙 좌표를 계산하여 텍스트 쓰기
                ctx.fillText(this.text, this.x + brickWidth / 2, this.y + brickHeight / 2);
            }
        }
    }
}

class BossBrick extends Brick {
    constructor(x, y, option = {}) {
        super(x, y, option); 
        this.maxHp = option.hp || 1; 
        this.hp = this.maxHp;         
        this.width = option.width || brickWidth;
        this.height = option.height || brickHeight;
        this.isIndestructible = option.indestructible || false; 
        
        this.realText = option.realText || option.text || ""; 
        this.realType = option.realType || ""; // 객체 타입 식별용 은닉 변수


        // blockPool에는 type,text,color,hp,indestructible 속성들이 저장되어 있음. 그걸 ...으로 표시
        // 그리고 layer라는 속성을 추가로 저장시킴
    }

    onHit() {
        if (this.status === "LOCK") return; 
        if (this.isIndestructible) return; // private 블록 무적 방어

        if (this.status === 1) {
            this.hp--; 
            // hit 할 수 있는 상황이라면 
            // 생명력이 감소

            if (this.hp <= 0) {
                // 생명력이 0보다 작아지면 hit되므로 감소
                this.status = 0;
                brokenBricksCount++; 
                this.effectFunc(); 
            }
        }
    }

    draw(ctx) {
        if (this.status === 0) return;

        // 계층이 아직 열리지 않았으면 검정색으로
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        let displayText = this.text || "";
        
        if (displayText !== "") {
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 12px 'Galmuri11', sans-serif"; 
            ctx.textAlign = "center";   
            ctx.textBaseline = "middle";
            ctx.fillText(displayText, this.x + this.width / 2, this.y + this.height / 2);
        }

        // 3. 체력바는 오직 BOSS 타입에게만 허락
        if (this.realType === "BOSS" && this.status === 1 && this.hp > 0) {
            const barWidth = this.width - 10; 
            const barHeight = 4;              
            const barX = this.x + 5;
            const barY = this.y + 3;

            ctx.fillStyle = "#FF0000";
            ctx.fillRect(barX, barY, barWidth, barHeight);

            const currentWidth = (this.hp / this.maxHp) * barWidth;
            ctx.fillStyle = "#00FF00";
            ctx.fillRect(barX, barY, currentWidth, barHeight);

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
    }
}



class Stage4Brick extends Brick {
    constructor(x, y, option = {}) {
        super(x, y, option);
        this.dsType = option.dsType || "stack"; // "stack" 또는 "queue"
        
        // 배열 크기를 3 또는 4로 랜덤 설정
        const size = Math.random() < 0.5 ? 3 : 4;
        this.elements = [];
        for (let i = 1; i <= size; i++) {
            this.elements.push(i);
        }
        
        // 배열 내용을 모두 표시하기 위해 가로 폭을 1.5배로 넓게 설정
        this.width = brickWidth * 1.5;
        this.height = brickHeight;
    }

    onHit() {
        if (this.status === "LOCK") return; 

        const currentFunc = statusMap[this.status] || {effectFunc: this.effectFunc};
        this.effectFunc = currentFunc.effectFunc;

        if (this.status === 1) {
            if (this.elements.length > 0) {
                if (this.dsType === "stack") {
                    this.elements.pop(); // 맨 뒤 원소 삭제
                } else if (this.dsType === "queue") {
                    this.elements.shift(); // 맨 앞 원소 삭제
                }
            }

            // 원소가 모두 없어지면 블럭 파괴
            if (this.elements.length === 0) {
                this.status = 0;
                brokenBricksCount++;
                this.effectFunc();
            } else {
                this.effectFunc();
            }
        }
    }

    draw(ctx) {
        if (this.status === 0) return;

        // 계층이 아직 열리지 않았으면 검정색으로
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // 스택/큐의 타입과 남은 원소 배열 상태를 동적으로 텍스트로 렌더링
        let displayText = `${this.dsType.toUpperCase()} [${this.elements.join(", ")}]`;
        
        if (displayText !== "") {
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 12px 'Galmuri11', sans-serif"; 
            ctx.textAlign = "center";   
            ctx.textBaseline = "middle";
            ctx.fillText(displayText, this.x + this.width / 2, this.y + this.height / 2);
        }

        // 3. 체력바는 오직 BOSS 타입에게만 허락
        if (this.realType === "BOSS" && this.status === 1 && this.hp > 0) {
            const barWidth = this.width - 10; 
            const barHeight = 4;              
            const barX = this.x + 5;
            const barY = this.y + 3;

            ctx.fillStyle = "#FF0000";
            ctx.fillRect(barX, barY, barWidth, barHeight);

            const currentWidth = (this.hp / this.maxHp) * barWidth;
            ctx.fillStyle = "#00FF00";
            ctx.fillRect(barX, barY, currentWidth, barHeight);

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
    }
}
const diff = { //난이도 객체
    easy: {
        paddleWidth : 15,
        speed : 10,
        bombProb : 3
    },
    normal: {
        paddleWidth : 10,
        speed : 15,
        bombProb : 10,
    },
    gosu : {
        paddleWidth : 7,
        speed : 20,
        bombProb : 15
    },
    goat : {
        paddleWidth : 5,
        speed : 25,
        bombProb : 25
    }
}
//대화 관련 함수
function startScene(sceneName) {
  isGameStarted = false; // 대화가 시작되면 물리엔진을 멈춤
  questBox.style.display = "block";
  currentScript = allStoryData[sceneName]; 
  currentIndex = 0; 
  showDialogue(); 
}

function showDialogue() {
  const speakerEl = document.getElementById("speaker");
  const dialogueEl = document.getElementById("dialogue");

  if (!speakerEl || !dialogueEl) return;

  if (currentIndex < currentScript.length) {
    const currentLine = currentScript[currentIndex];
    speakerEl.innerText = currentLine.speaker;
    dialogueEl.innerText = currentLine.text;
  } else {
    if(isGameOver) handleSceneEnd();
    else handleGameStart();
  }
}

function handleGameStart() {
    if (questBox) {
        questBox.innerHTML = "<p>게임이 시작됩니다!</p><button id='startBtn'>시작</button>";
        const startBtn = document.getElementById("startBtn");
        
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                questBox.style.display = 'none';
                gameOverScreen.style.display = "none";
                isGameStarted = true; // 시작 버튼을 눌러야 물리 엔진 작동 시작
            });
        }
    }
}

function handleSceneEnd() {
    if(questBox) {
      questBox.style.display = 'none';
    }
}

function nextDialogue() {
  if (!currentScript || currentScript.length === 0 || isGameStarted) return; // ★ 이미 게임이 시작됐다면 대화창 이벤트 무시 
  currentIndex++;
  showDialogue();
}


//==== 스테이지들 ======
//스테이지 별로 맵 로드
function showStage() { //스테이지 선택 화면
    stageSelectModal.style.display = "flex";
    gameOverScreen.style.display = "none";
}
function loadStage(stageIndex){
    //화면, 카운트 초기화
    bricks = [];
    brokenBricksCount = 0;
    totalBricks = 0;
    bombs = []; // 폭탄 배열 초기화

    //stageIndexdp 따라 함수를 호출
    switch(stageIndex){
        case 0:
            loadTutorialStage();
            break;
        case 1:
            loadDiscreteStage();
            break;
        case 2:
            loadOopStage();
            break;
        case 3:
            loadLunchStage();
            break;
        case 4:
            loadDSStage4();
            break;
        case 5:
            loadWebprogrammingStage();
            break;
        default:
            endGame("모든 스테이지를 클리어했습니다! 최종 승리!");
            break;
    }
}
function loadTutorialStage(){
    // 벽돌 배열 기본 생성 (최초 1회) // 미리 X,Y 계산해서 객체 생성하도록 변경 
    const brickRowCount = 4;
    const brickColumnCount = 6;
    const colors = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00"];
    canvas.style.backgroundImage = "url(./testImg/CProgramming.png)";
    for(let c = 0; c < brickColumnCount; c++) {
        for(let r = 0; r < brickRowCount; r++) {
            let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
            let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;

            //bricks를 2차원->1차원 배열로 변경
            if(r == brickRowCount-1 && c == 2){ // 마지막행 3열에 테스트용 투명화 블록 생성
                bricks.push(new Brick(brickX, brickY, {color: "#000000", effectFunc:()=>setBallOpacity(0.2)}));
                totalBricks++;
                continue;
            }

            if(r==brickRowCount-4&&c==1){
                bricks.push(new Brick(brickX, brickY, {color: "blue",effectFunc:subBarsize})); //함수 자체를 줘야함
                totalBricks++;

                continue;
            }

            if(r==brickRowCount-2&&c==3){
                bricks.push(new Brick(brickX, brickY, {color: "purple",effectFunc:addBarsize}));
                totalBricks++;
                continue;
            }

            bricks.push(new Brick(brickX, brickY, {color: colors[r]})); //클래스로 생성
            totalBricks++;
        }
    }
}




//===================================================
// 게임 초기화 및 재시작 함수
function initGame() {
    x = canvas.width / 2;
    y = canvas.height - 30;
    const speed = 5; //속도지정
    const startAngle = Math.random()*Math.PI / 4;  //처음 발사될때의 각도 지정
    // 속도와 각도로 dx, dy를 계산
    dx = speed * Math.sin(startAngle);
    dy = -speed * Math.cos(startAngle);

    paddleX = (canvas.width - paddleWidth) / 2;
    brokenBricksCount = 0;
    isGameOver = false;
    isGameStarted = true;
    //isGameStarted = false; 스크립트 추가 후 사용예정
    isCleared = false;
    ballOpacity = 1.0; // 투명도 초기화 63~67줄
    if (opacityTimeoutId !== null) {
        clearTimeout(opacityTimeoutId);
        opacityTimeoutId = null;
    }
    // 스테이지 불러오기
    resizeGame(600,400); //화면 사이즈 조정

    // UI 숨기고 그리기 시작
    questBox.style.display = "none";
    gameClearScreen.style.display = "none";
    gameOverScreen.style.display = "none";
    
    loadStage(currentStage);
    draw();
}

//=== 기능 함수들(tutorial) ===
function setBallOpacity(opacity) { // 공 투명도 조절 함수
    // 파라미터 0.0 ~ 1.0 범위제한
    ballOpacity = Math.max(0.0, Math.min(1.0, opacity));

    // 기존 타이머가 작동 중이면 취소
    if (opacityTimeoutId !== null) {
        clearTimeout(opacityTimeoutId);
    }

    // 10초 후 투명도를 1.0으로 복구
    opacityTimeoutId = setTimeout(() => {
        ballOpacity = 1.0;
        opacityTimeoutId = null;
    }, 10000);
}

function subBarsize(){
    targetPaddleWidth = Math.max(40, targetPaddleWidth - 50);
}

function addBarsize(){
    targetPaddleWidth = Math.min(canvas.width/2, targetPaddleWidth + 50);
}

function spawnRandomBrick() { //블럭을 깨고 다시 블럭이 랜덤위치에 생성되는 기능
    const randomX = Math.random() * (canvas.width - brickWidth);
    const randomY = Math.random() * (canvas.height / 2 - brickHeight);
    const colors = ["#E74C3C", "#9B59B6", "#3498DB", "#2ECC71", "#F1C40F"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    bricks.push(new Brick(randomX, randomY, { color: randomColor, effectFunc: () => {} }));
    totalBricks++; // 클리어해야 할 전체 블록 개수 증가
}
//==============

// 게임 종료 처리 함수
function endGame(message) {
    isGameOver = true;
    isGameStarted = false;
    gameOverMessage.innerText = message;
    gameOverScreen.style.display = "flex"; // 오버레이 화면 표시
}
// 게임 클리어 처리 함수, currentstage++ 과 최대 도달 스테이지 갱신
function clearGame(){
    isGameOver = true;
    isGameStarted = false;
    isCleared = true;
    currentStage++;
    if (currentStage > maxStage) maxStage = currentStage;
    gameClearScreen.style.display = "flex";
}

// 충돌 감지 함수
// === 무결점 물리 엔진 (1프레임 1충돌, 끼임 방지 및 정밀한 모서리 반사 적용) ===
function collisionDetection() {
    let hasCollidedThisFrame = false; // 1프레임 1충돌을 보장하기 위한 플래그

    for(let i = 0; i < bricks.length; i++) {
        if (hasCollidedThisFrame) break; // 이번 프레임에서 이미 충돌을 처리했다면 연산 중단

        let b = bricks[i];
        if(b.status !== 0) { 
            let currentWidth = b.width || brickWidth;
            let currentHeight = b.height || brickHeight;

            // 1. 블록의 사각형 영역 안에서 공의 중심(x, y)과 가장 가까운 지점(충돌점) 찾기
            let closestX = Math.max(b.x, Math.min(x, b.x + currentWidth));
            let closestY = Math.max(b.y, Math.min(y, b.y + currentHeight));

            // 2. 피타고라스 정리를 이용해 공 중심과 가장 가까운 지점 간의 거리 계산
            let distanceX = x - closestX;
            let distanceY = y - closestY;
            let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

            // 3. 거리가 공의 반지름(ballRadius)보다 작으면 충돌 발생!
            if (distanceSquared < (ballRadius * ballRadius)) {
                hasCollidedThisFrame = true; // 다중 파괴 원천 차단

                // 4. 공이 뚫고 들어온 방향을 알아내기 위해 이전 프레임 위치 계산
                let prevX = x - dx;
                let prevY = y - dy;

                let hitTopOrBottom = (prevY <= b.y || prevY >= b.y + currentHeight);
                let hitLeftOrRight = (prevX <= b.x || prevX >= b.x + currentWidth);

                // 5. 충돌 면에 따른 반사 처리
                if (hitTopOrBottom && !hitLeftOrRight) {
                    // 상하 평면 충돌
                    dy = -dy; 
                    y = (prevY <= b.y) ? b.y - ballRadius : b.y + currentHeight + ballRadius;
                } 
                else if (hitLeftOrRight && !hitTopOrBottom) {
                    // 좌우 평면 충돌
                    dx = -dx; 
                    x = (prevX <= b.x) ? b.x - ballRadius : b.x + currentWidth + ballRadius;
                } 
                else {
                    // ==========================================
                    // 💡 [핵심 구현] 모서리 정밀 충돌 물리 엔진 적용
                    // ==========================================
                    let distance = Math.sqrt(distanceSquared);
                    
                    // 예외 처리: 공의 중심이 정확히 모서리와 겹친 경우 (단순 반전)
                    if (distance === 0) {
                        dx = -dx;
                        dy = -dy;
                    } else {
                        // 1) 법선 벡터 정규화 (길이를 1로 만듦)
                        let nx = distanceX / distance;
                        let ny = distanceY / distance;

                        // 2) 속도 벡터와 법선 벡터의 내적(Dot Product) 계산
                        let dotProduct = (dx * nx) + (dy * ny);

                        // 3) 반사 벡터 공식 (Reflection Vector) 적용
                        dx = dx - 2 * dotProduct * nx;
                        dy = dy - 2 * dotProduct * ny;
                        
                        // 4) 모서리 끼임(겹침) 방지를 위해 공을 충돌 지점 바깥으로 정확히 밀어냄
                        x = closestX + nx * ballRadius;
                        y = closestY + ny * ballRadius;
                    }
                }

                // 블록 타격 효과 실행
                b.onHit(); 

                // 클리어 조건 검사
                if(brokenBricksCount >= totalBricks) {
                    
                    if (currentStage === 1) {//이산수학 미니 스테이지
                        const targetGateCount = 3; //미니 스테이지 수
                        clearCount++;
                        
                        if (clearCount < targetGateCount) {                           
                            bricks = [];
                            brokenBricksCount = 0;
                            totalBricks = 0;
                            loadDiscreteStage();
                            return;
                        }else clearCount = 0;
                    }
                    clearGame();
                }
            }
        }
    }
}
//=== 그리기 함수들 ===
function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255, 0, 0, ${ballOpacity})`; // RGBA를 사용하여 투명도 적용
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#000000"; 
    ctx.fill();
    ctx.closePath();

    //패들에 글씨출력 부분
    ctx.fillStyle = "#FFFFFF"; // 글씨 색상
    ctx.font = "bold 12px 'Galmuri11', sans-serif"; // 기존 사용 중인 폰트 
    ctx.textAlign = "center";   // 가로 정렬 기준을 중앙으로
    ctx.textBaseline = "middle"; // 세로 정렬 기준을 중앙으로

    // 패들의 정중앙 X 좌표와 Y 좌표 계산
    const textX = paddleX + (paddleWidth / 2);
    const textY = (canvas.height - paddleHeight) + (paddleHeight / 2);

    // 텍스트 출력 (예: 5)
    ctx.fillText(`count : ${brokenBricksCount}`, textX, textY);
}

function drawBricks() { //Brick class에 draw 메소드 이용해 변경 //1차원 틀로 변경
    for(let i = 0; i < bricks.length; i++) {
        bricks[i].draw(ctx);
    }
}

// 폭탄 생성 함수
function spawnBomb(x, y) {
    bombs.push(new Bomb(x, y));
}

// 폭탄 그리기 함수
function drawBombs() {
    for(let i = 0; i < bombs.length; i++) {
        bombs[i].draw(ctx);
    }
}


// === 무결점 업데이트: 패들 히트박스 확장 및 가장자리 튕김 보정 ===
function updateBall(){
    // 1. 좌우 벽면 충돌
    if(x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    
    // 2. 상단 벽면 충돌
    if(y + dy < ballRadius) {
        dy = -dy;
    } 
    // 3. 패들 충돌 확인 (히트박스 확장)
    else if(y + dy > canvas.height - ballRadius - paddleHeight) {
        // [수정됨] 공의 중심(x)이 아니라, 테두리(ballRadius)가 닿았을 때도 충돌로 인정합니다.
        if(x > paddleX - ballRadius && x < paddleX + paddleWidth + ballRadius) {
            
            let speed = Math.sqrt(dx * dx + dy * dy);
            
            let hitPoint = x - (paddleX + paddleWidth / 2);
            // [수정됨] 확장된 히트박스 비율에 맞춰 정규화 분모도 넓혀줍니다.
            let normalizedHit = hitPoint / ((paddleWidth / 2) + ballRadius);
            
            // 안전장치: 비율이 -1 ~ 1을 초과하지 않도록 제한 (공이 맵 밖으로 튕기는 것 방지)
            normalizedHit = Math.max(-1, Math.min(1, normalizedHit));
            
            let bounceAngle = normalizedHit * (Math.PI / 3); 
            
            dx = speed * Math.sin(bounceAngle);
            dy = -speed * Math.cos(bounceAngle); 
        }
    }
    
    // 4. 바닥에 닿았을 때 게임 오버
    if(y + dy > canvas.height - ballRadius) {
        endGame("바닥에 닿았습니다. 게임 오버!");
        return;
    }
    
    x += dx;
    y += dy;
}

function updatePaddle(){ //함수화
    let previousWidth = paddleWidth; 
    paddleWidth += (targetPaddleWidth - paddleWidth) * 0.016; 
   
    paddleX =paddleX- (paddleWidth - previousWidth) / 2;

    if (paddleX + paddleWidth > canvas.width) {
        paddleX = canvas.width - paddleWidth;
    }
}

function updateBombs() {
    for(let i = 0; i < bombs.length; i++) {
        bombs[i].update();
    }
}

// 메인 게임 루프
function draw() {
    // 게임 오버 상태면 그리기 루프 중단
    if (isGameOver) return; 

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBricks();
    drawBall();
    drawPaddle();
    drawBombs();

    if(isGameStarted){ //게임 시작 시에만 작동
        collisionDetection();
        updateBall();
        updatePaddle();
        updateBombs();
    }

    // 충돌 감지 직후 승리하여 isGameOver가 true로 바뀌었다면 진행 멈춤
    if (isGameOver) return; 
    requestAnimationFrame(draw);
}

//==== 이산수학 스테이지 기능 구현중 ====
function tfHit(){
    if(this.status === "T") this.status = "F";
    else if(this.status === "F") this.status = "T";
}
function notHit() {
    let tfCount = 0;
    
    bricks.forEach(b => {
        if(b.status === "T") { b.status = "F"; tfCount++; }
        else if(b.status === "F") { b.status = "T"; tfCount++; }
    });
    
    // TF 블록이 없으면 파괴
    if (tfCount === 0) {
        this.status = 0;
        brokenBricksCount++;
    }
}

// 실시간 논리 회로 연산 엔진
function updateCircuits() {
    const dX = brickWidth + brickPadding;
    const dY = brickHeight + brickPadding;

    for (let i = 0; i < bricks.length; i++) {
        let b = bricks[i];
        if (b.status === 0) continue;

        let gateInfo = statusMap[b.status];
        
        // 현재 블록이 논리 연산이 가능한 게이트라면
        if (gateInfo && gateInfo.operation) {
            
            // 아래 양옆의 입력 블록과, 위쪽의 출력 블록을 찾음
            let leftIn = bricks.find(br => br.status !== 0 && br.x === b.x - dX && br.y === b.y + dY);
            let rightIn = bricks.find(br => br.status !== 0 && br.x === b.x + dX && br.y === b.y + dY);
            let topOut = bricks.find(br => br.status !== 0 && br.x === b.x && br.y === b.y - dY);

            // 3개가 모두 존재한다면 실시간으로 계산하여 출력 블록을 덮어씌움
            if (leftIn && rightIn && topOut) {
                let lVal = (leftIn.status === "T");
                let rVal = (rightIn.status === "T");
                let res = gateInfo.operation(lVal, rVal);
                
                // 위쪽 블록이 T나 F일 때만 값을 바꿔줌 (안전장치)
                if (topOut.status === "T" || topOut.status === "F") {
                    topOut.status = res ? "T" : "F";
                }
            }
        }
    }
}

function confirmHit() { //논리 게이트 출력이 T일때 치면 전부 파괴
    // 맵 생성할 때 지정해둔 아래쪽(leftInput 위치) 블록을 바로 참조
    let belowBlock = this.leftInput; // CONFIRM 입장에서는 아래쪽 F블록이 leftInput 자리에 있음
    
    if (belowBlock && belowBlock.status === "T") {
        bricks.forEach(br => {
            if (br.status !== 0) {
                br.status = 0;
                brokenBricksCount++;
            }
        });
    }
}

function gateHit() {
    let leftInput = null;
    let rightInput = null;
    let topOutput = null;

    // 블록 간의 가로, 세로 간격 계산
    const distanceX = brickWidth + brickPadding; 
    const distanceY = brickHeight + brickPadding;

    //Gate 블록 주변의 입출력 블록 탐색
    for (let i = 0; i < bricks.length; i++) {
        let b = bricks[i];
        
        // 위쪽 출력 블록 x 같고, y 한칸 위
        if (b.x === this.x && b.y === this.y - distanceY) {
            topOutput = b;
        }
        // 왼쪽 아래 입력 블록 x 한칸 왼쪽, y 한칸 아래
        else if (b.x === this.x - distanceX && b.y === this.y + distanceY) {
            leftInput = b;
        }
        // 오른쪽 아래 입력 블록 x 한칸 오른쪽, y 한칸 아래
        else if (b.x === this.x + distanceX && b.y === this.y + distanceY) {
            rightInput = b;
        }
    }

    // 세 개의 블록이 모두 제자리에 존재하는지 확인
    if (leftInput && rightInput && topOutput) {
        
        // T/F 문자를 boolean으로 변환
        let leftVal = (leftInput.status === "T");
        let rightVal = (rightInput.status === "T");
        let topVal = (topOutput.status === "T");
        
        const currentGate = statusMap[this.status];

        // 해당 블록에 operation 있는지 확인
        if (currentGate && currentGate.operation) {
            
            // 꺼내온 operation을 이용해 계산 실행
            let expectedResult = currentGate.operation(leftVal, rightVal);

            // 결과가 topVal과 일치하면 전부 파괴
            if (expectedResult === topVal) {
                this.status = 0;
                leftInput.status = 0;
                rightInput.status = 0;
                topOutput.status = 0;
                
                brokenBricksCount += 4;
            }
        }
    }
}

function randomDiscreteMap() { // 맵 랜덤생성
    // 게이트만 배열로 추출
    const Gates = Object.keys(statusMap).filter(key => statusMap[key].operation);

    const randomGate = Gates[Math.floor(Math.random() * Gates.length)];

    const leftVal = Math.random() < 0.5 ? "T" : "F";
    const rightVal = Math.random() < 0.5 ? "T" : "F";

    const leftBool = (leftVal === "T");
    const rightBool = (rightVal === "T");
    
    // statusMap에서 연산식 꺼내서 계산
    const resultBool = statusMap[randomGate].operation(leftBool, rightBool);
    const topVal = resultBool ? "T" : "F";

    return [
        [1, 0, topVal, 0, 0, 1],
        [1, 0, randomGate, 0, 0, 1, 1],
        [1, leftVal, 0, rightVal, 1, "NOT",1]
    ];
}


function loadDiscreteStage() {
    canvas.style.backgroundImage = "url(./testImg/Discrete.png)";
    const map = randomDiscreteMap();
    const brickRowCount = map.length;
    const brickColumnCount = map[0].length;

    for (let r = 0; r < brickRowCount; r++) { //차후에 blockdraw 이용해서 변경예정
        for (let c = 0; c < brickColumnCount; c++) {
            let blockStatus = map[r][c];

            if (blockStatus === 0 || blockStatus === null || blockStatus === "") continue;

            let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
            let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
            
            bricks.push(new Brick(brickX, brickY, { status: blockStatus }));
            totalBricks++;
        }
    }
    totalBricks--;
}



// === 중간보스 스테이지 구현 ===
function resizeGame(newWidth, newHeight) {
    // 1. 캔버스와 style 크기 변경
    canvas.width = newWidth;
    canvas.height = newHeight;
    canvas.style.width = newWidth + "px";
    canvas.style.height = newHeight + "px";

    // 2. 부모 컨테이너 및 오버레이 스크린 CSS 크기 강제 덮어쓰기
    const gameContainer = document.getElementById("gameContainer");
    if(gameContainer) {
        gameContainer.style.width = newWidth + "px";
        gameContainer.style.height = newHeight + "px";
    }

    //const gameOverScreen = document.getElementById("gameOverScreen"); //상단에 이미 존재
    if(gameOverScreen) {
        gameOverScreen.style.width = newWidth + "px";
        gameOverScreen.style.height = newHeight + "px";
    }
    if(gameClearScreen){
        gameClearScreen.style.width = newWidth + "px";
        gameClearScreen.style.height = newHeight + "px";
    }

    paddleX = (newWidth - paddleWidth) / 2; // 패들을 새로운 화면 중앙으로 보정
    
    // 공의 위치를 새 캔버스 중앙 하단으로 강제 보정
    x = newWidth / 2;
    y = newHeight - 30;
}




// ==========================================
// 중간보스: 객체지향 프로그래밍 스테이지 (7x7 정중앙 1x1 보스 맵)
// ========================================== 김기범
// ==========================================
// 중간보스: 객체지향 스테이지 (무적 private 및 Getter 통로 적용)
// ==========================================
// ==========================================
// 중간보스: 객체지향 스테이지 (단일 계층 수평 캡슐화 및 연쇄 파괴)
// ==========================================
// ==========================================
// 중간보스: 객체지향 스테이지 (체력 보스 독점 및 수평 캡슐화 연쇄 파괴)
// ==========================================
// ==========================================
// 중간보스: 객체지향 스테이지 (다중 제어자 쌍 및 계층별 랜덤 배치)
// ==========================================
// ==========================================
// 중간보스: 객체지향 스테이지 (블록 텍스트 예고 및 검정색 잠금 UI 적용)
// ==========================================
// ==========================================
// 중간보스: 객체지향 스테이지 (완벽한 Getter-변수 연동 파괴 적용)
// ==========================================
// ==========================================
// 중간보스: 객체지향 스테이지 (완성형 OOP 속성 매핑 및 원격 저격)
// ==========================================
// ==========================================
// 중간보스: 객체지향 스테이지 (캡슐 보스 최적화 및 Z키 워프 통합)
// ==========================================
// ==========================================
// 중간보스: 객체지향 프로그래밍 스테이지 (고정형 보스 적용)
// ==========================================
function loadOopStage() {
    canvas.style.backgroundImage = "url(./testImg/Oop.png)";
    if (typeof resizeGame === 'function') {
        resizeGame(800, 600);
    }

    const rows = 7;
    const cols = 7;

    const layerPositions = { 1: [], 2: [], 3: [], 4: [] };
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let distFromEdge = Math.min(r, c, rows - 1 - r, cols - 1 - c);
            let layerType = 4 - distFromEdge; 
            layerPositions[layerType].push({ r: r, c: c });
        }
    }

    const totalBlockWidth = cols * (brickWidth + brickPadding) - brickPadding;
    const startX = (canvas.width - totalBlockWidth) / 2;
    const startY = 70;

    const blockGrid = Array.from({ length: rows }, () => Array(cols).fill(null));

    const COLOR_PUBLIC    = "#3498DB"; 
    const COLOR_PROTECTED = "#2ECC71"; 
    const COLOR_PRIVATE   = "#E74C3C"; 
    const COLOR_NORMAL    = "#95A5A6"; 
    const COLOR_BOSS      = "#76941e";

    // 1. 계층별 독립적 블록 풀(Pool) 생성 및 무작위 셔플
    for (let layer = 4; layer >= 1; layer--) {
        const positions = layerPositions[layer];
        const numBlocks = positions.length;
        let blockPool = [];

        if (layer === 4) {
            blockPool.push({ type: "private_W", text: "int W", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            blockPool.push({ type: "private_X", text: "double X", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            blockPool.push({ type: "private_Y", text: "string Y", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            blockPool.push({ type: "private_Z", text: "MyData Z", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            
            blockPool.push({ type: "public_W", text: "int getW", color: COLOR_PUBLIC, hp: 1, indestructible: false });
            blockPool.push({ type: "public_X", text: "double getX", color: COLOR_PUBLIC, hp: 1, indestructible: false });
            blockPool.push({ type: "public_Y", text: "string getY", color: COLOR_PUBLIC, hp: 1, indestructible: false });
            blockPool.push({ type: "public_Z", text: "MyData getZ", color: COLOR_PUBLIC, hp: 1, indestructible: false });

            blockPool.push({ type: "addbar", text: "", color: COLOR_NORMAL, hp: 1, indestructible: false });
            blockPool.push({ type: "addbar", text: "", color: COLOR_NORMAL, hp: 1, indestructible: false });
            blockPool.push({ type: "addbar", text: "", color: COLOR_NORMAL, hp: 1, indestructible: false });

            while (blockPool.length < numBlocks) {
                blockPool.push({ type: "normal", text: "", color: COLOR_NORMAL, hp: 1, indestructible: false });
            }
        } 
        else if (layer === 3) {
            blockPool.push({ type: "private_W", text: "int W", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            blockPool.push({ type: "private_X", text: "double X", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            blockPool.push({ type: "private_Y", text: "string Y", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            blockPool.push({ type: "private_Z", text: "MyData Z", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            
            blockPool.push({ type: "public_W", text: "int getW", color: COLOR_PUBLIC, hp: 1, indestructible: false });
            blockPool.push({ type: "public_X", text: "double getX", color: COLOR_PUBLIC, hp: 1, indestructible: false });
            blockPool.push({ type: "public_Y", text: "string getY", color: COLOR_PUBLIC, hp: 1, indestructible: false });
            blockPool.push({ type: "public_Z", text: "MyData getZ", color: COLOR_PUBLIC, hp: 1, indestructible: false });

            blockPool.push({ type: "protected_getK", text: "int getK", color: COLOR_PROTECTED, hp: 1, indestructible: false });
            blockPool.push({ type: "protected_getB", text: "string getB", color: COLOR_PROTECTED, hp: 1, indestructible: false });

            while (blockPool.length < numBlocks) {
                blockPool.push({ type: "normal", text: "", color: COLOR_NORMAL, hp: 1, indestructible: false });
            }
        } 
        else if (layer === 2) {
            blockPool.push({ type: "private_W", text: "int W", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            blockPool.push({ type: "private_X", text: "double X", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            blockPool.push({ type: "public_W", text: "int getW", color: COLOR_PUBLIC, hp: 1, indestructible: false });
            blockPool.push({ type: "public_X", text: "double getX", color: COLOR_PUBLIC, hp: 1, indestructible: false });
            
            blockPool.push({ type: "protected_K", text: "protected int K", color: COLOR_PROTECTED, hp: 1, indestructible: false });
            blockPool.push({ type: "protected_B", text: "protected string B", color: COLOR_PROTECTED, hp: 1, indestructible: false });



            while (blockPool.length < numBlocks) {
                blockPool.push({ type: "normal", text: "", color: COLOR_NORMAL, hp: 1, indestructible: false });
            }
        }else if (layer === 1) { 
            blockPool.push({ type: "BOSS", text: "BOSS", color: "#8E44AD", hp: 15,color:COLOR_BOSS, indestructible: false });
        }

        for (let i = blockPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [blockPool[i], blockPool[j]] = [blockPool[j], blockPool[i]];
        }

        positions.forEach((pos, index) => {
            blockGrid[pos.r][pos.c] = { ...blockPool[index], layer: layer };
        });
    }

    // 2. 자바스크립트 객체 인스턴스화
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let bData = blockGrid[r][c];
            if (!bData) continue;

            let brickX = startX + c * (brickWidth + brickPadding);
            let brickY = startY + r * (brickHeight + brickPadding);

            let initialStatus = (bData.layer === 4) ? 1 : "LOCK"; 
            let initialColor  = (bData.layer === 4) ? bData.color : "#222222"; 
            let initialText   = bData.text; 

            let effect = () => {
                const destroyTarget = (targetLayer, targetType) => {
                    let target = bricks.find(b => b.layer === targetLayer && b.realType === targetType && b.status !== 0);
                    if (target) {
                        target.status = 0; 
                        brokenBricksCount++; 
                    }
                };

                if (bData.type === "public_W") destroyTarget(bData.layer, "private_W");
                if (bData.type === "public_X") destroyTarget(bData.layer, "private_X");
                if (bData.type === "public_Y") destroyTarget(bData.layer, "private_Y");
                if (bData.type === "public_Z") destroyTarget(bData.layer, "private_Z");

                if (bData.type === "protected_getK") destroyTarget(2, "protected_K");
                if (bData.type === "protected_getB") destroyTarget(2, "protected_B");

                let remainingBlocks = bricks.filter(b => b.layer === bData.layer && b.status === 1).length;
                
                if (remainingBlocks === 0 && bData.layer > 1) {
                    bricks.forEach(b => {
                        if (b.layer === bData.layer - 1 && b.status === "LOCK") {
                            b.status = 1; 
                            if (b.tempData) {
                                b.color = b.tempData.color; 
                            }
                            
                            // 보스의 잠금이 풀렸다면, 그때 크기를 2배로 확장!
                            if (b.realType === "BOSS") {
                                let expandWidth = brickWidth * 2;
                                let expandHeight = brickWidth * 2;
                                
                                // 중심점 유지를 위해 좌표 보정
                                b.x = b.x + (b.width / 2) - (expandWidth / 2);
                                b.y = b.y + (b.height / 2) - (expandHeight / 2);
                                
                                b.width = expandWidth;
                                b.height = expandHeight;
                            }
                        }
                    });
                }

                if (bData.type === "BOSS") {
                    let currentBoss = bricks.find(b => b.realType === "BOSS");
                    if (currentBoss) {
                        spawnBomb(currentBoss.x + currentBoss.width / 2, currentBoss.y + currentBoss.height / 2);
                    }
                }
            };

            // 처음엔 모두 기본 너비(brickWidth), 기본 높이(brickHeight)로 얌전하게 생성
            let newBrick = new BossBrick(brickX, brickY, {
                status: initialStatus,
                color: initialColor,
                text: initialText,
                realText: bData.text, 
                realType: bData.type,
                layer: bData.layer,
                effectFunc: effect,
                hp: bData.hp,
                indestructible: bData.indestructible
            });

            newBrick.tempData = { color: bData.color };

            bricks.push(newBrick);
            totalBricks++; 
        }
    }
}

//점심시간 스테이지
function loadLunchStage(){
    canvas.style.backgroundImage = "url(./testImg/lunchTime.jpeg)";
    isGameOver = true;
    startScene("lunchTime");
}

//====================================

function loadDSStage4(treeDepth = 4) {
    canvas.style.backgroundImage = "url(./testImg/Ds.png)";
    if (typeof resizeGame === 'function') {
        resizeGame(1280, 800); // 트리 형태의 안정적인 배치를 위해 캔버스 크기 고정
    }
    
    // 동적으로 설정 가능한 트리 구조를 위한 기준 좌표 설정
    const startY = 80;
    const gapY = 80;
    const centerX = canvas.width / 2;
    
    // 각 블록에 확률적으로 부여될 이벤트 생성 함수
    const getRandomEffect = (blockX, blockY, blockWidth, blockHeight) => {
        const weightedEffects = [
            { weight: 10, effect: () => setBallOpacity(0.2) }, // 10%: 공 투명화
            { weight: 15, effect: subBarsize },                // 15%: 패들 축소
            { weight: 15, effect: addBarsize },                // 15%: 패들 확대
            { weight: 10, effect: () => { dx = dx > 0 ? dx + 1 : dx - 1; dy = dy > 0 ? dy + 1 : dy - 1; } }, // 10%: 속도 증가
            { weight: 20, effect: spawnRandomBrick },          // 20%: 랜덤 위치 블록 생성
            { weight: 10, effect: () => spawnBomb(blockX + blockWidth / 2, blockY + blockHeight / 2) },      // 10%: 폭탄 드랍
            { weight: 20, effect: () => {} }                   // 20%: 효과 없음 (총합 100%)
        ];

        let rand = Math.random() * 100;
        let cumulativeWeight = 0;
        
        for (let i = 0; i < weightedEffects.length; i++) {
            cumulativeWeight += weightedEffects[i].weight;
            if (rand < cumulativeWeight) {
                return weightedEffects[i].effect;
            }
        }
        return () => {};
    };

    // 트리 구조 동적 생성
    let leafGap = 150; // 맨 아래 리프 노드 간의 기본 X축 간격
    const maxLeaves = Math.pow(2, treeDepth - 1); // 맨 아래(리프) 노드의 총 개수

    // 화면 밖으로 나가지 않도록 최대 간격(leafGap)을 캔버스 너비에 맞춰 자동 축소
    if (maxLeaves > 1) {
        // 리프 노드의 폭(120)을 고려해 좌우 여백 140px을 빼고 계산
        const maxAllowedGap = (canvas.width - 140) / (maxLeaves - 1);
        leafGap = Math.min(leafGap, maxAllowedGap);
    }

    for (let level = 0; level < treeDepth; level++) {
        let numNodes = Math.pow(2, level); // 현재 레벨의 총 노드 수 (1, 2, 4...)
        let currentY = startY + level * gapY;
        
        // 현재 레벨의 노드 간격 및 시작 X 좌표 계산 (중앙 정렬을 위함)
        let gapX = leafGap * Math.pow(2, (treeDepth - 1) - level);
        let startX = centerX - ((numNodes - 1) * gapX) / 2;
        
        for (let i = 0; i < numNodes; i++) {
            let nodeCenterX = startX + i * gapX;
            
            // 리프 노드 (가장 깊은 레벨)인 경우 Stage4Brick (Stack/Queue) 생성
            if (level === treeDepth - 1) {
                let bWidth = brickWidth * 1.5;
                let blockX = nodeCenterX - bWidth / 2;
                
                let isStack = (i % 2 === 0);
                let dsType = isStack ? "stack" : "queue";
                let color = isStack ? "#3498DB" : "#2ECC71";
                
                let stage4Brick = new Stage4Brick(blockX, currentY, {
                    color: color,
                    dsType: dsType,
                    effectFunc: getRandomEffect(blockX, currentY, bWidth, brickHeight)
                });
                bricks.push(stage4Brick);
            } else {
                // 내부 노드 (Root 또는 Node)
                let blockX = nodeCenterX - brickWidth / 2;
                let text = (level === 0) ? "Root" : "Node";
                let color = (level === 0) ? "#F1C40F" : (i % 2 === 0 ? "#E74C3C" : "#9B59B6");
                
                let effect = (level === 0) ? () => {
                    // Root 블록 파괴 시 남은 모든 벽돌 연쇄 파괴 (스테이지 즉시 클리어)
                    bricks.forEach(b => {
                        if (b.status !== 0) {
                            b.status = 0;
                            brokenBricksCount++;
                        }
                    });
                } : getRandomEffect(blockX, currentY, brickWidth, brickHeight);

                bricks.push(new Brick(blockX, currentY, {
                    color: color,
                    text: text,
                    effectFunc: effect
                }));
            }
            totalBricks++;
        }
    }
}

function loadWebprogrammingStage(){}


//최초 실행
initGame();
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// UI 요소 가져오기
const gameOverScreen = document.getElementById("gameOverScreen");
const gameOverMessage = document.getElementById("gameOverMessage");
const restartBtn = document.getElementById("restartBtn");
const stageSelectBtn = document.getElementById("stageSelectBtn");
const stageSelectModal = document.getElementById("stageSelectModal");
const closeStageBtn = document.getElementById("closeStageBtn");
const stageItemBtns = document.querySelectorAll(".stage-item-btn");
const nextBtn = document.getElementById("nextBtn");



// 게임 상태 변수 선언
let x, y, dx, dy, paddleX;
let isGameOver = true;
let isGameStarted = false;

let ballOpacity = 1.0; // 공의 투명도
let opacityTimeoutId = null; // 투명도 복구 타이머 ID 15~16줄

const ballRadius = 8;
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
let currentStage = 0;    // 현재 진행 중인 스테이지 번호
let maxStage = 0;
let clearCount = 0; //이산수학 미니 스테이지 클리어 수
let brokenBricksCount = 0; // 부순 벽돌 개수
let totalBricks = 0;     // 스테이지마다 깨야 할 목표 벽돌 개수
let bombs = [];          // 폭탄들을 저장할 배열

const statusMap = { 
    "T":    { color: "#48dd57", effectFunc: tfHit },
    "F":    { color: "#d74e1d", effectFunc: tfHit },
    "NOT":  { color: "#555555", effectFunc: notHit },

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
restartBtn.addEventListener("click", initGame); // 다시 시작 버튼 클릭 시 게임 초기화
canvas.addEventListener("click", clickBombHandler, false); // 폭탄 클릭 이벤트
startNewGameBtn.addEventListener("click", () => { //게임 시작 이벤트
      mainScreen.style.display = "none"; 
      currentStage = 0; 
      stageSelectModal.style.display = "flex";
});
stageItemBtns.forEach(btn => { //스테이지 선택 이벤트
      btn.addEventListener("click", (e) => {
          // 데이터 속성(data-stage)에서 스테이지 인덱스 추출
          let selectedStage = parseInt(e.target.getAttribute("data-stage"));
          if (selectedStage == 3 || selectedStage == 4) selectedStage++;
          // 메인 화면 및 모달 닫기
          stageSelectModal.style.display = "none";
          mainScreen.style.display = "none";
          
          // 해당 스테이지로 전역 변수 변경 후 게임 초기화 구동
          currentStage = selectedStage;
          initGame();
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
        currentStage++;
        endGame("모든 벽돌 제거 승리!");
        loadStage(currentStage);
        nextBtn.style.display = "inline";

    }
  });

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
            nextBtn.style.display = "none";
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
            nextBtn.style.display = "none";
            break;
    }
}
function loadTutorialStage(){
    // 벽돌 배열 기본 생성 (최초 1회) // 미리 X,Y 계산해서 객체 생성하도록 변경 
    const brickRowCount = 4;
    const brickColumnCount = 6;
    const colors = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00"];

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
    const startAngle = Math.PI / 4;  //처음 발사될때의 각도 지정
    // 속도와 각도로 dx, dy를 계산
    dx = speed * Math.sin(startAngle);
    dy = -speed * Math.cos(startAngle);

    paddleX = (canvas.width - paddleWidth) / 2;
    brokenBricksCount = 0;
    isGameOver = false;
    ballOpacity = 1.0; // 투명도 초기화 63~67줄
    if (opacityTimeoutId !== null) {
        clearTimeout(opacityTimeoutId);
        opacityTimeoutId = null;
    }
    // 스테이지 불러오기
    loadStage(currentStage);

    // UI 숨기고 그리기 시작
    gameOverScreen.style.display = "none";
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
    gameOverMessage.innerText = message;
    gameOverScreen.style.display = "flex"; // 오버레이 화면 표시
}

// 충돌 감지 함수 //1차원 틀에 맞게 변경
function collisionDetection() {
    for(let i = 0; i < bricks.length; i++) {
        let b = bricks[i];
        if(b.status !==0) { //0이 아닐때로 변경
            if(x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                dy = -dy;
                b.onHit(); // 블럭 쳤을때 블록에 맞는 효과 발동
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
                    currentStage++;
                    if (currentStage > maxStage) maxStage = currentStage;
                    endGame("모든 벽돌 제거 승리!");
                    nextBtn.style.display = "inline";
                    loadStage(currentStage);
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


//=== update 함수들 ===
function updateBall(){
    // 좌우 벽면 충돌
    if(x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    
    // 상단 벽면 충돌
    if(y + dy < ballRadius) {
        dy = -dy;
    } 
    // 패들 충돌 확인
    else if(y + dy > canvas.height - ballRadius - paddleHeight) {
        if(x > paddleX && x < paddleX + paddleWidth) {
            
            // 현재 공의 전체 속력(스칼라값)을 피타고라스 정리로 구합니다. (항상 일정함)
            let speed = Math.sqrt(dx * dx + dy * dy);
            
            //공이 맞은 위치를 -1.0(왼쪽 끝) ~ 1.0(오른쪽 끝) 사이의 비율로 변환합니다.
            let hitPoint = x - (paddleX + paddleWidth / 2);
            let normalizedHit = hitPoint / (paddleWidth / 2);
            
            //튕겨나갈 각도 계산 (최대 60도 = Math.PI / 3)
            let bounceAngle = normalizedHit * (Math.PI / 3); 
            
            // 동일한 속력을 유지하면서 dx, dy 지정
            dx = speed * Math.sin(bounceAngle);
            dy = -speed * Math.cos(bounceAngle); // 무조건 위로 튕겨야 하므로 y방향은 음수로
        }
    }
    // 바닥에 닿았을 때 게임 오버
    if(y + dy > canvas.height - ballRadius) {
        endGame("바닥에 닿았습니다. 게임 오버!");
        nextBtn.style.display = "none";
        return;
    }
    x += dx;
    y += dy;
}
function updatePaddle(){ //함수화
    let previousWidth = paddleWidth; 
    paddleWidth += (targetPaddleWidth - paddleWidth) * 0.016; 
   
    paddleX -= (paddleWidth - previousWidth) / 2;

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

    collisionDetection();
    updateBall();
    updatePaddle();
    updateBombs();

    // 충돌 감지 직후 승리하여 isGameOver가 true로 바뀌었다면 진행 멈춤
    if (isGameOver) return; 
    requestAnimationFrame(draw);
}

//==== 이산수학 스테이지 기능 구현중 ====
function tfHit(){
    if(this.status === "T") this.status = "F";
    else if(this.status === "F") this.status = "T";
}
function notHit(){
    bricks.forEach(b => {
        if(b.status === "T") b.status = "F";
        else if(b.status === "F") b.status = "T";
    });
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
//====================================

function loadDSStage4() {
    // 스테이지 4의 벽돌 행과 열 개수 설정
    const brickRowCount = 3;
    const brickColumnCount = 4;
    const colors = ["#E74C3C", "#9B59B6", "#3498DB", "#2ECC71", "#F1C40F"]; // 각 행마다 다른 색상 적용


    for(let c = 0; c < brickColumnCount; c++) {
        for(let r = 0; r < brickRowCount; r++) {
            // 벽돌이 그려질 X, Y 좌표 계산
            let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
            let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;

            // 기능별로 확률 부여 (총합이 100이 되도록 설정)
            const weightedEffects = [
                { weight: 0, effect: () => setBallOpacity(0.2) }, // 확률 10%: 투명화
                { weight: 0, effect: subBarsize },                // 확률 20%: 패들 축소
                { weight: 0, effect: addBarsize },                // 확률 20%: 패들 확대
                { weight: 0, effect: () => { dx = dx > 0 ? dx + 1 : dx - 1; dy = dy > 0 ? dy + 1 : dy - 1; } }, // 확률 10%: 속도 증가
                { weight: 70, effect: spawnRandomBrick },          // 랜덤 위치에 블록 생성 (원하는 확률로 weight 수정)
                { weight: 0, effect: () => spawnBomb(brickX + brickWidth / 2, brickY + brickHeight / 2) }, // 확률 30%: 폭탄 드랍
                { weight: 30, effect: () => {} }                   // 확률 70%: 효과 없음
            ];

            // 확률(가중치)을 기반으로 랜덤 효과 선택
            let randomEffect = () => {};
            let rand = Math.random() * 100; // 0 ~ 100 사이의 난수 생성
            let cumulativeWeight = 0; // 누적 확률
            
            for (let i = 0; i < weightedEffects.length; i++) {
                cumulativeWeight += weightedEffects[i].weight;
                if (rand < cumulativeWeight) {
                    randomEffect = weightedEffects[i].effect;
                    break;
                }
            }
            bricks.push(new Brick(brickX, brickY, {color: colors[r], effectFunc: randomEffect}));
            totalBricks++;
        }
    }
}




//최초 실행
initGame();
// ==========================================
// [목차]
// 1. DOM 요소 및 게임 전역 변수 설정
// 2. 게임 데이터 및 상수 (난이도, 스토리, 상태맵)
// 3. 클래스 정의 (객체 지향 모델: Brick, Boss, Bomb 등)
// 4. 물리 엔진 및 게임 로직 (충돌, 이동, 아이템)
// 5. 화면 렌더링 (그리기 전담 함수들)
// 6. 스테이지 및 맵 생성 (레벨 디자인)
// 7. UI 제어 및 이벤트 리스너 (버튼 클릭, 키보드 입력)
// 8. 메인 엔진 (초기화 및 무한 루프)
// ==========================================


// ==========================================
// 1. DOM 요소 및 게임 전역 변수 설정
// ==========================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let ballSkinType = "default";   // 공 이미지 변수 default, img, rgb 
let paddleSkinType = "default"; // 패들 이미지 변수 default, img, rgb 
let ballImage = null; //이미지 주소 변수
let paddleImage = null;
let rgb = 0; // 공 rgb 조절 값

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
const optionBtn = document.getElementById("optionBtn");
const optionModal = document.getElementById("optionSelectModal");
const closeOptionBtn = document.getElementById("closeOptionBtn");
const ballSkinSelect = document.getElementById("ballSkinSelect");
const paddleSkinSelect = document.getElementById("paddleSkinSelect");


// 게임 루프 및 흐름 제어 변수
let animationId = null; // 애니메이션 루프 ID를 저장할 변수
let isGameOver = true;
let isGameStarted = false;
let isCleared = false; //스테이지 클리어 상태 변수
let currentActiveScreen = null;

// 게임 상태 변수 선언 (공, 패들)
let x, y, dx, dy, paddleX;
let ballSpeed = 7; //공속도 변수 이름 통일
let ballOpacity = 1.0; // 공의 투명도
let opacityTimeoutId = null; // 투명도 복구 타이머 ID 15~16줄

const ballRadius = 12;
const paddleHeight = 10;
let paddleWidth = 100;
let targetPaddleWidth = 100;

// 벽돌 기본 사이즈, 간격
const brickWidth = 80;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 100;
const brickOffsetLeft = 35;

// 게임 오브젝트 및 진행 상황 카운터
let bricks = [];
let bombs = [];          // 폭탄들을 저장할 배열
let currentStage = 0;    // 현재 진행 중인 스테이지 번호
let maxStage = 0;        // 최대 진행 스테이지 변수
let clearCount = 0;      // 이산수학 미니 스테이지 클리어 수
let brokenBricksCount = 0; // 부순 벽돌 개수
let totalBricks = 0;     // 스테이지마다 깨야 할 목표 벽돌 개수


// ==========================================
// 2. 게임 데이터 및 상수 (난이도, 스토리, 상태맵)
// ==========================================
const gateStageCount = 4; //이산수학 게이트 스테이지 수(마지막은 회로)

const statusMap = {
    "T":    { color: "#48dd57", effectFunc: tfHit },
    "F":    { color: "#d74e1d", effectFunc: tfHit },
    "NOT":  { color: "#555555", effectFunc: notHit },
    "CONFIRM": {color: "#9ec12b", effectFunc: confirmHit},

    // 논리 게이트 색상, 실행할 함수, 실제 연산식 한번에 정의
    "AND":  { color: "#8e8e8e", operation: (a, b) => a && b },
    "OR":   { color: "#444444", operation: (a, b) => a || b },    
    "XOR":  { color: "#555555", operation: (a, b) => a !== b },
    "NAND": { color: "#555555", operation: (a, b) => !(a && b) },
    "NOR":  { color: "#555555", operation: (a, b) => !(a || b) },
    "XNOR": { color: "#555555", operation: (a, b) => a === b }
};

const diff = { //난이도 객체
    easy: { paddleWidth : 15, speed : 10, bombProb : 3 },
    normal: { paddleWidth : 10, speed : 15, bombProb : 10 },
    gosu : { paddleWidth : 7, speed : 20, bombProb : 15 },
    goat : { paddleWidth : 5, speed : 25, bombProb : 25 }
};

//대화창 관련 변수
let allStoryData = {"lunchTime": [
    { "speaker": "나", "text": "샘플 텍스트~" },
    { "speaker": "나", "text": "이거 다 끝나도 아직은 안넘어가요" },
    { "speaker": "나", "text": "정상이니까 k로 스테이지 넘겨주세요" }
]}; 
let currentScript = ["sampleText"]; 
let currentIndex = 0;


// ==========================================
// 3. 클래스 정의 (객체 지향 모델: Brick, Boss, Bomb 등)
// ==========================================
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
        const currentFunc = statusMap[this.status]?.effectFunc || this.effectFunc;

        // ★ 핵심: 함수를 실행할 때 'this'가 무조건 현재 벽돌을 가리키도록 강제합니다.
        if (typeof currentFunc === "function") {
            currentFunc.call(this);
        }
        
        if(this.status===1){
            this.status = 0;
            brokenBricksCount++;
        }
    }

    draw(ctx) {
        if (this.status !== 0) {
            //statusMap에 없으면 baseSetting color로
            const currentStyle = statusMap[this.status] || { color: this.color };
            //블럭 고유의 크기가 있으면 그걸 쓰도록 수정
            const drawWidth = this.width || brickWidth;
            const drawHeight = this.height || brickHeight;
            ctx.beginPath();
            ctx.rect(this.x, this.y, drawWidth, drawHeight);
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
                ctx.fillText(this.text, this.x + drawWidth / 2, this.y + drawHeight / 2);
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
    }

    onHit() {
        if (this.status === "LOCK") return; 
        if (this.isIndestructible) return; // private 블록 무적 방어

        if (this.status === 1) {
            this.hp--; 
            // hit 할 수 있는 상황이라면 생명력이 감소
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
        super.draw(ctx); //똑같은거 써서 super로 받아쓰는 거로 변경
        if (this.realType === "BOSS" && this.status === 1 && this.hp > 0) {
            this.drawHealthBar(ctx);
        }
    }

    drawHealthBar(ctx) { //체력바 따로 뺌
        const barWidth = this.width - 10; 
        const barHeight = 4;              
        const barX = this.x + 5;
        const barY = this.y + 3;

        // 배경(빨간색)
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // 현재 체력(초록색)
        const currentWidth = (this.hp / this.maxHp) * barWidth;
        ctx.fillStyle = "#00FF00";
        ctx.fillRect(barX, barY, currentWidth, barHeight);

        // 테두리(검은색)
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    expand() { //보스 커지는거
        if (this.realType === "BOSS" && this.status === "LOCK") {
            let expandWidth = brickWidth * 2;
            let expandHeight = brickHeight * 2; 
            
            this.x = this.x + (this.width / 2) - (expandWidth / 2);
            this.y = this.y + (this.height / 2) - (expandHeight / 2);
            this.width = expandWidth;
            this.height = expandHeight;

            if (this.tempData) this.color = this.tempData.color;
            this.status = 1;

            this.text = this.realText;
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

        // 스택/큐의 타입과 남은 원소 배열 상태를 동적으로 텍스트로 렌더링
        this.text = `${this.dsType.toUpperCase()} [${this.elements.join(", ")}]`;
        
        super.draw(ctx); //보스 체력바 부분 삭제
    }
}


// ==========================================
// 4. 물리 엔진 및 게임 로직 (충돌, 이동, 아이템)
// ==========================================

// 1. 순수하게 충돌 후 반사각만 계산하는 물리 전용 함수
function applyBrickPhysics(b, closestX, closestY, distanceSquared, distanceX, distanceY) {
    let prevX = x - dx;
    let prevY = y - dy;
    let currentWidth = b.width || brickWidth;
    let currentHeight = b.height || brickHeight;

    let hitTopOrBottom = (prevY <= b.y || prevY >= b.y + currentHeight);
    let hitLeftOrRight = (prevX <= b.x || prevX >= b.x + currentWidth);

    if (hitTopOrBottom && !hitLeftOrRight) {
        dy = -dy; 
        y = (prevY <= b.y) ? b.y - ballRadius : b.y + currentHeight + ballRadius;
    } else if (hitLeftOrRight && !hitTopOrBottom) {
        dx = -dx; 
        x = (prevX <= b.x) ? b.x - ballRadius : b.x + currentWidth + ballRadius;
    } else {
        // 모서리 반사 로직 (기존 코드와 동일)
        let distance = Math.sqrt(distanceSquared);
        if (distance === 0) {
            dx = -dx; dy = -dy;
        } else {
            let nx = distanceX / distance; let ny = distanceY / distance;
            let dotProduct = (dx * nx) + (dy * ny);
            dx = dx - 2 * dotProduct * nx; dy = dy - 2 * dotProduct * ny;
            x = closestX + nx * ballRadius; y = closestY + ny * ballRadius;
        }
    }
}

// 2. 전체 블록 충돌 감지 흐름 제어
function collisionDetection() {
    let hasCollidedThisFrame = false; 

    for(let i = 0; i < bricks.length; i++) {
        if (hasCollidedThisFrame) break; 
        let b = bricks[i];
        
        if(b.status !== 0) { 
            let currentWidth = b.width || brickWidth;
            let currentHeight = b.height || brickHeight;
            let closestX = Math.max(b.x, Math.min(x, b.x + currentWidth));
            let closestY = Math.max(b.y, Math.min(y, b.y + currentHeight));
            let distanceX = x - closestX;
            let distanceY = y - closestY;
            let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

            // [역할 1] 감지
            if (distanceSquared < (ballRadius * ballRadius)) {
                hasCollidedThisFrame = true; 
                // [역할 2] 물리 반사 (새로 만든 함수 호출)
                applyBrickPhysics(b, closestX, closestY, distanceSquared, distanceX, distanceY);
                // [역할 3] 타격 처리
                b.onHit(); 
            }
        }
    }
}

// 패들 충돌 계산 전용 함수 //updateBall에서 빼옴
function checkPaddleCollision() {
    if(y + dy > canvas.height - ballRadius - paddleHeight) {
        if(x > paddleX - ballRadius && x < paddleX + paddleWidth + ballRadius) {
            let hitPoint = x - (paddleX + paddleWidth / 2);
            let normalizedHit = hitPoint / ((paddleWidth / 2) + ballRadius);
            normalizedHit = Math.max(-1, Math.min(1, normalizedHit));
            let bounceAngle = normalizedHit * (Math.PI / 3); 
            
            dx = ballSpeed * Math.sin(bounceAngle);
            dy = -ballSpeed * Math.cos(bounceAngle); 
        }
    }
}

// 공 위치 업데이트 함수
function updateBall(){
    // 1. 벽 충돌
    if(x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
    if(y + dy < ballRadius) dy = -dy; 
    
    // 2. 패들 충돌
    checkPaddleCollision();
    
    // 3. 바닥 충돌 (게임오버)
    if(y + dy > canvas.height - ballRadius) {
        endGame("바닥에 닿았습니다. 게임 오버!");
        return;
    }
    // 4. 이동 적용
    x += dx;
    y += dy;
}

// 패들 부드러운 위치 업데이트 함수
function updatePaddle(){ //함수화
    let previousWidth = paddleWidth; 
    paddleWidth += (targetPaddleWidth - paddleWidth) * 0.016; 
   
    paddleX =paddleX- (paddleWidth - previousWidth) / 2;

    if (paddleX + paddleWidth > canvas.width) {
        paddleX = canvas.width - paddleWidth;
    }
}

// 폭탄 업데이트 함수
function updateBombs() {
    for(let i = 0; i < bombs.length; i++) {
        bombs[i].update();
    }
}

// === 아이템 및 기믹 효과 함수들 ===
function setBallOpacity(opacity) { // 공 투명도 조절 함수
    ballOpacity = Math.max(0.0, Math.min(1.0, opacity));
    if (opacityTimeoutId !== null) clearTimeout(opacityTimeoutId);
    // 10초 후 투명도를 1.0으로 복구
    opacityTimeoutId = setTimeout(() => {
        ballOpacity = 1.0;
        opacityTimeoutId = null;
    }, 10000);
}
function subBarsize(){ targetPaddleWidth = Math.max(40, targetPaddleWidth - 50); }
function addBarsize(){ targetPaddleWidth = Math.min(canvas.width/2, targetPaddleWidth + 50); }
function spawnRandomBrick() { //블럭을 깨고 다시 블럭이 랜덤위치에 생성되는 기능
    const randomX = Math.random() * (canvas.width - brickWidth);
    const randomY = Math.random() * (canvas.height / 2 - brickHeight);
    const colors = ["#E74C3C", "#9B59B6", "#3498DB", "#2ECC71", "#F1C40F"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    bricks.push(new Brick(randomX, randomY, { color: randomColor, effectFunc: () => {} }));
    totalBricks++; 
}
function spawnBomb(x, y) { bombs.push(new Bomb(x, y)); }

// 이산수학 전용 기믹 함수들
function tfHit(){
    if(this.notEvent) return;
    if(this.status === "T") this.status = "F";
    else if(this.status === "F") this.status = "T";
}
function notHit() {
    let tfCount = 0;
    bricks.forEach(b => {
        if(b.status === "T") { b.status = "F"; tfCount++; }
        else if(b.status === "F") { b.status = "T"; tfCount++; }
    });
    if (tfCount === 0) {
        this.status = 0;
        brokenBricksCount++;
    }
}
function confirmHit() { //최종이 T이면 모든 블록 파괴
    if (this.target.status === "T") {
        bricks.forEach(b => {
            if (b.status !== 0 && b.status !== 1) {
                b.status = 0;
                brokenBricksCount++;
            }
        });
    }
}
// 실시간 논리 회로 연산
function updateCircuits() {
    for (let i = 0; i < bricks.length; i++) {
        let b = bricks[i];
        if (b.status === 0) continue;
        if (b.isGate) {                
            let lVal = (b.leftInput.status === "T");
            let rVal = (b.rightInput.status === "T");
            let res = b.operation(lVal, rVal);     
            b.topOutput.status = res ? "T" : "F";       
        }
    }
}


// ==========================================
// 5. 화면 렌더링 (그리기 전담 함수들)
// ==========================================
function drawBall() {

    if (ballSkinType === "image" && ballImage) {
        // 야구공, 농구공, 축구공 
        ctx.drawImage(ballImage, x - ballRadius, y - ballRadius, ballRadius * 2, ballRadius * 2);
    } 
    else if (ballSkinType === "rgb") {
        // RGB
        ctx.beginPath();
        ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${rgb}, 100%, 50%)`; 
        ctx.fill();
        ctx.closePath();
    }
    else{
        ctx.beginPath();
        ctx.arc(x, y, ballRadius, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255, 0, 0, ${ballOpacity})`; // RGBA를 사용하여 투명도 적용
        ctx.fill();
        ctx.closePath();
    }
    
}

function drawPaddle() {
    if (paddleSkinType === "image" && paddleImage) {
        // 나무, 금속, 우레탄 
        ctx.drawImage(paddleImage, paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    } 
    else if (paddleSkinType === "rgb") {
        // RGB 
        let gradient = ctx.createLinearGradient(paddleX, 0, paddleX + paddleWidth, 0);
        gradient.addColorStop(0, `hsl(${rgb}, 100%, 50%)`);
        gradient.addColorStop(1, `hsl(${(rgb + 60) % 360}, 100%, 50%)`);
        
        ctx.beginPath();
        ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.closePath();
    }
    else{
        ctx.beginPath();
        ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
        ctx.fillStyle = "#000000"; 
        ctx.fill();
        ctx.closePath();
    }
    
    //패들에 글씨출력 부분
    ctx.fillStyle = "#FFFFFF"; // 글씨 색상
    ctx.font = "bold 12px 'Galmuri11', sans-serif"; // 기존 사용 중인 폰트 
    ctx.textAlign = "center";   // 가로 정렬 기준을 중앙으로
    ctx.textBaseline = "middle"; // 세로 정렬 기준을 중앙으로

    const textX = paddleX + (paddleWidth / 2);
    const textY = (canvas.height - paddleHeight) + (paddleHeight / 2);
    ctx.fillText(`count : ${brokenBricksCount}`, textX, textY);
}

function drawBricks() { //Brick class에 draw 메소드 이용해 변경 //1차원 틀로 변경
    for(let i = 0; i < bricks.length; i++) {
        bricks[i].draw(ctx);
    }
}

function drawBombs() {
    for(let i = 0; i < bombs.length; i++) {
        bombs[i].draw(ctx);
    }
}


// ==========================================
// 6. 스테이지 및 맵 생성 (레벨 디자인)
// ==========================================

// 기본 맵 생성 헬퍼 함수
function createGrid(rows, cols, startX, startY, callback) { 
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let brickX = startX + c * (brickWidth + brickPadding);
            let brickY = startY + r * (brickHeight + brickPadding);
            callback(r, c, brickX, brickY);
        }
    }
}

function loadStage(stageIndex){
    //화면, 카운트 초기화
    bricks = []; brokenBricksCount = 0; totalBricks = 0; bombs = []; 

    //stageIndexdp 따라 함수를 호출
    switch(stageIndex){
        case 0: loadTutorialStage(); break;
        case 1: loadDiscreteStage(); break;
        case 2: loadOopStage(); break;
        case 3: loadLunchStage(); break;
        case 4: loadDSStage4(); break;
        case 5: loadWebprogrammingStage(); break;
        default: endGame("모든 스테이지를 클리어했습니다! 최종 승리!"); break;
    }
}

// === 스테이지 0: 튜토리얼 ===
function loadTutorialStage(){
    const brickRowCount = 4;
    const brickColumnCount = 6;
    const colors = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00"];
    canvas.style.backgroundImage = "url(./testImg/CProgramming.png)";
    createGrid(brickRowCount, brickColumnCount, brickOffsetLeft, brickOffsetTop, (r, c, brickX, brickY) => {
        if(r == brickRowCount-1 && c == 2){ 
            bricks.push(new Brick(brickX, brickY, {color: "#000000", effectFunc:()=>setBallOpacity(0.2)}));
        } else if(r == brickRowCount-4 && c == 1){
            bricks.push(new Brick(brickX, brickY, {color: "blue", effectFunc:subBarsize})); 
        } else if(r == brickRowCount-2 && c == 3){
            bricks.push(new Brick(brickX, brickY, {color: "purple", effectFunc:addBarsize}));
        } else {
            bricks.push(new Brick(brickX, brickY, {color: colors[r]})); 
        }
        totalBricks++;
    });
}

// === 스테이지 1: 이산수학 ===
function randomDiscreteMap() { 
    const Gates = Object.keys(statusMap).filter(key => statusMap[key].operation);
    const randomGate = Gates[Math.floor(Math.random() * Gates.length)];

    let leftVal, rightVal;
    let isAnswerTrue;

    do {
        leftVal = Math.random() < 0.5 ? "T" : "F";
        rightVal = Math.random() < 0.5 ? "T" : "F";
        isAnswerTrue = statusMap[randomGate].operation(leftVal === "T", rightVal === "T");
    } while (isAnswerTrue); 

    if(clearCount < gateStageCount - 1){
        return [
            [  0,     1,    "F",    1,    0,    0],                   
            [  0,     0, randomGate, 0,   0,    0],            
            ["NOT", leftVal, 1, rightVal, 1, "CONFIRM"] 
        ];
    } else return randomBossMap();
}

function randomBossMap() {
    const Gates = Object.keys(statusMap).filter(key => statusMap[key].operation);
    let gTop, gLeft, gRight, in1, in2, in3, isAnswerTrue;
    do {
        gTop = Gates[Math.floor(Math.random() * Gates.length)];
        gLeft = Gates[Math.floor(Math.random() * Gates.length)];
        gRight = Gates[Math.floor(Math.random() * Gates.length)];
        in1 = Math.random() < 0.5 ? "T" : "F";
        in2 = Math.random() < 0.5 ? "T" : "F";
        in3 = Math.random() < 0.5 ? "T" : "F";
        let val1 = (in1 === "T"); let val2 = (in2 === "T"); let val3 = (in3 === "T");
        let midLeftResult = statusMap[gLeft].operation(val1, val2);
        let midRightResult = statusMap[gRight].operation(val2, val3);
        isAnswerTrue = statusMap[gTop].operation(midLeftResult, midRightResult);
    } while (isAnswerTrue); 

    return [
        [ 0,     0,   1,  "F",  1,    0,    0],               
        [ 0,     0,   0,  gTop, 0,    0,    0],              
        [ 0,     0,  "F",  1,  "F",   0,    0],             
        [ 0,     0, gLeft, 0, gRight, 0,    0],        
        ["NOT", in1,  0,  in2,  0,   in3, "CONFIRM"]
    ];
}

function loadDiscreteStage() {
    canvas.style.backgroundImage = "url(./testImg/Discrete.png)";
    resizeGame(700, 500);

    const map = randomDiscreteMap();
    const brickRowCount = map.length;
    const brickColumnCount = map[0].length;
    const grid = Array.from({ length: brickRowCount }, () => Array(brickColumnCount).fill(null));

    let confirmBlock = null;
    let finalOutputBlock = null;

    createGrid(brickRowCount, brickColumnCount, brickOffsetLeft, brickOffsetTop, (r, c, brickX, brickY) => {
        let blockStatus = map[r][c];
        if (blockStatus !== 0) {
            grid[r][c] = new Brick(brickX, brickY, { status: blockStatus });
        }
    });

    for (let r = 0; r < brickRowCount; r++) {
        for (let c = 0; c < brickColumnCount; c++) {
            let b = grid[r][c];
            if (b) { 
                let isGate = statusMap[b.status] && statusMap[b.status].operation;
                if(isGate){
                    b.isGate = true;
                    b.operation = statusMap[b.status].operation;
                    if (r - 1 >= 0) { b.topOutput = grid[r - 1][c]; b.topOutput.notEvent = true; }
                    if (r + 1 < brickRowCount && c - 1 >= 0) b.leftInput = grid[r + 1][c - 1];
                    if (r + 1 < brickRowCount && c + 1 < brickColumnCount) b.rightInput = grid[r + 1][c + 1];
                }
                if (b.status === "CONFIRM") confirmBlock = b;
                if (r === 0 && (b.status === "T" || b.status === "F")) finalOutputBlock = b; 
                bricks.push(b); totalBricks++;
            }
        }
    }
    if (confirmBlock && finalOutputBlock) confirmBlock.target = finalOutputBlock;
}


// === 스테이지 2: 객체지향 ===
function loadOopStage() {
    canvas.style.backgroundImage = "url(./testImg/Oop.png)";
    if (typeof resizeGame === 'function') resizeGame(800, 600);

    const rows = 7; const cols = 7;
    const layerPositions = { 1: [], 2: [], 3: [], 4: [] };
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let distFromEdge = Math.min(r, c, rows - 1 - r, cols - 1 - c);
            layerPositions[4 - distFromEdge].push({ r: r, c: c });
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
            while (blockPool.length < numBlocks) blockPool.push({ type: "normal", text: "", color: COLOR_NORMAL, hp: 1, indestructible: false });
        } else if (layer === 3) {
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
            while (blockPool.length < numBlocks) blockPool.push({ type: "normal", text: "", color: COLOR_NORMAL, hp: 1, indestructible: false });
        } else if (layer === 2) {
            blockPool.push({ type: "private_W", text: "int W", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            blockPool.push({ type: "private_X", text: "double X", color: COLOR_PRIVATE, hp: 1, indestructible: true });
            blockPool.push({ type: "public_W", text: "int getW", color: COLOR_PUBLIC, hp: 1, indestructible: false });
            blockPool.push({ type: "public_X", text: "double getX", color: COLOR_PUBLIC, hp: 1, indestructible: false });
            blockPool.push({ type: "protected_K", text: "protected int K", color: COLOR_PROTECTED, hp: 1, indestructible: false });
            blockPool.push({ type: "protected_B", text: "protected string B", color: COLOR_PROTECTED, hp: 1, indestructible: false });
            while (blockPool.length < numBlocks) blockPool.push({ type: "normal", text: "", color: COLOR_NORMAL, hp: 1, indestructible: false });
        } else if (layer === 1) { 
            blockPool.push({ type: "BOSS", text: "BOSS", color: COLOR_BOSS, hp: 15, indestructible: false });
        }

        for (let i = blockPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [blockPool[i], blockPool[j]] = [blockPool[j], blockPool[i]];
        }
        positions.forEach((pos, index) => blockGrid[pos.r][pos.c] = { ...blockPool[index], layer: layer });
    }

    createGrid(rows, cols, startX, startY, (r, c, brickX, brickY) => {
        let bData = blockGrid[r][c];
        if (!bData) return; 

        let initialStatus = (bData.layer === 4) ? 1 : "LOCK"; 
        let initialColor  = (bData.layer === 4) ? bData.color : "#222222"; 
        let initialText   = bData.text;

        let effect = () => {
            const destroyTarget = (targetLayer, targetType) => {
                let target = bricks.find(b => b.layer === targetLayer && b.realType === targetType && b.status !== 0);
                if (target) { target.status = 0; brokenBricksCount++; }
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
                        if (b.realType === "BOSS") {
                            b.expand(); 
                        } else {
                            b.status = 1; 
                            if (b.tempData) b.color = b.tempData.color; 
                            b.text = b.realText; 
                        }
                    }
                });
            }

            if (bData.type === "BOSS") {
                let currentBoss = bricks.find(b => b.realType === "BOSS");
                if (currentBoss) spawnBomb(currentBoss.x + currentBoss.width / 2, currentBoss.y + currentBoss.height / 2);
            }
        };

        let newBrick = new BossBrick(brickX, brickY, {
            status: initialStatus, color: initialColor, text: initialText, realText: bData.text, 
            realType: bData.type, layer: bData.layer, effectFunc: effect, hp: bData.hp, indestructible: bData.indestructible
        });
        newBrick.tempData = { color: bData.color };
        bricks.push(newBrick); totalBricks++; 
    });
}

// === 스테이지 3: 점심시간 ===
function loadLunchStage(){
    canvas.style.backgroundImage = "url(./testImg/lunchTime.jpeg)";
    isGameOver = true;
    startScene("lunchTime");
}

// === 스테이지 4: 자료구조 ===
function loadDSStage4(treeDepth = 4) {
    canvas.style.backgroundImage = "url(./testImg/Ds.png)";
    if (typeof resizeGame === 'function') resizeGame(1280, 800); 
    
    const startY = 80, gapY = 80, centerX = canvas.width / 2;
    const getRandomEffect = (blockX, blockY, blockWidth, blockHeight) => {
        const weightedEffects = [
            { weight: 10, effect: () => setBallOpacity(0.2) }, 
            { weight: 15, effect: subBarsize },               
            { weight: 15, effect: addBarsize },               
            { weight: 10, effect: () => { dx = dx > 0 ? dx + 1 : dx - 1; dy = dy > 0 ? dy + 1 : dy - 1; } }, 
            { weight: 20, effect: spawnRandomBrick },         
            { weight: 10, effect: () => spawnBomb(blockX + blockWidth / 2, blockY + blockHeight / 2) },      
            { weight: 20, effect: () => {} }                  
        ];
        let rand = Math.random() * 100, cumulativeWeight = 0;
        for (let i = 0; i < weightedEffects.length; i++) {
            cumulativeWeight += weightedEffects[i].weight;
            if (rand < cumulativeWeight) return weightedEffects[i].effect;
        }
        return () => {};
    };

    let leafGap = 150; 
    const maxLeaves = Math.pow(2, treeDepth - 1); 
    if (maxLeaves > 1) {
        const maxAllowedGap = (canvas.width - 140) / (maxLeaves - 1);
        leafGap = Math.min(leafGap, maxAllowedGap);
    }

    for (let level = 0; level < treeDepth; level++) {
        let numNodes = Math.pow(2, level); 
        let currentY = startY + level * gapY;
        let gapX = leafGap * Math.pow(2, (treeDepth - 1) - level);
        let startX = centerX - ((numNodes - 1) * gapX) / 2;
        
        for (let i = 0; i < numNodes; i++) {
            let nodeCenterX = startX + i * gapX;
            if (level === treeDepth - 1) {
                let bWidth = brickWidth * 1.5;
                let blockX = nodeCenterX - bWidth / 2;
                let isStack = (i % 2 === 0);
                let dsType = isStack ? "stack" : "queue";
                let color = isStack ? "#3498DB" : "#2ECC71";
                bricks.push(new Stage4Brick(blockX, currentY, { color: color, dsType: dsType, effectFunc: getRandomEffect(blockX, currentY, bWidth, brickHeight) }));
            } else {
                let blockX = nodeCenterX - brickWidth / 2;
                let text = (level === 0) ? "Root" : "Node";
                let color = (level === 0) ? "#F1C40F" : (i % 2 === 0 ? "#E74C3C" : "#9B59B6");
                let effect = (level === 0) ? () => {
                    bricks.forEach(b => { if (b.status !== 0) { b.status = 0; brokenBricksCount++; } });
                } : getRandomEffect(blockX, currentY, brickWidth, brickHeight);
                bricks.push(new Brick(blockX, currentY, { color: color, text: text, effectFunc: effect }));
            }
            totalBricks++;
        }
    }
}

// === 스테이지 5: 웹프로그래밍 ===
function loadWebprogrammingStage(){}


// ==========================================
// 7. UI 제어 및 이벤트 리스너 (버튼 클릭, 키보드 입력)
// ==========================================

// UI 통합 관리 함수 //원하는 화면만 키는 함수
function switchScreen(screenToDisplay, displayStyle = "flex") {
    if (currentActiveScreen) currentActiveScreen.style.display = "none";
    if (screenToDisplay) screenToDisplay.style.display = displayStyle;
    currentActiveScreen = screenToDisplay; 
}


// 대화 관련 함수
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
    if(questBox) questBox.style.display = 'none';
}
function nextDialogue() {
    if (!currentScript || currentScript.length === 0 || isGameStarted) return; // ★ 이미 게임이 시작됐다면 대화창 이벤트 무시 
    currentIndex++;
    showDialogue();
}

// 화면 사이즈 변경
function resizeGame(newWidth, newHeight) {
    canvas.width = newWidth; canvas.height = newHeight;
    canvas.style.width = newWidth + "px"; canvas.style.height = newHeight + "px";
    const gameContainer = document.getElementById("gameContainer");
    if(gameContainer) { gameContainer.style.width = newWidth + "px"; gameContainer.style.height = newHeight + "px"; }
    if(gameOverScreen) { gameOverScreen.style.width = newWidth + "px"; gameOverScreen.style.height = newHeight + "px"; }
    if(gameClearScreen){ gameClearScreen.style.width = newWidth + "px"; gameClearScreen.style.height = newHeight + "px"; }
    paddleX = (newWidth - paddleWidth) / 2; // 패들을 새로운 화면 중앙으로 보정
    x = newWidth / 2; y = newHeight - 30;
}

// 이벤트 핸들러
function mouseMoveHandler(e) {
    const relativeX = e.clientX - canvas.getBoundingClientRect().left;
    if(relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
        if (paddleX < 0) paddleX = 0;
        if (paddleX + paddleWidth > canvas.width) paddleX = canvas.width - paddleWidth;
    }
}
function clickBombHandler(e) { //폭탄 클릭 핸들러
    const relativeX = e.clientX - canvas.getBoundingClientRect().left;
    const relativeY = e.clientY - canvas.getBoundingClientRect().top;
    for (let i = 0; i < bombs.length; i++) {
        let b = bombs[i];
        if (b.isActive) {
            const dist = Math.hypot(relativeX - b.x, relativeY - b.y);
            if (dist <= b.radius + 10) b.isActive = false; // 폭탄 해제
        }
    }
}
function cheatKeyHandler(e) {
    if (e.key === 'z' || e.key === 'Z') {
        if (currentStage !== 2) { currentStage = 2; initGame(); }
        let destroyedByCheat = 0;
        for (let i = 0; i < bricks.length; i++) {
            let b = bricks[i];
            if (b.realType !== "BOSS" && b.status !== 0) {
                b.status = 0; destroyedByCheat++;
            } else if (b.realType === "BOSS" && b.status !== 0) {
                b.expand(); b.hp = 15; b.status = 1;
            }
        }
        brokenBricksCount += destroyedByCheat;
    }
}

// 이벤트 리스너 등록
document.addEventListener("mousemove", mouseMoveHandler, false);
document.addEventListener("keydown", cheatKeyHandler, false);
canvas.addEventListener("click", clickBombHandler, false); // 폭탄 클릭 이벤트

window.addEventListener("keydown", (e) => {
    if (e.key === 'k') clearGame(); //클리어 화면 출력
    if (e.key === ' ' || e.key === 'Enter') { //스페이스나 엔터로 다음 창 진행
      if (e.key === ' ') e.preventDefault(); //스페이스로 화면 내려가기 방지
      nextDialogue();
    }
});

window.addEventListener("load", () => {
    console.log("대화창 관련 요소 로딩 시작");
    const dialogueBox = document.getElementById("quest-box");
    if (dialogueBox) {
      dialogueBox.addEventListener("click", (e) => { if (e.button === 0) nextDialogue(); });
      console.log("대화창 클릭 이벤트 연결");
    } else {
      console.error("HTML에서 'quest-box' ID를 찾을 수 없습니다. HTML 코드를 확인해주세요.");
    }
});

restartBtn.forEach((item)=>{
    item.addEventListener("click", ()=>{ if(isCleared) currentStage--; initGame(); });
});
mainBtn.forEach((item)=>{
    item.addEventListener("click", ()=>{
        switchScreen(mainScreen); // 메인 화면
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        resizeGame(600,400);
        canvas.style.backgroundImage = "";
    });
});
nextBtn.addEventListener("click",initGame); //다음으로 버튼
startNewGameBtn.addEventListener("click", () => { //게임 시작 버튼 이벤트
    currentStage = 0; 
    switchScreen(stageSelectModal); 
    stageItemBtns.forEach(btn => { //선택가능한 스테이지 목록 갱신
        if(maxStage >= Number(btn.value)) btn.classList.remove("disable");
    });});
closeStageBtn.addEventListener("click", ()=>{ switchScreen(mainScreen); }); //스테이지 창 닫기
difficultyBtn.addEventListener("click", () => { difficultyModal.style.display = "flex"; }); //난이도 창 열기
closeDifficultyBtn.addEventListener("click", () => { difficultyModal.style.display = "none"; }); //난이도 창 닫기

stageItemBtns.forEach(btn => { //스테이지 선택 이벤트
    btn.addEventListener("click", (e) => {
        let selectedStage = parseInt(e.target.getAttribute("value"));
        stageSelectModal.style.display = "none";
        mainScreen.style.display = "none";
        currentStage = selectedStage;
        initGame();
    });
});
diffItemBtns.forEach(btn => { //난이도 변경 이벤트
    btn.addEventListener("click", (e) => {
        const level = e.currentTarget.getAttribute("value");
        const selectLevel = diff[level];
        targetPaddleWidth = selectLevel.paddleWidth * 10; 
        ballSpeed = selectLevel.speed; 
        diffItemBtns.forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        console.log(`난이도 변경 완료! 현재 속도: ${ballSpeed}, 패들 크기: ${targetPaddleWidth}`);
    });
});
optionBtn.addEventListener("click",()=>{ //옵션창 열기
    switchScreen(optionModal);
});
closeOptionBtn.addEventListener("click",()=>{ //옵션창 닫기
    switchScreen(mainScreen);
})
ballSkinSelect.addEventListener("change", (e) => { //공 이미지 선택 이벤트
    const val = e.target.value;
    if (val === "default") {
        ballSkinType = "default";
    } else if (val === "rgb") {
        ballSkinType = "rgb";
    } else {
        ballSkinType = "image";
        ballImage = new Image();
        ballImage.src = val; // 야구공, 농구공, 축구공 이미지 로드
    }
});

paddleSkinSelect.addEventListener("change", (e) => { //패들 이미지 선택 이벤트
    const val = e.target.value;
    if (val === "default") {
        paddleSkinType = "default";
    } else if (val === "rgb") {
        paddleSkinType = "rgb";
    } else {
        paddleSkinType = "image";
        paddleImage = new Image();
        paddleImage.src = val; // 나무, 금속, 우레탄 바 이미지 로드
    }
});


// ==========================================
// 8. 메인 엔진 (게임 루프 및 초기화)
// ==========================================
function StageClear() { //클리어 제어 분리
    if (currentStage === 1) { // 이산수학 미니 스테이지의 경우
        clearCount++;
        if (clearCount < gateStageCount) {                           
            bricks = []; brokenBricksCount = 0; totalBricks = 0;
            resetBallAndPaddle(); // 공, 패들 위치 초기화
            loadDiscreteStage(); // 다음 미니 스테이지/보스 로드
            return;
        } else clearCount = 0;
    }
    clearGame(); // 그 외 일반 스테이지 완전 클리어 시
}

// 게임 종료/클리어 처리 함수
function endGame(message) {
    isGameOver = true; isGameStarted = false;
    gameOverMessage.innerText = message;
    switchScreen(gameOverScreen); 
}
function clearGame(){
    isGameOver = true; isGameStarted = false; isCleared = true;
    currentStage++;
    if (currentStage > maxStage) maxStage = currentStage;
    switchScreen(gameClearScreen); 
}

function resetBallAndPaddle() { //공, 패들 리셋 함수
    x = canvas.width / 2;
    y = canvas.height - 30;
    const startAngle = Math.random() * Math.PI / 4; 
    dx = ballSpeed * Math.sin(startAngle); dy = -ballSpeed * Math.cos(startAngle);
    paddleX = (canvas.width - paddleWidth) / 2;
}

function initGame() {
    //기존 게임 루프 끄기
    if (animationId !== null) cancelAnimationFrame(animationId);

    resetBallAndPaddle();
    brokenBricksCount = 0;
    isGameOver = false;
    isGameStarted = true;
    isCleared = false;
    ballOpacity = 1.0; // 투명도 초기화
    
    if (opacityTimeoutId !== null) {
        clearTimeout(opacityTimeoutId); opacityTimeoutId = null;
    }
    
    resizeGame(600,400); //화면 사이즈 조정
    switchScreen(); // UI 숨기기
    loadStage(currentStage);
    loop();
}

// 메인 게임 루프 (draw 이름이 겹쳐서 loop로 변경)
function loop() { 
    if (isGameOver) return; // 게임 오버 상태면 그리기 루프 중단

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    rgb = (rgb + 1.5) % 360; //공 rgb값 변경

    drawBricks();
    drawBall();
    drawPaddle();
    drawBombs();

    if(isGameStarted){ //게임 시작 시에만 작동
        if(currentStage == 1) updateCircuits(); //이산스테이지 출력 변화
        collisionDetection();
        updateBall();
        updatePaddle();
        updateBombs();
        if(brokenBricksCount >= totalBricks) StageClear();
    }
    
    // 충돌 감지 직후 승리하여 isGameOver가 true로 바뀌었다면 진행 멈춤
    if (isGameOver) return; 
    animationId = requestAnimationFrame(loop);
}

// 최초 실행시 메인화면 띄우기
switchScreen(mainScreen);
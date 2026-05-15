// script.js

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// UI 요소 가져오기
const gameOverScreen = document.getElementById("gameOverScreen");
const gameOverMessage = document.getElementById("gameOverMessage");
const restartBtn = document.getElementById("restartBtn");

// 게임 상태 변수 선언
let x, y, dx, dy, paddleX, brokenBricksCount;
let isGameOver = false;

let ballOpacity = 1.0; // 공의 투명도
let opacityTimeoutId = null; // 투명도 복구 타이머 ID 15~16줄

const ballRadius = 8;
const paddleHeight = 10;
let paddleWidth = 100;
let targetPaddleWidth = 100;

const brickRowCount = 4;
const brickColumnCount = 6;
const brickWidth = 80;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 35;

let bricks = [];
const totalBricks = brickRowCount * brickColumnCount;

//객체에서 Brick class로 변경, 속성이 많아질 거 같아 Object.assign으로 구현
class Brick {
    constructor(x, y, option = {}) { //생성할때 x,y는 필수로 넣고 나머지는 baseSettings 에서 바꾸고 싶은것만 {}로 감싸서 넣으면 됨, 없는 속성 추가도 가능
        this.x = x;
        this.y = y;

        const baseSettings = {
            status: 1, //status 0:깨진블록 1:일반블록
            effectFunc: ()=>{}, //구현한 기능 함수
            color: "#787878"
        };

        Object.assign(this, baseSettings, option);
    }

    onHit() { //블록 깼을때 기능 함수 실행
        this.effectFunc();
    }

    draw(ctx) {
        if (this.status !== 0) {
            ctx.beginPath();
            ctx.rect(this.x, this.y, brickWidth, brickHeight);
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.closePath();
        }
    }
}

// 벽돌 배열 기본 생성 (최초 1회) // 미리 X,Y 계산해서 객체 생성하도록 변경 60~62
const colors = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00"];
for(let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for(let r = 0; r < brickRowCount; r++) {
        let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
        let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
        if(r == brickRowCount-1 && c == 2){ // 마지막행 3열에 테스트용 투명화 블록 생성
            bricks[c][r] = new Brick(brickX, brickY, {color: "#000000", effectFunc:()=>setBallOpacity(0.2)});
            continue;
        }

        if(r==brickRowCount-4&&c==1){
            bricks[c][r]=new Brick(brickX, brickY, {color: "blue",effectFunc:()=>subBarsize()});
            continue;
        }

        if(r==brickRowCount-2&&c==3){
            bricks[c][r]=new Brick(brickX, brickY, {color: "purple",effectFunc:()=>addBarsize()});
            continue;
        }

        bricks[c][r] = new Brick(brickX, brickY, {color: colors[r]}); //클래스로 생성
    }
}

// 이벤트 리스너 추가
document.addEventListener("mousemove", mouseMoveHandler, false);
restartBtn.addEventListener("click", initGame); // 다시 시작 버튼 클릭 시 게임 초기화

function mouseMoveHandler(e) {
    const relativeX = e.clientX - canvas.getBoundingClientRect().left;
    if(relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
        if (paddleX < 0) paddleX = 0;
        if (paddleX + paddleWidth > canvas.width) paddleX = canvas.width - paddleWidth;
    }
}

// 게임 초기화 및 재시작 함수
function initGame() {
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = 3;
    dy = -3;
    paddleX = (canvas.width - paddleWidth) / 2;
    brokenBricksCount = 0;
    isGameOver = false;
    ballOpacity = 1.0; // 투명도 초기화 63~67줄
    if (opacityTimeoutId !== null) {
        clearTimeout(opacityTimeoutId);
        opacityTimeoutId = null;
    }

    // 벽돌 상태 초기화
    for(let c = 0; c < brickColumnCount; c++) {
        for(let r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = 1;
        }
    }

    // UI 숨기고 그리기 시작
    gameOverScreen.style.display = "none";
    draw();
}

// 게임 종료 처리 함수
function endGame(message) {
    isGameOver = true;
    gameOverMessage.innerText = message;
    gameOverScreen.style.display = "flex"; // 오버레이 화면 표시
}

// 충돌 감지 함수
function collisionDetection() {
    for(let c = 0; c < brickColumnCount; c++) {
        for(let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if(b.status === 1) {
                if(x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                    dy = -dy;
                    b.status = 0; 
                    brokenBricksCount++;
                    b.onHit(); // 블럭 깼을때 블록에 맞는 효과 발동
                    if(brokenBricksCount === totalBricks) {
                        endGame("모든 벽돌을 제거했습니다. 승리!");
                    }
                }
            }
        }
    }
}

// 그리기 함수들
function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255, 0, 0, ${ballOpacity})`; // RGBA를 사용하여 투명도 적용
    ctx.fill();
    ctx.closePath();
}

// 공 투명도 조절 함수
function setBallOpacity(opacity) {
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
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#000000"; 
    ctx.fill();
    ctx.closePath();
}

function drawBricks() { //Brick class에 draw 메소드 이용해 변경
    for(let c = 0; c < brickColumnCount; c++) {
        for(let r = 0; r < brickRowCount; r++) {
            bricks[c][r].draw(ctx);
        }
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
    collisionDetection();
    

    // 충돌 감지 직후 승리하여 isGameOver가 true로 바뀌었다면 진행 멈춤
    if (isGameOver) return; 


    let previousWidth = paddleWidth; 
    paddleWidth += (targetPaddleWidth - paddleWidth) * 0.016; 
   
    paddleX -= (paddleWidth - previousWidth) / 2;

    if (paddleX + paddleWidth > canvas.width) {
        paddleX = canvas.width - paddleWidth;
    }


    // 좌우 벽면 충돌
    if(x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    
    // 상단 벽면 충돌
    if(y + dy < ballRadius) {
        dy = -dy;
    } 
    // 하단 충돌 확인
    else if(y + dy > canvas.height - ballRadius) {
        if(x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
        } else {
            endGame("바닥에 닿았습니다. 게임 오버!");
            return; // 그리기 루프 즉시 중단
        }
    }

    x += dx;
    y += dy;
    
    requestAnimationFrame(draw);
}

// 스크립트가 로드되면 최초 게임 시작
initGame();
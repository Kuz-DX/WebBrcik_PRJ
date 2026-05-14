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

const ballRadius = 8;
const paddleHeight = 10;
const paddleWidth = 100;

const brickRowCount = 4;
const brickColumnCount = 6;
const brickWidth = 80;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 35;

let bricks = [];
const totalBricks = brickRowCount * brickColumnCount;

// 벽돌 배열 기본 생성 (최초 1회)
for(let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for(let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
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
    ctx.fillStyle = "red"; 
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

function drawBricks() {
    for(let c = 0; c < brickColumnCount; c++) {
        for(let r = 0; r < brickRowCount; r++) {
            if(bricks[c][r].status === 1) {
                let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                const colors = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00"];
                ctx.fillStyle = colors[r]; 
                ctx.fill();
                ctx.closePath();
            }
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
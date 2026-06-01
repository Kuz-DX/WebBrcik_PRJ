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
const gamePauseScreen = document.getElementById("gamePauseScreen");
const mainScreen = document.getElementById("mainScreen");
const restartBtn = document.querySelectorAll(".restartBtn");
const mainBtn = document.querySelectorAll(".mainBtn");
const stageSelectBtn = document.getElementById("stageSelectBtn");
const stageSelectModal = document.getElementById("stageSelectModal");
const closeStageBtn = document.getElementById("closeStageBtn");
const stageItemBtns = document.querySelectorAll(".stage-item-btn");
const nextBtn = document.getElementById("nextBtn");
const resumeBtn = document.getElementById("resumeBtn");
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
const dialogueArea = document.getElementById("dialogueArea");
const gameStartArea = document.getElementById("gameStartArea");
const startBtn = document.getElementById("startBtn");
const clearBtns = document.getElementById("clearBtn");
const howToPlayBtn = document.getElementById("howToPlayBtn");
const howToPlayModal = document.getElementById("howToPlayModal");
const closeHowToPlayBtn = document.getElementById("closeHowToPlayBtn");

// 게임 루프 및 흐름 제어 변수
let animationId = null; // 애니메이션 루프 ID를 저장할 변수
let isGameOver = true;
let isGameStarted = false;
let isCleared = false; //스테이지 클리어 상태 변수
let currentActiveScreen = null;

// 게임 상태 변수 선언 (공, 패들)
let x, y, dx, dy, paddleX;
let ballSpeed = 4; //공속도 변수 이름 통일
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
let maxStage = 5;        // 최대 진행 스테이지 변수
let clearCount = 0;      // 이산수학 미니 스테이지 클리어 수
let brokenBricksCount = 0; // 부순 벽돌 개수
let totalBricks = 0;     // 스테이지마다 깨야 할 목표 벽돌 개수
let paddleHitCount = 0;  // 패들에 공이 부딪힌 횟수(cost)
let currentWebPhase = 0; // 웹 프로그래밍 페이즈 관리 변수
let playerHp = 3;        // 플레이어 체력 변수
let specialBalls = [];   // 특수공 배열
let specialBallTimer = 0; // 특수공 생성 타이머
let bossBombTimer = 0;   // 보스 폭탄 생성 타이머


// ==========================================
// 2. 게임 데이터 및 상수 (난이도, 스토리, 상태맵)
// ==========================================
const gateStageCount = 3; //이산수학 게이트 스테이지 수(마지막은 회로)

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
    easy: { paddleWidth : 15, speed : 8, bombProb : 3 },
    normal: { paddleWidth : 12, speed : 10, bombProb : 10 },
    gosu : { paddleWidth : 10, speed : 12, bombProb : 12 },
    goat : { paddleWidth : 7, speed : 15, bombProb : 20 }
};

//대화창 관련 변수
let allStoryData = {}; 
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
            // 2페이즈에서는 게임오버 대신 체력 감소
            if (currentStage === 5 && currentWebPhase === 2) {
                playerHp--;
                paddleHitCount += 10;
                if (playerHp <= 0) {
                    endGame("체력이 모두 소진되었습니다. 게임 오버!");
                }
            } else {
                endGame("폭탄이 바닥에 떨어졌습니다. 게임 오버!");
            }
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

    onHit(damage = 1) { //블록 쳤을때 기능 함수 실행 //status 맵 활용 추가
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
        this.realType = option.realType || ""; 

        //  이미지 경로가 옵션으로 들어오면 Image 객체 생성!
        if (option.imageSrc) {
            this.image = new Image();
            this.image.src = option.imageSrc;
        }
    }

    onHit(damage = 1) {
        if (this.status === "LOCK") return; 
        if (this.isIndestructible) return; // private 블록 무적 방어

        if (this.status === 1) {
            this.hp -= damage; 
            // hit 할 수 있는 상황이라면 생명력이 감소
            if (this.hp <= 0) {
                this.hp = 0;
                // 생명력이 0보다 작아지면 hit되므로 감소
                this.status = 0;
                brokenBricksCount++; 
                this.effectFunc(); 
            }
        }
    }

    draw(ctx) {
        if (this.status === 0) return;

        const drawWidth = this.width || brickWidth;
        const drawHeight = this.height || brickHeight;
        
        // 이미지가 있고 로딩이 완료되었다면 이미지를 출력!
        if (this.image && this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, drawWidth, drawHeight);
        } else {
            // 이미지가 없거나 로딩 전이면 기존처럼 색상 사각형 출력
            ctx.beginPath();
            ctx.rect(this.x, this.y, drawWidth, drawHeight);
            ctx.fillStyle = this.color; 
            ctx.fill();
            ctx.closePath();
        }

        // 상태가 "LOCK"이더라도 자신의 고유 텍스트를 출력
        if (this.text !== "") {
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 14px 'Galmuri11', sans-serif"; 
            ctx.textAlign = "center";   
            ctx.textBaseline = "middle";
            ctx.fillText(this.text, this.x + drawWidth / 2, this.y + drawHeight / 2);
        }

        // 보스 체력바 렌더링
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

    onHit(damage = 1) {
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

class SpecialBall {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20; // 기본공 12보다 큼
        this.color = "#3498DB"; // 파랑색
        
        let rand = Math.random();
        if (rand < 0.5) {
            this.text = "팀플";
            this.damage = 5;
        } else {
            this.text = "과제";
            this.damage = 10;
        }
        
        // 보스 아래에서 시작해서 떨어짐
        this.dx = (Math.random() - 0.5) * 3; // x축 속도 랜덤
        this.dy = 3; // y축 아래로
        this.isActive = true;
    }
    
    draw(ctx) {
        if (!this.isActive) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 12px 'Galmuri11', sans-serif";
        ctx.textAlign = "center";   
        ctx.textBaseline = "middle";
        ctx.fillText(this.text, this.x, this.y);
    }
    
    update() {
        if (!this.isActive) return;
        
        // 벽 충돌 (튕기기)
        if (this.x + this.dx > canvas.width - this.radius || this.x + this.dx < this.radius) {
            this.dx = -this.dx;
        }
        if (this.y + this.dy < this.radius) {
            this.dy = -this.dy;
        }
        
        // 패들 충돌
        if(this.y + this.dy > canvas.height - this.radius - paddleHeight) {
            if(this.x > paddleX - this.radius && this.x < paddleX + paddleWidth + this.radius) {
                let hitPoint = this.x - (paddleX + paddleWidth / 2);
                let normalizedHit = hitPoint / ((paddleWidth / 2) + this.radius);
                normalizedHit = Math.max(-1, Math.min(1, normalizedHit));
                let bounceAngle = normalizedHit * (Math.PI / 3); 
                
                let speed = Math.max(ballSpeed * 0.8, Math.hypot(this.dx, this.dy));
                this.dx = speed * Math.sin(bounceAngle);
                this.dy = -speed * Math.cos(bounceAngle); 
                this.y = canvas.height - paddleHeight - this.radius;
            }
        }
        
        // 바닥 충돌 (소멸) - "튕기지못하고 바닥에 떨어지면 그냥 소멸해"
        if (this.y + this.dy > canvas.height - this.radius) {
            this.isActive = false;
        }
        
        this.x += this.dx;
        this.y += this.dy;
        
        this.checkCollision();
    }
    
    checkCollision() {
        let hasCollidedThisFrame = false; 

        for(let i = 0; i < bricks.length; i++) {
            if (hasCollidedThisFrame) break; 
            let b = bricks[i];
            
            if(b.status !== 0) { 
                let currentWidth = b.width || brickWidth;
                let currentHeight = b.height || brickHeight;
                let closestX = Math.max(b.x, Math.min(this.x, b.x + currentWidth));
                let closestY = Math.max(b.y, Math.min(this.y, b.y + currentHeight));
                let distanceX = this.x - closestX;
                let distanceY = this.y - closestY;
                let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

                if (distanceSquared < (this.radius * this.radius)) {
                    hasCollidedThisFrame = true; 
                    
                    let prevX = this.x - this.dx;
                    let prevY = this.y - this.dy;
                    let hitTopOrBottom = (prevY <= b.y || prevY >= b.y + currentHeight);
                    let hitLeftOrRight = (prevX <= b.x || prevX >= b.x + currentWidth);

                    if (hitTopOrBottom && !hitLeftOrRight) {
                        this.dy = -this.dy; 
                        this.y = (prevY <= b.y) ? b.y - this.radius : b.y + currentHeight + this.radius;
                    } else if (hitLeftOrRight && !hitTopOrBottom) {
                        this.dx = -this.dx; 
                        this.x = (prevX <= b.x) ? b.x - this.radius : b.x + currentWidth + this.radius;
                    } else {
                        let distance = Math.sqrt(distanceSquared);
                        if (distance === 0) {
                            this.dx = -this.dx; this.dy = -this.dy;
                        } else {
                            let nx = distanceX / distance; let ny = distanceY / distance;
                            let dotProduct = (this.dx * nx) + (this.dy * ny);
                            this.dx = this.dx - 2 * dotProduct * nx; this.dy = this.dy - 2 * dotProduct * ny;
                            this.x = closestX + nx * this.radius; this.y = closestY + ny * this.radius;
                        }
                    }
                    
                    b.onHit(this.damage); 
                    
                    if (b.realType === "BOSS") {
                        this.isActive = false;
                    }
                }
            }
        }
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
                b.onHit(1); 
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
        paddleHitCount++;
    }
}

// 공 위치 업데이트 함수
function updateBall(){
    // 1. 벽 충돌
    if(x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
    if(y + dy < ballRadius) dy = -dy; 
    
    // 2. 패들 충돌
    checkPaddleCollision();
    
    // 3. 바닥 충돌 (게임오버 방지 및 체력 감소)
    if(y + dy > canvas.height - ballRadius) {
        playerHp--;
        paddleHitCount += 10; //cost 10 증가
        if (playerHp <= 0) {
            endGame("체력이 모두 소진되었습니다. 게임 오버!");
        } else {
            resetBallAndPaddle();
        }
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
    // 웹프로그래밍 2페이즈 보스 폭탄 투하 패턴 (4초마다)
    if (currentStage === 5 && currentWebPhase === 2) {
        let boss = bricks.find(b => b.realType === "BOSS");
        if (boss && boss.status !== 0) {
            bossBombTimer += 16;
            if (bossBombTimer >= 4000) {
                spawnBomb(boss.x + boss.width / 2, boss.y + boss.height);
                bossBombTimer = 0;
            }
        }
    }

    for(let i = 0; i < bombs.length; i++) {
        bombs[i].update();
    }
}

// 특수공 업데이트 함수
function updateSpecialBalls() {
    // 3초마다 특수공 스폰 확인 (웹프로그래밍 스테이지 2페이즈 전용)
    if (currentStage === 5 && currentWebPhase === 2) {
        if (specialBalls.length === 0) {
            specialBallTimer += 16;
            if (specialBallTimer >= 3000) {
                spawnSpecialBall();
                specialBallTimer = 0;
            }
        } else {
            specialBallTimer = 0;
        }
    }

    // 특수공 업데이트
    for (let i = specialBalls.length - 1; i >= 0; i--) {
        let sb = specialBalls[i];
        sb.update();
        if (!sb.isActive) {
            specialBalls.splice(i, 1);
        }
    }
}

function spawnSpecialBall() {
    let radius = 20; // 특수공의 기본 반지름

    // 패들과 바로 충돌하지 않게 캔버스 내 랜덤 위치 설정
    let spawnX = radius + Math.random() * (canvas.width - radius * 2);
    let spawnY = radius + Math.random() * (canvas.height - paddleHeight - radius * 4);
    let speed = Math.random() * 3 + 3; 
    let dx, dy;

    let boss = bricks.find(b => b.realType === "BOSS");
    if (boss) {
        let bossLeft = boss.x;
        let bossRight = boss.x + boss.width;
        let bossBottom = boss.y + boss.height;

        if (spawnX < bossLeft) {
            // 보스 왼쪽: -x 방향으로만 가속 (120도 ~ 240도)
            let angle = (2/3 * Math.PI) + Math.random() * (2/3 * Math.PI);
            dx = Math.cos(angle) * speed;
            dy = Math.sin(angle) * speed;
        } else if (spawnX > bossRight) {
            // 보스 오른쪽: +x 방향으로만 가속 (-60도 ~ 60도)
            let angle = (-1/3 * Math.PI) + Math.random() * (2/3 * Math.PI);
            dx = Math.cos(angle) * speed;
            dy = Math.sin(angle) * speed;
        } else {
            // 보스 양끝단 사이: 위쪽에 스폰되지 않게 Y좌표 강제 조정
            if (spawnY < bossBottom + radius) {
                spawnY = bossBottom + radius + Math.random() * 50;
            }
            // 연직 방향으로만 가속 (캔버스에서는 +y가 아래 방향)
            dx = 0;
            dy = speed;
        }
    } else {
        // 360도 랜덤한 방향으로 랜덤 속도 설정
        let angle = Math.random() * Math.PI * 2;
        dx = Math.cos(angle) * speed;
        dy = Math.sin(angle) * speed;
    }

    let sb = new SpecialBall(spawnX, spawnY);
    
    sb.dx = dx;
    sb.dy = dy;

    specialBalls.push(sb);
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

function drawSpecialBalls() {
    for(let i = 0; i < specialBalls.length; i++) {
        specialBalls[i].draw(ctx);
    }
}

// 점수 계산 및 상단 UI(Score, 진행바, HP) 통합 그리기 함수
function drawTopUI() {
    // 공통 폰트 베이스 설정
    ctx.textBaseline = "top";
    
    // ==========================================
    // 1. HP 영역 (좌측)
    // ==========================================
    ctx.textAlign = "left"; 
    ctx.font = "16px 'Galmuri11', 'Press Start 2P', sans-serif"; 
    
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000000";
    ctx.strokeText("HP:", 15, 18);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("HP:", 15, 18);

    let heartStartX = 55; 
    let hpCount = Math.max(0, playerHp);
    for(let i = 0; i < hpCount; i++) {
        let hx = heartStartX + (i * 20);
        ctx.strokeText("♥", hx, 18);
        ctx.fillStyle = "#FF0000";   
        ctx.fillText("♥", hx, 18);
    }

    // ==========================================
    // 2. SCORE 영역 (우측)
    // ==========================================
    let currentScore = getCalculatedScore();
    let scoreText = `SCORE: ${(currentScore || 0).toFixed(1)}`;
    
    ctx.textAlign = "right"; 
    ctx.font = "16px 'Galmuri11', 'Press Start 2P', sans-serif"; 
    
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.strokeText(scoreText, canvas.width - 15, 18);
    
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000000";
    ctx.strokeText(scoreText, canvas.width - 15, 18);
    
    ctx.fillStyle = "#FFD700";
    ctx.fillText(scoreText, canvas.width - 15, 18);


    // ==========================================
    // 3. PROGRESS BAR 영역 (중앙)
    // ==========================================
    let remainingRatio = 1;
    if (totalBricks > 0 && totalBricks < 9000) {
        remainingRatio = Math.max(0, (totalBricks - brokenBricksCount) / totalBricks);
    } else if (totalBricks >= 9000) {
        let boss = bricks.find(b => b.realType === "BOSS");
        if (boss) remainingRatio = Math.max(0, boss.hp / boss.maxHp);
    }

    const barWidth = 200; 
    const barHeight = 8; 
    // 글씨 공간을 위해 바 중심을 살짝 왼쪽으로 배치
    const barX = (canvas.width - barWidth) / 2 - 15; 
    const barY = 22; 

    // 미니 스테이지 진척도
    let progressText = "";
    if (currentStage === 1) progressText = `MAP: ${clearCount + 1}/${gateStageCount}`;
    else if (currentStage === 5) progressText = `PHASE: ${currentWebPhase}/3`;
    
    if (progressText !== "") {
        ctx.textAlign = "right"; // 바(Bar)의 왼쪽 끝을 기준으로 정렬
        ctx.font = "12px 'Galmuri11', 'Press Start 2P', sans-serif";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#000000";
        ctx.strokeText(progressText, barX - 15, 20); // HP 높이와 균형을 맞춘 Y좌표(20)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(progressText, barX - 15, 20);
    }

    // 바 배경
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // 바 채우기
    let fillWidth = barWidth * remainingRatio;
    ctx.fillStyle = "#FFA500"; 
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    // 바 테두리
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000000";
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // 퍼센트 글씨 (바 우측에 테두리 추가)
    let percentText = `${Math.floor(remainingRatio * 100)}%`;
    ctx.textAlign = "left"; 
    ctx.textBaseline = "middle";
    ctx.font = "12px 'Galmuri11', 'Press Start 2P', sans-serif"; 
    
    // 테두리 적용
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#000000";
    ctx.strokeText(percentText, barX + barWidth + 10, barY + barHeight / 2);
    ctx.fillStyle = "#FFFFFF"; // 가독성과 일관성을 위해 흰색으로 통일
    ctx.fillText(percentText, barX + barWidth + 10, barY + barHeight / 2);
}

// ==========================================
// 5. 화면 렌더링 (그리기 전담 함수들)
// ==========================================
function drawBall() {

    if (ballSkinType === "image" && ballImage) {
        // 야구공, 농구공, 축구공 
        ctx.save(); 
        ctx.beginPath();
        ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(ballImage, x - ballRadius, y - ballRadius, ballRadius * 2, ballRadius * 2);
        
        ctx.restore();
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
    const startY = canvas.height - paddleHeight; // 스킨용 변수
    if (paddleSkinType === "wood"){
        let woodGrad = ctx.createLinearGradient(paddleX, 0, paddleX + paddleWidth, 0);
        woodGrad.addColorStop(0.0, "#8B5A2B");
        woodGrad.addColorStop(0.3, "#CD853F"); 
        woodGrad.addColorStop(0.5, "#DEB887");
        woodGrad.addColorStop(0.7, "#CD853F");
        woodGrad.addColorStop(1.0, "#8B5A2B");

        ctx.beginPath();
        ctx.rect(paddleX, startY, paddleWidth, paddleHeight);
        ctx.fillStyle = woodGrad;
        ctx.fill();

        ctx.strokeStyle = "rgba(74, 43, 14, 0.4)";
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.moveTo(paddleX, startY + (paddleHeight * 0.3));
        ctx.lineTo(paddleX + paddleWidth, startY + (paddleHeight * 0.3));
        ctx.moveTo(paddleX, startY + (paddleHeight * 0.7));
        ctx.lineTo(paddleX + paddleWidth, startY + (paddleHeight * 0.7));
        ctx.stroke();

        ctx.lineWidth = 1;
        ctx.strokeStyle = "#5C3A21";
        ctx.stroke();
        ctx.closePath();
    }
    else if (paddleSkinType === "steel") {
        // 금속
        const endY = canvas.height;
        let metalGrad = ctx.createLinearGradient(0, startY, 0, endY);
        
        metalGrad.addColorStop(0.0, "#ffffff"); 
        metalGrad.addColorStop(0.15, "#d0d5db");
        metalGrad.addColorStop(0.45, "#737a85"); 
        metalGrad.addColorStop(0.5, "#ffffff"); 
        metalGrad.addColorStop(0.55, "#9097a1");
        metalGrad.addColorStop(0.85, "#4a5059");
        metalGrad.addColorStop(1.0, "#1a1c20"); 

        ctx.beginPath();
        ctx.rect(paddleX, startY, paddleWidth, paddleHeight);
        ctx.fillStyle = metalGrad;
        ctx.fill();
        
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#b0b5bc";
        ctx.stroke();
        ctx.closePath();
    } 
    else if (paddleSkinType === "uretan"){
        let urethaneGrad = ctx.createLinearGradient(0, startY, 0, canvas.height);
        urethaneGrad.addColorStop(0.0, "#27ae60"); 
        urethaneGrad.addColorStop(0.5, "#1e7e43"); 
        urethaneGrad.addColorStop(1.0, "#14522c"); 

        ctx.beginPath();
        ctx.roundRect(paddleX, startY, paddleWidth, paddleHeight, 6); 
        ctx.fillStyle = urethaneGrad;
        ctx.fill();

        ctx.fillStyle = "rgba(0, 0, 0, 0.12)"; 
        for (let i = 4; i < paddleWidth - 4; i += 6) {
            ctx.fillRect(paddleX + i, startY + 4, 1.5, 1.5);
            ctx.fillRect(paddleX + i + 2, startY + paddleHeight - 6, 1.5, 1.5);
        }
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        for (let i = 7; i < paddleWidth - 4; i += 6) {
            ctx.fillRect(paddleX + i, startY + 7, 1.5, 1.5);
        }

        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(40, 180, 99, 0.3)"; 
        ctx.stroke();
        ctx.closePath();
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
    ctx.fillText(`cost : ${paddleHitCount}`, textX, textY);
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
// 추가된 중앙 정렬 함수
function calculateCenterOffset(rows, cols, offsetY = 0) {
    const totalWidth = cols * (brickWidth + brickPadding) - brickPadding;
    const totalHeight = rows * (brickHeight + brickPadding) - brickPadding;
    
    const startX = (canvas.width - totalWidth) / 2;
    const startY = (canvas.height - totalHeight) / 2 + offsetY;
    
    return { startX, startY };
}

function loadStage(stageIndex){
    
    //화면, 카운트 초기화
    bricks = []; brokenBricksCount = 0; totalBricks = 0; bombs = []; paddleHitCount = 0;

    //stageIndexdp 따라 함수를 호출
    switch(stageIndex){
    case 0: loadTutorialStage(); break;
    case 1: loadDiscreteStage(); break;
    case 2: loadOopStage(); break;
    case 3: loadLunchStage(); break;
    case 4: loadDSStage4(); break;
    case 5: loadWebprogrammingStage(); break;
    default: endGame("모든 스테이지를 클리어했습니다!"); break;
    }
}

// === 스테이지 0: 튜토리얼 ===
function loadTutorialStage(){
    startScene("intro");
    const brickRowCount = 4;
    const brickColumnCount = 6;
    const colors = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00"];
    const COLOR_ADDB      = "#E87F24";
    const COLOR_SUBB      = "#FFC81E";
    const COLOR_OPACITY   = "#F8C463"
    canvas.style.backgroundImage = "url(./testImg/CProgramming.png)";
    const { startX, startY } = calculateCenterOffset(brickRowCount, brickColumnCount, -50);
    createGrid(brickRowCount, brickColumnCount, startX, startY, (r, c, brickX, brickY) => {
        if(r == brickRowCount-1 && c == 2){ 
            bricks.push(new Brick(brickX, brickY, {color: COLOR_OPACITY, effectFunc:()=>setBallOpacity(0.2)}));
        } else if(r == brickRowCount-4 && c == 1){
            bricks.push(new Brick(brickX, brickY, {color: COLOR_SUBB, effectFunc:subBarsize})); 
        } else if(r == brickRowCount-2 && c == 3){
            bricks.push(new Brick(brickX, brickY, {color: COLOR_ADDB, effectFunc:addBarsize}));
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
    startScene("startDiscrete");
    canvas.style.backgroundImage = "url(./testImg/Discrete.png)";
    resizeGame(700, 550);

    const map = randomDiscreteMap();
    const brickRowCount = map.length;
    const brickColumnCount = map[0].length;
    const grid = Array.from({ length: brickRowCount }, () => Array(brickColumnCount).fill(null));

    const { startX, startY } = calculateCenterOffset(brickRowCount, brickColumnCount, -70);

    let confirmBlock = null;
    let finalOutputBlock = null;

    createGrid(brickRowCount, brickColumnCount, startX, startY, (r, c, brickX, brickY) => {
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
    startScene("startOop");
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
    const { startX, startY } = calculateCenterOffset(rows, cols, -70);
    const blockGrid = Array.from({ length: rows }, () => Array(cols).fill(null));

    const COLOR_PUBLIC    = "#3498DB"; 
    const COLOR_PROTECTED = "#2ECC71"; 
    const COLOR_PRIVATE   = "#E74C3C"; 
    const COLOR_NORMAL    = "#95A5A6"; 
    const COLOR_BOSS      = "#76941e";
    const COLOR_ADDB      = "#E87F24";
    const COLOR_SUBB      = "#FFC81E";
    const COLOR_OPACITY   = "#F8C463"

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
            blockPool.push({ type: "addbarblock", text: "", color: COLOR_ADDB, hp: 1, indestructible: false });
            blockPool.push({ type: "addbarblock", text: "", color: COLOR_ADDB, hp: 1, indestructible: false });
            blockPool.push({ type: "addbarblock", text: "", color: COLOR_ADDB, hp: 1, indestructible: false });
            blockPool.push({ type: "subbarblock", text: "", color: COLOR_SUBB, hp: 1, indestructible: false });
            blockPool.push({ type: "subbarblock", text: "", color: COLOR_SUBB, hp: 1, indestructible: false });
            blockPool.push({ type: "subbarblock", text: "", color: COLOR_SUBB, hp: 1, indestructible: false });
            blockPool.push({ type: "opacityblock", text: "", color: COLOR_OPACITY, hp: 1, indestructible: false });
            blockPool.push({ type: "opacityblock", text: "", color: COLOR_OPACITY, hp: 1, indestructible: false });
            blockPool.push({ type: "opacityblock", text: "", color: COLOR_OPACITY, hp: 1, indestructible: false });

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
            blockPool.push({ type: "addbarblock", text: "", color: COLOR_ADDB, hp: 1, indestructible: false });
            blockPool.push({ type: "subbarblock", text: "", color: COLOR_SUBB, hp: 1, indestructible: false });
            blockPool.push({ type: "opacityblock", text: "", color: COLOR_OPACITY, hp: 1, indestructible: false });
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
            if (bData.type === "addbarblock") addBarsize();
            if (bData.type === "subbarblock") subBarsize();
            if (bData.type === "opacityblock") setBallOpacity(0.2);

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
    startScene("startDataStructure");
    canvas.style.backgroundImage = "url(./testImg/Ds.png)";
    if (typeof resizeGame === 'function') resizeGame(1210, 650); 
    
    const startY = 80, gapY = 80, centerX = canvas.width / 2;
    const getRandomEffect = (blockX, blockY, blockWidth, blockHeight) => {
        const weightedEffects = [
            { weight: 15, effect: () => setBallOpacity(0.1) }, 
            { weight: 10, effect: subBarsize },               
            { weight: 10, effect: addBarsize },               
            { weight: 15, effect: () => { dx = dx > 0 ? dx + 1 : dx - 1; dy = dy > 0 ? dy + 1 : dy - 1; } }, 
            { weight: 30, effect: spawnRandomBrick },         
            { weight: 20, effect: () => spawnBomb(blockX + blockWidth / 2, blockY + blockHeight / 2) },      
            { weight: 0, effect: () => {} }                  
        ];
        let rand = Math.random() * 100, cumulativeWeight = 0;
        for (let i = 0; i < weightedEffects.length; i++) {
            cumulativeWeight += weightedEffects[i].weight;
            if (rand < cumulativeWeight) return weightedEffects[i].effect;
        }
        return () => {};
    };

    let leafGap = 120; 
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
function loadWebprogrammingStage(){
    startScene("startWebprogramming");
    // canvas.style.backgroundImage = "url(./testImg/Web.png)"; // 배경 이미지 (필요시 변경)
    if (typeof resizeGame === 'function') {
        resizeGame(800, 600);
    }
    
    currentWebPhase = 1; // 페이즈 초기화
    
    // 2. 대망의 1페이즈 (프론트엔드 파트) 함수 호출!
    loadWebPhase1();  


}

// ---------------------------------------------------------
//  Phase 1 : HTML UI (Color Table Gimmick - V4 Row Stacking System)
// ---------------------------------------------------------
function loadWebPhase1() {
    console.log("웹 프로그래밍 1페이즈: HTML 시작 (행 단위 독립 적재 시스템)");
    
    bricks = []; bombs = []; brokenBricksCount = 0; 
    totalBricks = 9999; // 💡 오직 보스 처치로만 클리어 판정 제어
    resetBallAndPaddle(); 

    // 1. 메인 보스 (HTML UI)
    let feBoss = new BossBrick(340, 60, { 
        color: "#E44D26", text: "색상 출력하기 테이블", hp: 10, realType: "BOSS",
        width: 120, height: 80,
        effectFunc: () => { checkWebPhaseClear(); } 
    });
    bricks.push(feBoss);

    // 2. '출력하기' 버튼 블록 (행 단위 공백 체크 및 단일 행 생성)
    let createBtn = new Brick(220, 180, {
        color: "#3498DB", text: "출력하기", width: 140, height: 40,
        effectFunc: function() {
            const colors = ["#800000", "#FF0000", "#FFA500", "#FFFF00", "#008000", "#0000FF", "#800080"];
            const rowYs = [260, 300, 340]; // 1행, 2행, 3행의 가상 Y축 좌표 배열
            let blockW = 80;
            let gap = 15;
            let startX = (canvas.width - (colors.length * blockW + (colors.length - 1) * gap)) / 2;

            let rowToFill = null;

            // 💡 2차원 배열 논리: 각 행을 순회하며 '완전히 비어있는 행'을 탐색
            for (let i = 0; i < rowYs.length; i++) {
                let targetY = rowYs[i];
                
                // 현재 검사 중인 행(targetY)에 살아있는 색상 블록이 한 개라도 있는지 필터링
                let aliveBlocksInRow = bricks.filter(b => 
                    b.realType === "COLOR_BLOCK" && b.status !== 0 && b.y === targetY
                );

                // 💡 값이 하나도 남아있지 않아야(Length가 0이어야) 해당 줄이 완전히 Clear된 것으로 판정
                if (aliveBlocksInRow.length === 0) {
                    rowToFill = targetY; // 최초로 발견된 빈 행의 Y좌표 저장
                    break; // 💡 한 줄만 채우고 즉시 루프 탈출 (통으로 채우기 방지)
                }
            }

            // 완전히 비어있는 행이 존재할 때만 한 줄 추가 실행
            if (rowToFill !== null) {
                colors.forEach((c, idx) => {
                    let colorBlock = new Brick(startX + idx * (blockW + gap), rowToFill, {
                        color: c, text: "", width: blockW, height: 30
                    });
                    colorBlock.realType = "COLOR_BLOCK"; // 삭제 및 행 판정용 태그
                    bricks.push(colorBlock);
                });
                console.log(`완전히 비어있는 행(${rowToFill}px)에 한 줄을 새로 설치했습니다.`);
            } else {
                console.log("모든 행에 최소 1개 이상의 블록이 남아있어 새 줄을 추가할 수 없습니다.");
            }
        }
    });

    // 🔥 [무적화] 출력 버튼 HP 고정 (부서지지 않음)
    createBtn.onHit = function() {
        if (typeof this.effectFunc === "function") this.effectFunc();
    };
    bricks.push(createBtn);

    // 3. '없애기' 버튼 블록 (개수와 상관없이 모든 색상 블록 일괄 제거)
    let removeBtn = new Brick(440, 180, {
        color: "#E74C3C", text: "없애기", width: 140, height: 40,
        effectFunc: function() {
            let removedCount = 0;
            // 실시간으로 캔버스에 존재하는 모든 COLOR_BLOCK을 강제 파괴 상태로 전환
            bricks.forEach(b => {
                if (b.realType === "COLOR_BLOCK" && b.status !== 0) {
                    b.status = 0;
                    brokenBricksCount++; 
                    removedCount++;
                }
            });
            console.log(`화면의 색상 블록 ${removedCount}개를 전부 초기화했습니다. 다시 1행부터 추가 가능합니다.`);
        }
    });

    // 🔥 [무적화] 삭제 버튼 HP 고정 (부서지지 않음)
    removeBtn.onHit = function() {
        if (typeof this.effectFunc === "function") this.effectFunc();
    };
    bricks.push(removeBtn);
}
// ---------------------------------------------------------
//  Phase 2  
// ---------------------------------------------------------
function loadWebPhase2() {
    bricks = []; bombs = []; brokenBricksCount = 0; 
    totalBricks = 0;
    bossBombTimer = 0;
    resetBallAndPaddle();

    console.log("웹 프로그래밍 2페이즈: JS가동");
    startScene("startWebprogammingP2");
    let beBoss = new BossBrick(350, 100, { 
        // 💡 2페이즈 전용 백엔드 보스 이미지 삽입
   //     imageSrc: "./testImg/be_boss.png", 
        color: "#2ECC71", text: "Node.js API", hp: 50, realType: "BOSS",
        effectFunc: () => { checkWebPhaseClear(); } 
    });
    beBoss.width = 140;
    beBoss.height = 90;
    bricks.push(beBoss);    

    totalBricks++;
}

// ---------------------------------------------------------
//  Phase 3
// ---------------------------------------------------------
function loadWebPhase3() {
    bricks = []; bombs = []; brokenBricksCount = 0; 
    totalBricks = 0; // 💡 3페이즈는 정상 카운팅으로 복구
    resetBallAndPaddle();

    console.log("웹 프로그래밍 2페이즈: JS가동");

    let dbBoss = new BossBrick(350, 100, { 
        // 💡 3페이즈 전용 데이터베이스 최종 보스 이미지 삽입
      //  imageSrc: "./testImg/db_boss.png", 
        color: "#34495E", text: "MySQL DB", hp: 10, realType: "BOSS",
        effectFunc: () => { checkWebPhaseClear(); } 
    });
    dbBoss.width = 160;
    dbBoss.height = 100;
    bricks.push(dbBoss);
    
    totalBricks++;
}

function checkWebPhaseClear() {
    // 1. 현재 맵에 존재하는 블록 중 진짜 보스("BOSS" 태그)를 찾습니다.
    let boss = bricks.find(b => b.realType === "BOSS");

    // 보스가 존재하고, 그 보스의 상태가 0(파괴됨)일 때만 무조건 통과!
    // (일반 방어벽이 몇 개가 남아있든 완전히 무시합니다)
    if (boss && boss.status === 0) {
        currentWebPhase++; // 페이즈 1 증가
        
        if (currentWebPhase === 2) {
            // 1초 대기 후 2페이즈 로딩 (연출용 여백)
            setTimeout(loadWebPhase2, 1000); 
        } 
        else if (currentWebPhase === 3) {
            // 1초 대기 후 3페이즈 로딩
            setTimeout(loadWebPhase3, 1000);
        } 
        else {
            // 3페이즈(최종 DB 보스)까지 다 깼다면 진짜 스테이지 완전 클리어!
            setTimeout(StageClear, 1000);
        }
    }
}


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
    dialogueArea.style.display = "block";
    gameStartArea.style.display = "none";
    currentScript = allStoryData[sceneName]; 
    currentIndex = 0; 
    showDialogue(); 
}
function showDialogue() {
    const speakerEl = document.getElementById("speaker");
    const dialogueEl = document.getElementById("dialogue");
    if (currentIndex < currentScript.length) {
      const currentLine = currentScript[currentIndex];
      speakerEl.innerText = currentLine.speaker;
      dialogueEl.innerText = currentLine.text;
      const layout = currentLine.layout;
      switch(layout){
        case "flex":
            canvas.style.visibility = "visible";
            break;
        case "none":
            canvas.style.visibility = "hidden";
            gameClearScreen.style.display = "none";
            break;
        case "F":
            //추가 예정
            break;
        case "white":
            questBox.style.backgroundColor = "rgba(143, 143, 143, 0.9)";
            speakerEl.style.backgroundColor = "rgba(143, 143, 143, 0.9)";
            questBox.style.color = "#e3dec3";
            break;
        case "return":
            questBox.style.backgroundColor = "rgba(0, 0, 0, 1)";
            speakerEl.style.backgroundColor = "rgba(0, 0, 0, 1)";
            questBox.style.color = "#ffd700";
            break;
        case "lunchEnd":
            currentStage++;
            break;
      }
  } else {
      if(isGameOver) handleSceneEnd();
      else handleGameStart();
  }
}
function handleGameStart() {
        dialogueArea.style.display = "none";  // 대화 UI 숨기기
        gameStartArea.style.display = "block";
}
function handleSceneEnd() {
    if (currentStage == 4) {
        gameClearScreen.style.display = "flex";
    }
    questBox.style.display = 'none';
    clearBtns.style.visibility = "visible";
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
    if(gamePauseScreen){ gamePauseScreen.style.width = newWidth + "px"; gamePauseScreen.style.height = newHeight + "px"; }
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
  if (e.key === 'Escape' && !isGameOver){
    isGameStarted = false;
    gamePauseScreen.style.display = "flex";
  }
});
startBtn.addEventListener('click', () => {
            questBox.style.display = 'none';
            gameOverScreen.style.display = "none";
            isGameStarted = true; // 스테이지 시작
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
  loadGameData();
});

async function loadGameData() { //웹서버 구축 후 사용 예정
  try {
    const response = await fetch('./scripts.json'); 
    if (!response.ok) throw new Error(`HTTP 상태코드: ${response.status}`);
    
    allStoryData = await response.json();
  } catch (error) {
    console.error("데이터를 불러오는 중 에러 발생:", error);
  }
}
restartBtn.forEach((item)=>{
    item.addEventListener("click", ()=>{ if(isCleared) currentStage--; initGame(); });
});
mainBtn.forEach((item)=>{
    item.addEventListener("click", ()=>{
        switchScreen(mainScreen); // 메인 화면
        gamePauseScreen.style.display = "none";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        resizeGame(600,400);
        canvas.style.backgroundImage = "";
    });
});
nextBtn.addEventListener("click",initGame); //다음으로 버튼
resumeBtn.addEventListener("click",()=>{
    isGameStarted = true;
    gamePauseScreen.style.display = "none";
});
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
    paddleSkinType = val;
});

howToPlayBtn.addEventListener("click",()=>{
    switchScreen(howToPlayModal);
});
closeHowToPlayBtn.addEventListener("click",()=>{
    switchScreen(mainScreen);
});



// 8. 메인 엔진 (게임 루프 및 초기화)
// ==========================================

// === 실시간 점수(100점 만점) 계산 함수 (커트라인 기반 자동 보간) ===
function getCalculatedScore() {
    if (currentStage === 3) return 100; // 점심시간은 무조건 100점(A+)

    let cutlines;
    switch(currentStage) {
        case 0: cutlines = [18, 24, 30, 35, 50]; break; //튜토    
        case 1: cutlines = [29, 35, 45, 55, 65]; break; //이산
        case 2: cutlines = [20, 30, 40, 50, 65]; break; //객지프
        case 4: cutlines = [15, 25, 35, 45, 60]; break; //자구
        case 5: cutlines = [70, 85, 100, 115, 130]; break; //웹프
        default: cutlines = [20, 30, 40, 50, 60];
    }

    let cost = paddleHitCount;
    let score = 100;

    // cost가 커트라인을 넘을 때마다 부드럽게 깎임 (소수점 유지)
    if (cost <= cutlines[0]) {
        score = 100 - (15 * (cost / cutlines[0])); 
    } else if (cost <= cutlines[1]) {
        score = 85 - (15 * ((cost - cutlines[0]) / (cutlines[1] - cutlines[0]))); 
    } else if (cost <= cutlines[2]) {
        score = 70 - (15 * ((cost - cutlines[1]) / (cutlines[2] - cutlines[1]))); 
    } else if (cost <= cutlines[3]) {
        score = 55 - (15 * ((cost - cutlines[2]) / (cutlines[3] - cutlines[2]))); 
    } else if (cost <= cutlines[4]) {
        score = 40 - (10 * ((cost - cutlines[3]) / (cutlines[4] - cutlines[3]))); 
    } else {
        // ★ C등급 이하 (30점 미만) 구간: 코스트 1당 0.3점씩 일정하게 감소
        score = 30 - ((cost - cutlines[4]) * 0.3);
    }

    // 최하점은 0점으로 방어 (Math.floor 삭제하여 소수점 데이터 보존)
    return Math.max(0, score); 
}

// === 점수 기반 학점 변환 함수 ===
function calculateGrade(score, isDead) {
    if (isDead) return "F"; // 죽으면 점수와 무관하게 얄짤없이 F
    
    // 유저님이 지정해주신 점수 컷!
    if (score >= 85) return "A+";
    if (score >= 70) return "A";
    if (score >= 55) return "B+";
    if (score >= 40) return "B";
    if (score >= 30) return "C+";
    return "C"; // 29점 이하 (20점 이하 포함)
}

// === 게임 오버 처리 함수 (죽었을 때 F 학점 렌더링) ===
function endGame(message) {
    isGameOver = true; 
    isGameStarted = false; 
    
    // isDead 자리에 true를 전달하여 F학점 발급
    let finalGrade = calculateGrade(0, true);
    
    gameOverMessage.innerHTML = `${message}<br><br><span style="color:#E74C3C; font-size:32px;">성적 : ${finalGrade}</span>`;
    switchScreen(gameOverScreen); 
}


// === 스테이지 클리어 제어 함수  ===
function StageClear() { 
    if (currentStage === 1) { // 이산수학 미니 스테이지의 경우 (맵 3번 통과해야함)
        clearCount++;
        if (clearCount < gateStageCount) {                           
            bricks = []; brokenBricksCount = 0; totalBricks = 0;
            resetBallAndPaddle(); 
            loadDiscreteStage(); 
            return; 
        } else {
            clearCount = 0;
        }
    }
    // 일반 스테이지이거나 이산수학 최종 보스까지 깼을 경우
    clearGame(); 
}
// === 게임 클리어 처리 함수 ===
function clearGame(){
    isGameOver = true; 
    isGameStarted = false; 
    isCleared = true;
    
    // 상단에 표시되던 100점 만점 SCORE를 가져와서 학점으로 변환!
    let finalScore = getCalculatedScore();
    let finalGrade = calculateGrade(finalScore, false); 
    
    // A는 금색, B는 초록색, C와 F는 빨간색
    let gradeColor = (finalGrade.includes("A")) ? "#FFD700" : (finalGrade.includes("B")) ? "#2ECC71" : "#E74C3C";
    
    const scoreDisplay = document.getElementById("scoreDisplay");
    if(scoreDisplay) {
        scoreDisplay.innerText = finalGrade;
        scoreDisplay.style.color = gradeColor;
        scoreDisplay.style.display = "block";
    }

    switch(currentStage){
        case 0: startScene("clearC_programming"); break;
        case 1: startScene("clearDiscrete"); break;
        case 2: startScene("clearOop"); break;
        case 3: break;
        case 4: startScene("clearDataStructure"); break;
        case 5: startScene("ending"); break;
    }
    
    currentStage++;
    if (currentStage > maxStage) maxStage = currentStage;
    switchScreen(gameClearScreen); 
    clearBtns.style.visibility = "hidden";
}

function resetBallAndPaddle() { //공, 패들 리셋 함수
    x = canvas.width / 2;
    y = canvas.height - 30;
    const startAngle = (Math.random() - 0.5) * Math.PI / 2; 
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
    playerHp = 3;      // 체력 초기화
    specialBalls = []; // 특수공 초기화
    specialBallTimer = 0; // 특수공 생성 타이머 초기화
    bossBombTimer = 0; // 보스 폭탄 생성 타이머 초기화
    
    if (opacityTimeoutId !== null) {
        clearTimeout(opacityTimeoutId); opacityTimeoutId = null;
    }
    
    resizeGame(600,400); //화면 사이즈 조정
    switchScreen(); // UI 숨기기
    gamePauseScreen.style.display = "none";
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
    drawSpecialBalls();
    drawTopUI();

    if(isGameStarted){ //게임 시작 시에만 작동
        if(currentStage == 1) updateCircuits(); //이산스테이지 출력 변화
        collisionDetection();
        updateBall();
        updatePaddle();
        updateBombs();
        updateSpecialBalls();
        if(brokenBricksCount >= totalBricks) StageClear();
    }
    
    // 충돌 감지 직후 승리하여 isGameOver가 true로 바뀌었다면 진행 멈춤
    if (isGameOver) return; 
    animationId = requestAnimationFrame(loop);
}

// 최초 실행시 메인화면 띄우기
switchScreen(mainScreen);
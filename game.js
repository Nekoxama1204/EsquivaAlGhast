const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const rulesDiv = document.getElementById('rules');
const scoreDisplay = document.getElementById('score');
const gameOverDiv = document.getElementById('gameOver');
const highScoresDiv = document.getElementById('highScores');
const scoreList = document.getElementById('scoreList');
const playAgainButton = document.getElementById('playAgain');
const saveScoreButton = document.getElementById('saveScore');
const playerNameInput = document.getElementById('playerName');

let player, squares, balls, score, level, isGameOver, squareSize, squaresFired, canShoot;

const GE1 = new Image();
GE1.src = 'assets/GE1.jpg';
const GE2 = new Image();
GE2.src = 'assets/GE2.jpg';
const jugadorImg = new Image();
jugadorImg.src = 'assets/jugador.jpg';
const bolaImg = new Image();
bolaImg.src = 'assets/bola.png';

function init() {
    player = { x: canvas.width / 2, y: canvas.height / 2, size: 50 };
    squares = [];
    balls = [];
    score = 0;
    level = 1;
    isGameOver = false;
    squareSize =  20;
    squaresFired = 0;
    canShoot = false;

    generateSquares();
    updateScoreDisplay();
    gameOverDiv.classList.add('hidden');
    highScoresDiv.classList.add('hidden');
    rulesDiv.classList.remove('hidden');
}

function generateSquares() {
    squares = [];
    for (let i = 0; i < level * 2; i++) {
        squares.push({
            x: Math.random() * (canvas.width - squareSize),
            y: Math.random() * (canvas.height - squareSize),
            size: squareSize,
            hasFired: false,
            showGE2: false // Estado de animación
        });
    }

    setTimeout(() => {
        canShoot = true;
    }, 1000);
}

function updateScoreDisplay() {
    scoreDisplay.textContent = score;
}

function drawPlayer() {
    ctx.drawImage(jugadorImg, player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
}

function drawSquares() {
    squares.forEach(square => {
        const image = square.showGE2 ? GE2 : GE1;
        ctx.drawImage(image, square.x, square.y, square.size, square.size);
    });
}

function drawBalls() {
    balls.forEach(ball => {
        ctx.drawImage(bolaImg, ball.x - ball.size / 2, ball.y - ball.size / 2, ball.size, ball.size);
    });
}

function moveBalls() {
    balls.forEach(ball => {
        ball.x += Math.cos(ball.direction) * ball.speed;
        ball.y += Math.sin(ball.direction) * ball.speed;

        if (ball.x - ball.size / 2 < 0 || ball.x + ball.size / 2 > canvas.width) {
            ball.direction = Math.PI - ball.direction;
        }
        if (ball.y - ball.size / 2 < 0 || ball.y + ball.size / 2 > canvas.height) {
            ball.direction = -ball.direction;
        }
    });
}

function checkCollisions() {
    balls.forEach(ball => {
        if (Math.sqrt((ball.x - player.x) ** 2 + (ball.y - player.y) ** 2) < (ball.size / 2 + player.size / 2)) {
            gameOver();
        }
    });
}

function gameOver() {
    isGameOver = true;
    gameOverDiv.classList.remove('hidden');
}

function nextLevel() {
    level++;
    score += level * 50;
    updateScoreDisplay();
    balls = [];
    squaresFired = 0;
    canShoot = false;
    squareSize =  (level * 1.9) + squareSize;

    generateSquares();
    setTimeout(() => {
        canShoot = true;
    }, 1000);
}

function activateSquare() {
    if (!canShoot) return;

    for (let i = 0; i < squares.length; i++) {
        let square = squares[i];

        if (!square.hasFired) {
            square.hasFired = true;
            square.showGE2 = true;
            squaresFired++;

            const ball = {
                x: square.x + square.size / 2,
                y: square.y + square.size / 2,
                size: squareSize/2,
                speed: 5,
                direction: Math.random() * Math.PI * 2
            };
            balls.push(ball);

            // Volver a la imagen GE1 después de 0.9 segundos
            setTimeout(() => {
                square.showGE2 = false;
            }, 500);

            if (squaresFired === squares.length) {
                setTimeout(() => {
                    nextLevel();
                }, 4000);
            }
            break;
        }
    }
}

function update() {
    if (isGameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSquares();
    drawPlayer();
    drawBalls();
    moveBalls();
    checkCollisions();

    activateSquare();

    requestAnimationFrame(update);
}

canvas.addEventListener('mousemove', (e) => {
    if (isGameOver) return;
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;
    player.y = e.clientY - rect.top;
});

startButton.addEventListener('click', () => {
    rulesDiv.classList.add('hidden');
    init();
    update();
});

saveScoreButton.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();
    if (playerName) {
        saveScore(playerName, score);
        gameOverDiv.classList.add('hidden');
        showHighScores();
    }
});

playAgainButton.addEventListener('click', () => {
    highScoresDiv.classList.add('hidden');
    init();
    update();
});

function saveScore(name, score) {
    const scores = JSON.parse(localStorage.getItem('scores')) || [];
    scores.push({ name, score });
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem('scores', JSON.stringify(scores));
}

function showHighScores() {
    const scores = JSON.parse(localStorage.getItem('scores')) || [];
    scoreList.innerHTML = '';
    scores.forEach((score, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${score.name}: ${score.score}`;
        scoreList.appendChild(li);
    });
    highScoresDiv.classList.remove('hidden');
}

init();

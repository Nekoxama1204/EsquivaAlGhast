const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 120;

let squares = [];
let balls = [];
let player;
let level = 1;
let score = 0;
let gameOver = false;
let animationFrameId;
let activeSquareIndex = 0;
let allSquaresActivated = false;

const GE1 = new Image();
GE1.src = 'assets/GE1.jpg';
const GE2 = new Image();
GE2.src = 'assets/GE2.jpg';
const playerImg = new Image();
playerImg.src = 'assets/jugador.jpg';
const ballImg = new Image();
ballImg.src = 'assets/bola.png';
const backgroundImg = new Image();
backgroundImg.src = 'assets/fondo.jpg';

document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('playAgain').addEventListener('click', resetGame);
document.getElementById('saveScore').addEventListener('click', saveScore);

function startGame() {
    document.getElementById('rules').style.display = 'none';
    resetGame();
}

function resetGame() {
    // Reiniciar todas las variables del juego
    squares = [];
    balls = [];
    level = 1;
    score = 0;
    gameOver = false;
    activeSquareIndex = 0;
    allSquaresActivated = false;

    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Reiniciar la pantalla de Game Over
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('scoreDisplay').innerText = 'Puntos: 0';

    // Inicializar el nivel
    initializeLevel();

    // Comenzar el bucle del juego
    gameLoop();
}

function initializeLevel() {
    for (let i = 0; i < level * 2; i++) {
        squares.push(new Square());
    }
    activateNextSquare();
}

function Square() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = 30;
    this.image = GE1;
    this.active = false;

    this.draw = function() {
        ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
    };

    this.activate = function() {
        this.active = true;
        this.image = GE2;
        this.size = 50;

        // Disparar hacia el centro con un margen de aleatoriedad
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const angleToCenter = Math.atan2(centerY - this.y, centerX - this.x);
        const angleVariation = (Math.random() - 0.5) * 0.5; // Pequeña variación aleatoria
        const angle = angleToCenter + angleVariation;

        balls.push(new Ball(this.x + this.size / 2, this.y + this.size / 2, angle, level));
    };
}

function Ball(x, y, angle, level) {
    this.x = x;
    this.y = y;
    this.radius = 10 + level * 2; // Bolas más grandes en niveles más altos
    this.speed = 5 + level * 0.5; // Más velocidad en niveles más altos
    this.dx = Math.cos(angle) * this.speed;
    this.dy = Math.sin(angle) * this.speed;
    this.opacity = Math.random() * 0.5 + 0.5; // Opacidad entre 50% y 100%

    this.draw = function() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.drawImage(ballImg, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
    };

    this.update = function() {
        this.x += this.dx;
        this.y += this.dy;

        // Rebote en los bordes
        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.dx *= -1;
        }
        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
            this.dy *= -1;
        }
    };

    this.isOutOfCanvas = function() {
        return (
            this.x + this.radius < 0 ||
            this.x - this.radius > canvas.width ||
            this.y + this.radius < 0 ||
            this.y - this.radius > canvas.height
        );
    };
}

player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 40 - level * 2, // Jugador más pequeño en niveles más altos
    image: playerImg,

    draw: function() {
        ctx.drawImage(this.image, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    },

    update: function(event) {
        const rect = canvas.getBoundingClientRect();
        this.x = event.clientX - rect.left;
        this.y = event.clientY - rect.top;
    }
};

canvas.addEventListener('mousemove', (event) => {
    if (!gameOver) {
        player.update(event);
    }
});

function activateNextSquare() {
    if (activeSquareIndex < squares.length) {
        // Activar varios cuadros al mismo tiempo en niveles más altos
        const simultaneousSquares = Math.min(1 + Math.floor(level / 3), squares.length - activeSquareIndex);
        for (let i = 0; i < simultaneousSquares; i++) {
            squares[activeSquareIndex + i].activate();
        }
        activeSquareIndex += simultaneousSquares;

        // Tiempo entre disparos más corto en niveles más altos
        const delay = Math.max(500, 1000 - level * 50); // Mínimo 500ms
        setTimeout(activateNextSquare, delay);
    } else {
        allSquaresActivated = true;
    }
}

function checkCollisions() {
    balls.forEach((ball, index) => {
        if (Math.hypot(ball.x - player.x, ball.y - player.y) < ball.radius + player.size / 2) {
            gameOver = true;
            endGame();
        }
    });
}

function endGame() {
    cancelAnimationFrame(animationFrameId);
    document.getElementById('gameOver').style.display = 'block';
}

function updateScore() {
    if (!gameOver) {
        score += level * 50;
        document.getElementById('scoreDisplay').innerText = `Puntos: ${score}`;
    }
}

function nextLevel() {
    if (!gameOver) {
        level++;
        squares = [];
        balls = [];
        activeSquareIndex = 0;
        allSquaresActivated = false;
        initializeLevel();
        updateScore();
    }
}

function gameLoop() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    squares.forEach(square => square.draw());
    balls.forEach((ball, index) => {
        ball.update();
        ball.draw();

        // Eliminar bolas que salen del canvas
        if (ball.isOutOfCanvas()) {
            balls.splice(index, 1);
        }
    });

    player.draw();

    checkCollisions();

    // Pasar al siguiente nivel si todas las bolas han desaparecido y todos los cuadros han sido activados
    if (allSquaresActivated && balls.length === 0) {
        nextLevel();
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

function saveScore() {
    const playerName = document.getElementById('playerName').value;
    if (playerName) {
        let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
        highScores.push({ name: playerName, score: score });
        highScores.sort((a, b) => b.score - a.score);
        localStorage.setItem('highScores', JSON.stringify(highScores));
        displayHighScores();
    }
}

function displayHighScores() {
    const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    const highScoresList = document.getElementById('highScores');
    highScoresList.innerHTML = '<h3>Mejores Puntuaciones</h3>';
    highScores.forEach((entry, index) => {
        highScoresList.innerHTML += `<p>${index + 1}. ${entry.name}: ${entry.score}</p>`;
    });
}

window.onload = () => {
    displayHighScores();

    // pa que me deje actualizar jaja
};